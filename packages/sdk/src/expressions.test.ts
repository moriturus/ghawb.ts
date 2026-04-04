import { describe, expect, it } from "vitest";
import {
  expr,
  github,
  env,
  secrets,
  matrix,
  inputs,
  steps,
  success,
  always,
  cancelled,
  failure,
} from "./expressions.js";

describe("expression helpers", () => {
  describe("expr", () => {
    it("wraps content in ${{ }} syntax", () => {
      expect(expr("github.ref")).toBe("${{ github.ref }}");
    });

    it("wraps status check function calls", () => {
      expect(expr("success()")).toBe("${{ success() }}");
    });

    it("wraps complex expressions", () => {
      expect(expr("github.ref == 'refs/heads/main'")).toBe(
        "${{ github.ref == 'refs/heads/main' }}"
      );
    });

    it("wraps composed helper output", () => {
      expect(expr(`${github("ref")} == 'refs/heads/main'`)).toBe(
        "${{ github.ref == 'refs/heads/main' }}"
      );
    });

    it("rejects empty content", () => {
      expect(() => expr("")).toThrowError(
        "expr content must not be empty or blank. Expected: a non-blank expression string"
      );
    });

    it("rejects blank content", () => {
      expect(() => expr("   ")).toThrowError(
        "expr content must not be empty or blank. Expected: a non-blank expression string"
      );
    });
  });

  describe("github", () => {
    it("creates github context reference for ref", () => {
      expect(github("ref")).toBe("github.ref");
    });

    it("creates github context reference for event_name", () => {
      expect(github("event_name")).toBe("github.event_name");
    });

    it("creates github context reference for actor", () => {
      expect(github("actor")).toBe("github.actor");
    });

    it("creates github context reference for sha", () => {
      expect(github("sha")).toBe("github.sha");
    });

    it("creates github context reference for repository", () => {
      expect(github("repository")).toBe("github.repository");
    });

    it("wraps in expr for full expression", () => {
      expect(expr(github("ref"))).toBe("${{ github.ref }}");
    });

    it("rejects empty property", () => {
      expect(() => github("")).toThrowError(
        'github property must not be empty or blank. Expected: a context property name like "ref" or "event_name"'
      );
    });

    it("rejects blank property", () => {
      expect(() => github("   ")).toThrowError(
        'github property must not be empty or blank. Expected: a context property name like "ref" or "event_name"'
      );
    });
  });

  describe("env", () => {
    it("creates env context reference", () => {
      expect(env("MY_VAR")).toBe("env.MY_VAR");
    });

    it("wraps in expr for full expression", () => {
      expect(expr(env("MY_VAR"))).toBe("${{ env.MY_VAR }}");
    });

    it("rejects empty name", () => {
      expect(() => env("")).toThrowError(
        "env name must not be empty or blank. Expected: an environment variable name"
      );
    });

    it("rejects blank name", () => {
      expect(() => env("   ")).toThrowError(
        "env name must not be empty or blank. Expected: an environment variable name"
      );
    });
  });

  describe("secrets", () => {
    it("creates secrets context reference", () => {
      expect(secrets("TOKEN")).toBe("secrets.TOKEN");
    });

    it("wraps in expr for full expression", () => {
      expect(expr(secrets("TOKEN"))).toBe("${{ secrets.TOKEN }}");
    });

    it("rejects empty name", () => {
      expect(() => secrets("")).toThrowError(
        "secrets name must not be empty or blank. Expected: a secret name"
      );
    });

    it("rejects blank name", () => {
      expect(() => secrets("   ")).toThrowError(
        "secrets name must not be empty or blank. Expected: a secret name"
      );
    });
  });

  describe("matrix", () => {
    it("creates matrix context reference", () => {
      expect(matrix("os")).toBe("matrix.os");
    });

    it("wraps in expr for full expression", () => {
      expect(expr(matrix("os"))).toBe("${{ matrix.os }}");
    });

    it("rejects empty key", () => {
      expect(() => matrix("")).toThrowError(
        "matrix key must not be empty or blank. Expected: a matrix axis key"
      );
    });

    it("rejects blank key", () => {
      expect(() => matrix("   ")).toThrowError(
        "matrix key must not be empty or blank. Expected: a matrix axis key"
      );
    });
  });

  describe("inputs", () => {
    it("creates inputs context reference", () => {
      expect(inputs("my_input")).toBe("inputs.my_input");
    });

    it("creates inputs context reference with hyphens", () => {
      expect(inputs("my-input")).toBe("inputs.my-input");
    });

    it("wraps in expr for full expression", () => {
      expect(expr(inputs("my_input"))).toBe("${{ inputs.my_input }}");
    });

    it("rejects empty name", () => {
      expect(() => inputs("")).toThrowError(
        "inputs name must not be empty or blank. Expected: an input name"
      );
    });

    it("rejects blank name", () => {
      expect(() => inputs("   ")).toThrowError(
        "inputs name must not be empty or blank. Expected: an input name"
      );
    });
  });

  describe("steps", () => {
    it("creates step outputs reference", () => {
      expect(steps("build").outputs("result")).toBe("steps.build.outputs.result");
    });

    it("wraps in expr for full expression", () => {
      expect(expr(steps("build").outputs("result"))).toBe("${{ steps.build.outputs.result }}");
    });

    it("supports different step IDs and output names", () => {
      expect(steps("setup").outputs("cache-hit")).toBe("steps.setup.outputs.cache-hit");
    });

    it("rejects empty step id", () => {
      expect(() => steps("")).toThrowError(
        "steps id must not be empty or blank. Expected: a step identifier"
      );
    });

    it("rejects blank step id", () => {
      expect(() => steps("   ")).toThrowError(
        "steps id must not be empty or blank. Expected: a step identifier"
      );
    });

    it("rejects empty output name", () => {
      expect(() => steps("build").outputs("")).toThrowError(
        "steps outputs name must not be empty or blank. Expected: an output name"
      );
    });

    it("rejects blank output name", () => {
      expect(() => steps("build").outputs("   ")).toThrowError(
        "steps outputs name must not be empty or blank. Expected: an output name"
      );
    });
  });

  describe("status check functions", () => {
    it("success returns function call string", () => {
      expect(success()).toBe("success()");
    });

    it("always returns function call string", () => {
      expect(always()).toBe("always()");
    });

    it("cancelled returns function call string", () => {
      expect(cancelled()).toBe("cancelled()");
    });

    it("failure returns function call string", () => {
      expect(failure()).toBe("failure()");
    });

    it("wraps success in expr for full expression", () => {
      expect(expr(success())).toBe("${{ success() }}");
    });

    it("wraps always in expr for full expression", () => {
      expect(expr(always())).toBe("${{ always() }}");
    });

    it("wraps cancelled in expr for full expression", () => {
      expect(expr(cancelled())).toBe("${{ cancelled() }}");
    });

    it("wraps failure in expr for full expression", () => {
      expect(expr(failure())).toBe("${{ failure() }}");
    });
  });

  describe("composition patterns", () => {
    it("composes context reference with comparison operator", () => {
      expect(expr(`${github("event_name")} == 'push'`)).toBe("${{ github.event_name == 'push' }}");
    });

    it("composes matrix reference in condition", () => {
      expect(expr(`${matrix("os")} == 'ubuntu-latest'`)).toBe(
        "${{ matrix.os == 'ubuntu-latest' }}"
      );
    });

    it("composes step output in condition", () => {
      expect(expr(`${steps("check").outputs("changed")} == 'true'`)).toBe(
        "${{ steps.check.outputs.changed == 'true' }}"
      );
    });

    it("composes status check with logical operator", () => {
      expect(expr(`${always()} && ${github("event_name")} == 'pull_request'`)).toBe(
        "${{ always() && github.event_name == 'pull_request' }}"
      );
    });

    it("works with builder ifCondition accepting the string", () => {
      const expression = expr(success());
      expect(typeof expression).toBe("string");
      expect(expression).toBe("${{ success() }}");
    });

    it("works with step metadata if field", () => {
      const expression = expr(always());
      const metadata = { if: expression };
      expect(metadata.if).toBe("${{ always() }}");
    });
  });
});
