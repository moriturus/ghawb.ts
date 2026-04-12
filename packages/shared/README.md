# @ghawb/shared

Shared low-level types and validation utilities used by the `ghawb` packages.

## Install

```bash
bunx jsr add @ghawb/shared
```

For Deno:

```bash
deno add jsr:@ghawb/shared
```

## What It Provides

- Branded type helpers
- Shared identifier validation
- Shared validation error primitives

Most users should start with `@ghawb/sdk` instead. Use this package directly only when building integrations or companion packages that need the same identifier and error contracts.
