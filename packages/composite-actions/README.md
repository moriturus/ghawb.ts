# @ghawb/composite-actions

Builder API for authoring GitHub composite action metadata in TypeScript and rendering deterministic `action.yml` payloads.

## Install

```bash
bunx jsr add @ghawb/composite-actions
```

For Deno:

```bash
deno add jsr:@ghawb/composite-actions
```

## Example

```ts
import { defineCompositeAction } from "@ghawb/composite-actions";

export default defineCompositeAction({
  name: "Setup Project",
  description: "Install dependencies and run checks",
})
  .input("token", {
    description: "GitHub token",
    required: true,
  })
  .run("bun install --frozen-lockfile", {
    name: "Install",
    shell: "bash",
  })
  .run("bun run check", {
    name: "Check",
    shell: "bash",
  })
  .build();
```

Use `@ghawb/cli` to render the built action definition to `action.yml`.
