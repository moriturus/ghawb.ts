# @ghawb/cli

Bun-first CLI for rendering `ghawb` workflow and composite-action modules into YAML files.

## Install

```bash
bunx jsr add @ghawb/cli
```

For Deno:

```bash
deno add jsr:@ghawb/cli
```

## Usage

```bash
ghawb render --input workflows/ci.ts --output .github/workflows/ci.yml
```

Render multiple targets:

```bash
ghawb render \
  --input workflows/ci.ts \
  --output .github/workflows/ci.yml \
  --input actions/setup/action.ts \
  --output actions/setup/action.yml
```

Use a bulk render plan:

```bash
ghawb render --bulk ghawb.render.json
```

## Notes

The CLI loads TypeScript modules at runtime and expects each input module to default-export either a workflow definition from `@ghawb/sdk` or a composite action definition from `@ghawb/composite-actions`.
