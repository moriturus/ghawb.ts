# GitHub Actions Workflow Syntax Coverage

Current syntax support status of the `@ghawb/sdk` against the [GitHub Actions workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions).

Legend: ✅ Supported · ⚠️ Partial · ❌ Not supported

---

## Top-Level Workflow Keys

| Key | Status | Builder API | Notes |
|-----|--------|-------------|-------|
| `name` | ✅ | `defineWorkflow({ name })` | Required |
| `run-name` | ✅ | `.runName(str)` | Optional; trimmed at build |
| `on` | ✅ | `.onPush()`, `.onEvent()`, etc. | At least one trigger required |
| `permissions` | ✅ | `.permissions(perms)` | Map or shorthand (`read-all` / `write-all`) |
| `env` | ✅ | `.env(map)` | Keys must be non-blank |
| `defaults.run` | ✅ | `.defaultsRun({ shell?, workingDirectory? })` | `shell` and `working-directory` |
| `concurrency` | ✅ | `.concurrency({ group, cancelInProgress? })` | |
| `jobs` | ✅ | `.addJob(id, cb)` | Steps-based or reusable-workflow |

---

## Triggers (`on`)

### Filtered Triggers

| Trigger | Status | Builder API | Supported Filters |
|---------|--------|-------------|-------------------|
| `push` | ✅ | `.onPush(filter?)` | `branches`, `branches-ignore`, `paths`, `paths-ignore`, `tags`, `tags-ignore` |
| `pull_request` | ✅ | `.onPullRequest(filter?)` | `branches`, `branches-ignore`, `paths`, `paths-ignore`, `types` |
| `pull_request_target` | ✅ | `.onPullRequestTarget(filter?)` | Same as `pull_request` |

### Special Triggers

| Trigger | Status | Builder API | Config |
|---------|--------|-------------|--------|
| `workflow_dispatch` | ✅ | `.onWorkflowDispatch(inputs?)` | `inputs` with 5 types: `string`, `boolean`, `choice`, `number`, `environment` |
| `workflow_call` | ✅ | `.onWorkflowCall(config?)` | `inputs`, `outputs`, `secrets` |
| `workflow_run` | ✅ | `.onWorkflowRun(config)` | `workflows` (required), `types`, `branches` / `branches-ignore` |
| `schedule` | ✅ | `.onSchedule(crons)` | Cron expression array; format validated |

### Simple Event Triggers

All use `.onEvent(type, { types? })`.

| Trigger | Status | Activity Types |
|---------|--------|----------------|
| `check_run` | ✅ | `created`, `rerequested`, `completed`, `requested_action` |
| `check_suite` | ✅ | `completed`, `requested`, `rerequested` |
| `create` | ✅ | _(bare event)_ |
| `delete` | ✅ | _(bare event)_ |
| `deployment` | ✅ | _(bare event)_ |
| `deployment_status` | ✅ | _(bare event)_ |
| `discussion` | ✅ | `created`, `edited`, `deleted`, `transferred`, `pinned`, `unpinned`, `labeled`, `unlabeled`, `locked`, `unlocked`, `category_changed`, `answered`, `unanswered` |
| `discussion_comment` | ✅ | `created`, `edited`, `deleted` |
| `fork` | ✅ | _(bare event)_ |
| `gollum` | ✅ | _(bare event)_ |
| `issue_comment` | ✅ | `created`, `edited`, `deleted` |
| `issues` | ✅ | `opened`, `edited`, `deleted`, `transferred`, `pinned`, `unpinned`, `closed`, `reopened`, `assigned`, `unassigned`, `labeled`, `unlabeled`, `locked`, `unlocked`, `milestoned`, `demilestoned` |
| `label` | ✅ | `created`, `edited`, `deleted` |
| `member` | ✅ | `added`, `edited`, `removed` |
| `merge_group` | ✅ | `checks_requested`, `destroyed` |
| `milestone` | ✅ | `created`, `closed`, `opened`, `edited`, `deleted` |
| `page_build` | ✅ | _(bare event)_ |
| `public` | ✅ | _(bare event)_ |
| `registry_package` | ✅ | `published`, `updated` |
| `release` | ✅ | `published`, `unpublished`, `created`, `edited`, `deleted`, `prereleased`, `released` |
| `repository_dispatch` | ✅ | Arbitrary non-blank strings (no fixed allowlist) |
| `status` | ✅ | _(bare event)_ |
| `watch` | ✅ | `started` |

### Not Yet Supported Triggers

| Trigger | Notes |
|---------|-------|
| `branch_protection_rule` | |
| `deployment_protection_rule` | |
| `installation` | GitHub App event |
| `installation_repositories` | GitHub App event |
| `installation_target` | GitHub App event |
| `project` | Deprecated (classic projects) |
| `project_card` | Deprecated (classic projects) |
| `project_column` | Deprecated (classic projects) |

---

## Jobs

### Step-Based Job Keys

| Key | Status | Builder API | Notes |
|-----|--------|-------------|-------|
| `name` | ✅ | `.displayName(str)` | Optional display name |
| `if` | ✅ | `.ifCondition(expr)` | |
| `needs` | ✅ | `.needs(deps)` | Referential validation against declared jobs |
| `runs-on` | ✅ | `.runsOn(target)` | String or string array; `RunnerLabel` constants available |
| `environment` | ✅ | `.environment(env)` | String or `{ name, url? }` |
| `concurrency` | ✅ | `.concurrency(config)` | `{ group, cancelInProgress? }` |
| `outputs` | ✅ | `.outputs(map)` | `steps.<id>` referential validation |
| `defaults.run` | ✅ | `.defaultsRun(config)` | `shell`, `working-directory` |
| `env` | ✅ | `.env(map)` | |
| `permissions` | ✅ | `.permissions(perms)` | |
| `timeout-minutes` | ✅ | `.timeoutMinutes(n)` | Positive integer |
| `continue-on-error` | ✅ | `.continueOnError(bool)` | |
| `strategy.matrix` | ✅ | `.strategyMatrix(axes)` | Axis names validated; non-empty arrays |
| `strategy.fail-fast` | ✅ | `.strategyFailFast(bool)` | |
| `strategy.max-parallel` | ✅ | `.strategyMaxParallel(n)` | |
| `strategy.matrix.include` | ✅ | `.strategyInclude(entries)` | |
| `strategy.matrix.exclude` | ✅ | `.strategyExclude(entries)` | Must reference declared axes |
| `container` | ✅ | `.container(config)` | See Container section |
| `services` | ✅ | `.services(map)` | |
| `steps` | ✅ | `.run()` / `.uses()` | |

### Reusable-Workflow Job Keys

| Key | Status | Builder API | Notes |
|-----|--------|-------------|-------|
| `uses` | ✅ | `.usesWorkflow(ref, opts?)` | `owner/repo/path@ref` format |
| `with` | ✅ | via options | Input bindings |
| `secrets` | ✅ | via options | Map or `'inherit'` |
| `name`, `if`, `needs`, `permissions`, `continue-on-error` | ✅ | Same as step-based | |
| `runs-on`, `container`, `services`, `environment`, `steps` | — | _Rejected_ | Not applicable to reusable-workflow jobs |

---

## Steps

| Key | Status | Builder API | Notes |
|-----|--------|-------------|-------|
| `name` | ✅ | metadata arg | |
| `id` | ✅ | metadata arg | Unique within job; identifier format enforced |
| `if` | ✅ | metadata arg | |
| `run` | ✅ | `.run(cmd, meta?)` | |
| `uses` | ✅ | `.uses(action, meta?)` | Raw string reference |
| `with` | ✅ | metadata arg | `Record<string, string>` |
| `env` | ✅ | metadata arg | |
| `shell` | ✅ | metadata arg | Run steps only |
| `working-directory` | ✅ | metadata arg | Run steps only |
| `continue-on-error` | ✅ | metadata arg | Boolean |
| `timeout-minutes` | ✅ | metadata arg | Positive integer |

---

## Container Configuration

| Field | Status | Notes |
|-------|--------|-------|
| `image` | ✅ | Required; non-blank |
| `credentials` | ✅ | `{ username, password }` |
| `env` | ✅ | |
| `ports` | ✅ | Number or string |
| `volumes` | ✅ | String array |
| `options` | ✅ | Docker CLI options |

---

## Permissions

### Keys

| Key | Status | Allowed Levels |
|-----|--------|----------------|
| `actions` | ✅ | `read`, `write`, `none` |
| `artifact-metadata` | ✅ | `read`, `write`, `none` |
| `attestations` | ✅ | `read`, `write`, `none` |
| `checks` | ✅ | `read`, `write`, `none` |
| `contents` | ✅ | `read`, `write`, `none` |
| `deployments` | ✅ | `read`, `write`, `none` |
| `discussions` | ✅ | `read`, `write`, `none` |
| `id-token` | ✅ | `write`, `none` (no `read`) |
| `issues` | ✅ | `read`, `write`, `none` |
| `models` | ✅ | `read`, `none` (no `write`) |
| `packages` | ✅ | `read`, `write`, `none` |
| `pages` | ✅ | `read`, `write`, `none` |
| `pull-requests` | ✅ | `read`, `write`, `none` |
| `security-events` | ✅ | `read`, `write`, `none` |
| `statuses` | ✅ | `read`, `write`, `none` |

### Shorthand

| Shorthand | Status |
|-----------|--------|
| `read-all` | ✅ |
| `write-all` | ✅ |

---

## Runner Labels (`RunnerLabel`)

| Constant | Value |
|----------|-------|
| `UbuntuLatest` | `ubuntu-latest` |
| `Ubuntu2404` | `ubuntu-24.04` |
| `Ubuntu2204` | `ubuntu-22.04` |
| `WindowsLatest` | `windows-latest` |
| `Windows2025` | `windows-2025` |
| `Windows2022` | `windows-2022` |
| `MacosLatest` | `macos-latest` |
| `Macos15` | `macos-15` |
| `Macos14` | `macos-14` |
| `Macos13` | `macos-13` |
| `MacosLarge15` | `macos-15-large` |
| `MacosLarge14` | `macos-14-large` |
| `MacosLarge13` | `macos-13-large` |
| `MacosXlarge15` | `macos-15-xlarge` |
| `MacosXlarge14` | `macos-14-xlarge` |
| `MacosXlarge13` | `macos-13-xlarge` |

Custom or self-hosted string labels are always accepted via `string` fallback.

---

## Expression Helpers

The SDK provides an expression helper API for constructing GitHub Actions `${{ }}` expression strings without raw interpolation.

| Helper | API | Output Example |
|--------|-----|----------------|
| Expression wrapper | `expr(content)` | `${{ github.ref }}` |
| `github` context | `github(property)` | `github.ref` |
| `env` context | `env(name)` | `env.MY_VAR` |
| `secrets` context | `secrets(name)` | `secrets.TOKEN` |
| `matrix` context | `matrix(key)` | `matrix.os` |
| `inputs` context | `inputs(name)` | `inputs.target` |
| `steps` outputs | `steps(id).outputs(name)` | `steps.build.outputs.result` |
| `success()` | `success()` | `success()` |
| `always()` | `always()` | `always()` |
| `cancelled()` | `cancelled()` | `cancelled()` |
| `failure()` | `failure()` | `failure()` |

Helpers compose via template literals: `expr(\`${github("ref")} == 'refs/heads/main'\`)` produces `${{ github.ref == 'refs/heads/main' }}`.

All existing raw `string` entry points remain backward compatible. Empty or blank content is rejected at construction time. Semantic expression evaluation is an explicit non-goal for this MVP.

---

## Not Yet Supported Features

| Feature | Notes |
|---------|-------|
| Typed action wrappers (`actions/checkout`, etc.) | Backlog Item 46 |
| Composite actions | Actions-level construct, not workflow-level |
| `runs-on.group` / `runs-on.labels` object form | |
| Reusable workflow `outputs` at caller side | |
| Step-level `uses` type-safe `with` | Backlog Item 46 |
