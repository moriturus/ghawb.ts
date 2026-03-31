import { createWorkflowRenderPayload, WorkflowValidationError } from '@ghawb/sdk';

import {
  renderConformanceFixtures,
  validationConformanceFixtures,
} from '../shared/render-conformance.fixtures.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

for (const fixture of renderConformanceFixtures) {
  Deno.test(`Deno render conformance fixture ${fixture.name}`, () => {
    const actualPayload = createWorkflowRenderPayload(fixture.workflow);

    assert(
      JSON.stringify(actualPayload) === fixture.expectedJson,
      `expected fixture ${fixture.name} to match the shared payload contract`
    );
  });
}

for (const fixture of validationConformanceFixtures) {
  Deno.test(`Deno render conformance validation fixture ${fixture.name}`, () => {
    let thrown: unknown;

    try {
      fixture.build();
    } catch (error) {
      thrown = error;
    }

    assert(
      thrown instanceof WorkflowValidationError,
      `expected fixture ${fixture.name} to throw WorkflowValidationError`
    );
    assert(
      JSON.stringify(thrown.issues) === JSON.stringify(fixture.expectedIssues),
      `expected fixture ${fixture.name} to report the shared validation issues`
    );
  });
}
