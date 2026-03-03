#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: npm run release -- [patch|minor|major|x.y.z]" >&2
}

is_bump_type() {
  case "$1" in
    patch|minor|major)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

validate_input() {
  local requested="$1"

  if is_bump_type "$requested"; then
    return 0
  fi

  if [[ "$requested" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]]; then
    return 0
  fi

  usage
  exit 1
}

read_package_field() {
  local field="$1"
  node -e "const pkg = require('./package.json'); console.log(pkg[process.argv[1]]);" "$field"
}

increment_version() {
  local version="$1"
  local bump="$2"

  node - "$version" "$bump" <<'NODE'
const [version, bump] = process.argv.slice(2);
const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);

if (!match) {
  console.error(`Unsupported version for auto-increment: ${version}`);
  process.exit(1);
}

if (match[4]) {
  console.error(`Cannot auto-increment prerelease version: ${version}`);
  process.exit(1);
}

let [major, minor, patch] = match.slice(1, 4).map(Number);

switch (bump) {
  case "patch":
    patch += 1;
    break;
  case "minor":
    minor += 1;
    patch = 0;
    break;
  case "major":
    major += 1;
    minor = 0;
    patch = 0;
    break;
  default:
    console.error(`Unsupported bump type: ${bump}`);
    process.exit(1);
}

console.log(`${major}.${minor}.${patch}`);
NODE
}

stable_version_gt() {
  local left="$1"
  local right="$2"

  node - "$left" "$right" <<'NODE'
const [left, right] = process.argv.slice(2);

function parse(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (!match) {
    console.error(`Expected a stable semver version, received: ${version}`);
    process.exit(1);
  }

  return match.slice(1).map(Number);
}

const a = parse(left);
const b = parse(right);

for (let index = 0; index < 3; index += 1) {
  if (a[index] > b[index]) {
    console.log("true");
    process.exit(0);
  }

  if (a[index] < b[index]) {
    console.log("false");
    process.exit(0);
  }
}

console.log("false");
NODE
}

load_npm_time_json() {
  local package_name="$1"
  local stdout_file
  local stderr_file
  local status

  if [[ -n "${RELEASE_NPM_TIME_JSON:-}" ]]; then
    printf '%s\n' "$RELEASE_NPM_TIME_JSON"
    return 0
  fi

  stdout_file="$(mktemp)"
  stderr_file="$(mktemp)"
  status=0

  if npm view "$package_name" time --json >"$stdout_file" 2>"$stderr_file"; then
    status=0
  else
    status=$?
  fi

  if [[ "$status" -eq 0 ]]; then
    cat "$stdout_file"
    rm -f "$stdout_file" "$stderr_file"
    return 0
  fi

  if rg -q 'E404|404' "$stderr_file"; then
    rm -f "$stdout_file" "$stderr_file"
    printf '{}\n'
    return 0
  fi

  cat "$stderr_file" >&2
  rm -f "$stdout_file" "$stderr_file"
  exit 1
}

version_has_been_used() {
  local version="$1"

  NPM_TIME_JSON="$NPM_TIME_JSON" node - "$version" <<'NODE'
const version = process.argv[2];

let data = {};

try {
  data = JSON.parse(process.env.NPM_TIME_JSON || "{}");
} catch (error) {
  console.error("Could not parse npm release history.");
  process.exit(2);
}

process.exit(Object.prototype.hasOwnProperty.call(data, version) ? 0 : 1);
NODE
}

resolve_target_version() {
  local current_version="$1"
  local requested="$2"
  local strategy=""
  local candidate=""

  if is_bump_type "$requested"; then
    strategy="$requested"
    candidate="$(increment_version "$current_version" "$requested")"
  else
    candidate="$requested"

    if [[ "$requested" =~ - ]]; then
      if version_has_been_used "$candidate"; then
        echo "Requested prerelease version $candidate has already been used on npm." >&2
        exit 1
      fi

      printf '%s\n' "$candidate"
      return 0
    fi

    strategy="patch"

    if [[ "$(stable_version_gt "$requested" "$current_version")" != "true" ]]; then
      echo "Requested version $requested is not ahead of current version $current_version. Searching from the next patch version instead." >&2
      candidate="$(increment_version "$current_version" "$strategy")"
    fi
  fi

  while version_has_been_used "$candidate"; do
    echo "Version $candidate has already been used on npm. Trying the next $strategy version." >&2
    candidate="$(increment_version "$candidate" "$strategy")"
  done

  printf '%s\n' "$candidate"
}

sync_readme_version() {
  local version="$1"

  if [[ ! -f README.md ]]; then
    return 0
  fi

  if ! rg -q '^Current version: \*\*[^*]+\*\*$' README.md; then
    return 0
  fi

  perl -0pi -e 's/^Current version: \*\*[^*]+\*\*$/Current version: **'"$version"'**/m' README.md
}

stage_version_files() {
  git add package.json

  if [[ -f package-lock.json ]]; then
    git add package-lock.json
  fi

  if [[ -f npm-shrinkwrap.json ]]; then
    git add npm-shrinkwrap.json
  fi

  if [[ -f README.md ]]; then
    git add README.md
  fi
}

main() {
  local requested="${1:-patch}"
  local current_branch
  local current_version
  local package_name
  local target_version
  local new_tag
  validate_input "$requested"

  current_branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$current_branch" != "main" ]]; then
    echo "Release must be run from main. Current branch: $current_branch" >&2
    exit 1
  fi

  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Working tree is not clean. Commit or stash changes before releasing." >&2
    exit 1
  fi

  git fetch origin main --tags
  git pull --rebase origin main

  package_name="$(read_package_field name)"
  current_version="$(read_package_field version)"
  NPM_TIME_JSON="$(load_npm_time_json "$package_name")"
  target_version="$(resolve_target_version "$current_version" "$requested")"

  if [[ "$target_version" == "$current_version" ]]; then
    npm version --no-git-tag-version --allow-same-version "$target_version" >/dev/null
  else
    npm version --no-git-tag-version "$target_version" >/dev/null
  fi
  sync_readme_version "$target_version"
  stage_version_files

  git commit --allow-empty -m "chore(release): $target_version"
  new_tag="v$target_version"
  git tag "$new_tag"

  git push origin main --follow-tags
  npm publish

  echo "Release complete: $target_version"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
