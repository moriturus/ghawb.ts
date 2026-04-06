import { describe, expect, it } from "vitest";

import { createCompositeActionRenderPayload, defineCompositeAction } from "./index.js";

describe("@ghawb/composite-actions", () => {
  it("builds a composite action with ordered metadata, inputs, outputs, and steps", () => {
    const action = defineCompositeAction({
      name: "Setup Bun",
      description: "Install dependencies and expose the cache path",
    })
      .input("bun-version", {
        description: "Bun version to install",
        required: true,
        default: "1.3.11",
      })
      .output("cache-path", {
        description: "Resolved cache directory",
        value: "${{ steps.cache.outputs.path }}",
      })
      .uses("actions/checkout@v6", {
        name: "Checkout",
        id: "checkout",
        if: "${{ github.event_name != 'schedule' }}",
      })
      .run("echo cache-path=$HOME/.bun/install/cache >> $GITHUB_OUTPUT", {
        name: "Expose Cache",
        id: "cache",
        env: {
          HOME: "/home/runner",
        },
        shell: "bash",
        workingDirectory: "./tooling",
      })
      .build();

    expect(action).toEqual({
      name: "Setup Bun",
      description: "Install dependencies and expose the cache path",
      inputs: {
        "bun-version": {
          description: "Bun version to install",
          required: true,
          default: "1.3.11",
        },
      },
      outputs: {
        "cache-path": {
          description: "Resolved cache directory",
          value: "${{ steps.cache.outputs.path }}",
        },
      },
      runs: {
        using: "composite",
        steps: [
          {
            kind: "uses",
            name: "Checkout",
            id: "checkout",
            if: "${{ github.event_name != 'schedule' }}",
            uses: "actions/checkout@v6",
          },
          {
            kind: "run",
            name: "Expose Cache",
            id: "cache",
            env: {
              HOME: "/home/runner",
            },
            shell: "bash",
            workingDirectory: "./tooling",
            run: "echo cache-path=$HOME/.bun/install/cache >> $GITHUB_OUTPUT",
          },
        ],
      },
    });
    expect(Object.isFrozen(action)).toBe(true);
    expect(Object.isFrozen(action.runs.steps)).toBe(true);
    expect(Object.isFrozen(action.runs.steps[1]?.env)).toBe(true);
  });

  it("renders a deterministic composite action payload", () => {
    const action = defineCompositeAction({ name: "Echo" })
      .uses("actions/checkout@v6", "Checkout")
      .run("echo ok", {
        name: "Echo",
        env: { CI: "true" },
        shell: "bash",
        workingDirectory: "./scripts",
      })
      .build();

    expect(createCompositeActionRenderPayload(action)).toEqual({
      name: "Echo",
      runs: {
        using: "composite",
        steps: [
          {
            name: "Checkout",
            uses: "actions/checkout@v6",
          },
          {
            name: "Echo",
            env: { CI: "true" },
            shell: "bash",
            "working-directory": "./scripts",
            run: "echo ok",
          },
        ],
      },
    });
  });

  it("rejects invalid input, output, and step definitions at build time", () => {
    expect(() =>
      defineCompositeAction({ name: "" })
        .input(" bad", { description: "" })
        .output("artifact", { value: "" })
        .uses("not-an-action@ref" as never, {
          id: "dup",
          with: { "": "" },
        })
        .run("", { id: "dup", shell: "" })
        .build()
    ).toThrowError(
      [
        "[action.name] value must not be empty. Expected: non-empty string",
        "[action.inputs. bad] value must not contain surrounding whitespace. Expected: no leading or trailing spaces",
        "[action.inputs. bad.description] value must not be empty. Expected: non-empty string",
        "[action.outputs.artifact.value] value must not be empty. Expected: non-empty string",
        '[action.runs.steps[0].uses] actionRef value "not-an-action@ref" is not a valid action reference. Expected: owner/repo@ref, ./path, or docker://image',
        "[action.runs.steps[0].with] key must not be empty. Expected: non-empty string",
        "[action.runs.steps[0].with.] value must not be empty. Expected: non-empty string",
        "[action.runs.steps[1].id] value must be unique. Expected: no duplicate step identifiers",
        "[action.runs.steps[1].run] value must not be empty. Expected: non-empty string",
        "[action.runs.steps[1].shell] value must not be empty. Expected: non-empty string",
      ].join("\n")
    );
  });

  it("requires at least one step", () => {
    expect(() => defineCompositeAction({ name: "Empty" }).build()).toThrowError(
      "[action.runs.steps] value must not be empty. Expected: at least one step"
    );
  });
});
