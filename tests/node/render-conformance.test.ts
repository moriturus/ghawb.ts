import { describe, expect, it } from "vitest";

import { createWorkflowRenderPayload, WorkflowValidationError } from "@ghawb/sdk";

import {
  renderConformanceFixtures,
  validationConformanceFixtures,
} from "../shared/render-conformance.fixtures.js";

describe("cross-runtime render conformance", () => {
  for (const fixture of renderConformanceFixtures) {
    it(`renders fixture ${fixture.name} with the shared expected payload`, () => {
      const actualPayload = createWorkflowRenderPayload(fixture.workflow);

      expect(actualPayload).toEqual(fixture.expectedPayload);
      expect(JSON.stringify(actualPayload)).toBe(fixture.expectedJson);
    });
  }

  for (const fixture of validationConformanceFixtures) {
    it(`reports shared validation issues for fixture ${fixture.name}`, () => {
      let thrown: unknown;

      try {
        fixture.build();
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(WorkflowValidationError);
      expect((thrown as WorkflowValidationError).issues).toEqual(fixture.expectedIssues);
    });
  }
});
