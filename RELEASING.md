# Releasing

This document describes the release workflow for `ghawb`.

## Overview

Releases are managed with [Changesets](https://github.com/changesets/changesets). All publishable packages use lockstep versioning — every release bumps all packages to the same version.

## Release Flow

```
1. Add changeset    →  bun x changeset
2. Merge to main    →  Release workflow creates/updates a release PR
3. Merge release PR →  Versions are bumped, CHANGELOG.md is updated
4. Create git tag   →  git tag v<version> && git push --tags
5. Publish workflow →  JSR publish + GitHub Release
```

### Step 1: Add a Changeset

When making a user-facing change, add a changeset before merging to `main`:

```bash
bun x changeset
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

The [Publish workflow](.github/workflows/publish.yml) triggers on `v*` tags and runs two jobs:

1. **Publish to JSR** — Publishes all packages to the JSR registry.
2. **Create GitHub Release** — After JSR succeeds, creates a GitHub Release with auto-generated release notes.

## Required Secrets

| Secret         | Purpose                                  |
| -------------- | ---------------------------------------- |
| `GITHUB_TOKEN` | Provided automatically by GitHub Actions |

JSR publishing uses OIDC (`id-token: write` permission) — no additional secret is needed.

## Lockstep Versioning

All publishable packages are in a [fixed version group](https://github.com/changesets/changesets/blob/main/docs/fixed-packages.md). A changeset affecting any package bumps all packages to the same version. This keeps inter-package dependencies aligned.

## Dry Run

To verify the publish pipeline locally without pushing to a registry:

```bash
bun install --frozen-lockfile
bun run check
bun x jsr publish --dry-run
```

The dry run validates JSR package metadata without publishing.

## Version Files

A release updates versions in these files:

| File                      | Updated By                     |
| ------------------------- | ------------------------------ |
| `packages/*/package.json` | Changesets                     |
| `packages/*/jsr.json`     | Manual or scripted (see below) |
| `CHANGELOG.md`            | Changesets                     |

> **Note:** Changesets updates `package.json` versions automatically. JSR `jsr.json` versions must be kept in sync manually or via a post-version script until Changesets adds native JSR support.

## Runtime Baseline

Release workflows use Bun and publish source-first packages to JSR. Deno compatibility remains covered by the repository verification path.
