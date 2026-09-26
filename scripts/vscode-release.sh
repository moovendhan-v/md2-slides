#!/usr/bin/env bash
# Cut a new release of the VS Code extension.
#
#   ./scripts/vscode-release.sh patch|minor|major|1.2.3 ["Changelog line"]
#
# Bumps vscode-extension/package.json, adds a CHANGELOG entry, commits and
# tags `vscode-v<version>`. Pushing the tag triggers the "VS Code extension"
# GitHub workflow, which builds, tests and publishes the release.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT="$ROOT/vscode-extension"
BUMP="${1:-}"
NOTE="${2:-Maintenance release.}"
[ -n "$BUMP" ] || { sed -n '2,8p' "$0"; exit 1; }

cd "$ROOT"
[ -z "$(git status --porcelain)" ] || { echo "✗ Commit or stash your changes first."; exit 1; }

echo "→ Checking the build"
npm run vscode:build --silent

VERSION="$(cd "$EXT" && npm version "$BUMP" --no-git-tag-version | tr -d 'v')"
TAG="vscode-v$VERSION"
{ printf '# Changelog\n\n## %s — %s\n\n- %s\n' "$VERSION" "$(date +%Y-%m-%d)" "$NOTE"; tail -n +2 "$EXT/CHANGELOG.md"; } > "$EXT/CHANGELOG.tmp"
mv "$EXT/CHANGELOG.tmp" "$EXT/CHANGELOG.md"

git add "$EXT/package.json" "$EXT/CHANGELOG.md"
git commit -m "Release VS Code extension $VERSION"
git tag -a "$TAG" -m "md2slides VS Code extension $VERSION"
echo "✓ Tagged $TAG"

read -r -p "Push the commit and tag now to publish? [y/N] " yn
if [[ "$yn" =~ ^[Yy]$ ]]; then
  git push origin HEAD "$TAG"
  echo "✓ Pushed. Follow the 'VS Code extension' workflow in GitHub Actions."
else
  echo "Run when ready:  git push origin HEAD $TAG"
fi
