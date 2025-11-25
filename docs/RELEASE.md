# Release Process

This document describes the safe release workflow using feature branches.

## Overview

We use a feature branch workflow for releases to:
- Allow review before publishing
- Prevent accidental pushes directly to master
- Make rollbacks easier if issues are discovered

## Release Steps

### 1. Prepare Release Branch

Start from a clean master branch:

```bash
# Ensure you're on master and up to date
git checkout master
git pull origin master

# Create release branch
git checkout -b release/v<version>
# Example: git checkout -b release/v3.7.1
```

### 2. Bump Version (Without Git Operations)

Update the version without triggering git hooks:

```bash
# Bump version (use patch, minor, or major as appropriate)
npm version <type> --no-git-tag-version

# Examples:
# npm version patch --no-git-tag-version  # 3.7.1 -> 3.7.2
# npm version minor --no-git-tag-version  # 3.7.1 -> 3.8.0
# npm version major --no-git-tag-version  # 3.7.1 -> 4.0.0
```

This updates `package.json` and `package-lock.json` without creating a git commit or tag.

### 3. Update e2e Package

Update the e2e test app to use the new version:

```bash
# Edit e2e/cra/package.json manually
# Update the dependency version to match the new version:
# "@amboss-mededu/react-simple-wysiwyg": "3.7.1"
```

### 4. Commit Changes

```bash
# Add all version-related changes
git add package.json package-lock.json e2e/cra/package.json

# Commit with a clear message
git commit -m "chore: bump version to <version>"
# Example: git commit -m "chore: bump version to 3.7.1"
```

### 5. Push and Create PR

```bash
# Push the release branch
git push -u origin release/v<version>

# Create PR using GitHub CLI (optional)
gh pr create --title "Release v<version>" --body "Release version <version>"

# Or create PR manually through GitHub web interface
```

### 6. Review and Merge

- Get the PR reviewed
- Run CI checks
- Merge to master once approved

### 7. Publish Release

After the PR is merged to master:

```bash
# Checkout master and pull
git checkout master
git pull origin master

# Create and push tag
git tag v<version>
git push origin v<version>

# Publish to npm registry
npm publish
```

## Example: Releasing v3.7.1

```bash
# 1. Create release branch
git checkout master
git pull origin master
git checkout -b release/v3.7.1

# 2. Bump version
npm version minor --no-git-tag-version
# This changes version from 3.7.1-beta.0 to 3.7.1

# 3. Update e2e/cra/package.json
# Change "@amboss-mededu/react-simple-wysiwyg": "3.7.1-beta.0"
# To:     "@amboss-mededu/react-simple-wysiwyg": "3.7.1"

# 4. Commit
git add package.json package-lock.json e2e/cra/package.json
git commit -m "chore: bump version to 3.7.1"

# 5. Push and create PR
git push -u origin release/v3.7.1
gh pr create --title "Release v3.7.1" --body "Release version 3.7.1"

# 6. Get PR reviewed and merged

# 7. After merge, publish
git checkout master
git pull origin master
git tag v3.7.1
git push origin v3.7.1
npm publish
```

## Beta/Pre-releases

For beta releases, keep the prerelease suffix:

```bash
# Use prerelease version type
npm version prerelease --no-git-tag-version --preid=beta
# This increments: 3.7.1-beta.0 -> 3.7.1-beta.1

# Then follow the same PR workflow
# When publishing, use the beta tag:
npm publish --tag beta
```

## Notes

- The `postversion` hook in package.json automatically pushes after `npm version`, which is why we use `--no-git-tag-version`
- Always start from master to ensure you have the latest changes
- Update e2e to match the stable version being released
- Tags should follow semantic versioning: `v<major>.<minor>.<patch>`
