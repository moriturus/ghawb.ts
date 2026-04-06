# Releasing

This document describes the release workflow for `ghawb`.

## Overview

Releases are managed with [Changesets](https://github.com/changesets/changesets). All three packages (`@ghawb/sdk`, `@ghawb/shared`, `@ghawb/cli`) use lockstep versioning — every release bumps all packages to the same version.

## Release Flow

```
1. Add changeset    →  npx changeset
2. Merge to main    →  Release workflow creates/updates a release PR
3. Merge release PR →  Versions are bumped, CHANGELOG.md is updated
4. Create git tag   →  git tag v<version> && git push --tags
5. Publish workflow →  npm + JSR publish + GitHub Release
```

### Step 1: Add a Changeset

When making a user-facing change, add a changeset before merging to `main`:

```bash
npx changeset
```

Select the packages affected and the semver bump type (`patch`, `minor`, or `major`). The changeset is committed as a markdown file in `.changeset/`.

### Step 2: Release PR

On every push to `main`, the [Release workflow](.github/workflows/release.yml) runs:

- If pending changesets exist, it creates (or updates) a **release PR** titled `chore(release): version packages`.
- The PR contains version bumps across all `package.json` and `jsr.json` files, plus aggregated `CHANGELOG.md` entries.
- If no changesets are pending, no PR is created.

### Step 3: Merge the Release PR

Review and merge the release PR. This lands the version bumps and changelog updates on `main`.

### Step 4: Create a Git Tag

After the release PR is merged, create a git tag matching the new version:

```bash
git pull origin main
git tag v0.2.0
git push origin v0.2.0
```

### Step 5: Publish

The [Publish workflow](.github/workflows/publish.yml) triggers on `v*` tags and runs three jobs:

1. **Publish to npm** — Builds all packages, runs tests, then publishes `@ghawb/shared`, `@ghawb/sdk`, and `@ghawb/cli` to the npm registry.
2. **Publish to JSR** — Publishes all packages to the JSR registry.
3. **Create GitHub Release** — After npm and JSR succeed, creates a GitHub Release with auto-generated release notes.

## Required Secrets

| Secret         | Purpose                                  |
| -------------- | ---------------------------------------- |
| `NPM_TOKEN`    | npm publish authentication               |
| `GITHUB_TOKEN` | Provided automatically by GitHub Actions |

JSR publishing uses OIDC (`id-token: write` permission) — no additional secret is needed.

## Lockstep Versioning

All three packages are in a [fixed version group](https://github.com/changesets/changesets/blob/main/docs/fixed-packages.md). A changeset affecting any package bumps all three to the same version. This keeps `@ghawb/sdk`'s dependency on `@ghawb/shared` and `@ghawb/cli`'s dependency on `@ghawb/sdk` always aligned.

## Dry Run

To verify the publish pipeline locally without pushing to a registry:

```bash
# Build all packages
tsc -p packages/shared/tsconfig.build.json
tsc -p packages/sdk/tsconfig.build.json
tsc -p packages/cli/tsconfig.build.json

# Dry-run npm publish for each package
npm publish --workspace packages/shared --access public --dry-run
npm publish --workspace packages/sdk --access public --dry-run
npm publish --workspace packages/cli --access public --dry-run
```

The dry run prints the package tarball contents and metadata without publishing.

## Version Files

A release updates versions in these files:

| File                           | Updated By                     |
| ------------------------------ | ------------------------------ |
| `packages/sdk/package.json`    | Changesets                     |
| `packages/shared/package.json` | Changesets                     |
| `packages/cli/package.json`    | Changesets                     |
| `packages/sdk/jsr.json`        | Manual or scripted (see below) |
| `packages/shared/jsr.json`     | Manual or scripted (see below) |
| `packages/cli/jsr.json`        | Manual or scripted (see below) |
| `CHANGELOG.md`                 | Changesets                     |

> **Note:** Changesets updates `package.json` versions automatically. JSR `jsr.json` versions must be kept in sync manually or via a post-version script until Changesets adds native JSR support.

## Node Baseline

Release workflows use Node 24 to match the project's documented [Node 24+ support baseline](SUPPORT.md).
