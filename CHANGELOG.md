# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Removed npm registry/package-manager support from project distribution.
- Made Bun the default project runtime while retaining Deno compatibility.
- Limited package publishing to JSR.
- Renamed `@ghawb/yaml-import` to `@ghawb/reusable-workflow-import` and `YamlImportError` to `ReusableWorkflowImportError`.

## [0.1.0] - 2026-04-03

### Added

- Core workflow builder SDK (`@ghawb/sdk`) with immutable AST construction, deterministic YAML rendering, and comprehensive validation.
- Shared types and identifier validation library (`@ghawb/shared`).
- CLI tool (`@ghawb/cli`) for batch YAML generation from TypeScript workflow modules.
- Full GitHub Actions workflow syntax coverage: triggers (push, pull_request, pull_request_target, workflow_dispatch, workflow_call, workflow_run, schedule, and all simple event triggers), jobs with dependency graphs (`needs`), matrix strategies (include/exclude/fail-fast/max-parallel), steps (run, uses, composite), permissions, concurrency, environment variables, defaults, deployment environments, containers and services, job/step conditionals and continue-on-error, timeout-minutes, step IDs and job outputs.
- Typed runner labels (`RunnerLabel`) replacing raw strings for `runs-on` configuration.
- Typed action references (`ActionRef`) and reusable workflow references (`WorkflowRef`) with factory functions `actionRef()` and `workflowRef()` providing compile-time and runtime validation.
- Reusable workflow support via `workflow_call` trigger and reusable workflow jobs with `uses`, `with`, and `secrets` (including `inherit`).
- Display name fields: workflow `run-name` and job `name`.
- Identifier format validation for workflow names, job IDs, step IDs, input names, output names, secret names, environment names, and concurrency group expressions.
- Cross-runtime conformance test suite (Bun, Node, Deno).
- Self-hosted CI workflow built with ghawb itself.
- JSR package metadata for source-first publishing.
- `CHANGELOG.md`, `SECURITY.md`, and `SUPPORT.md` governance documents.
