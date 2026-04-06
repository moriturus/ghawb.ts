import {
  RunnerLabel,
  createJobId,
  createWorkflowId,
  createWorkflowRenderPayload,
  defineWorkflow,
} from "@ghawb/sdk";
import { importReusableWorkflow } from "@ghawb/yaml-import";
import { defineCompositeAction, renderCompositeAction } from "@ghawb/composite-actions";
import { actionsCheckout, actionsSetupNode, actionsUploadArtifact } from "@ghawb/typed-actions";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

Deno.test("Deno supports representative workflow authoring through public package entrypoints", () => {
  const workflow = defineWorkflow({
    id: createWorkflowId("deno-entrypoints"),
    name: "Deno Entrypoints",
  })
    .onPush({ branches: ["main"] })
    .addJob(createJobId("check"), (job) => {
      job
        .runsOn(RunnerLabel.UbuntuLatest)
        .uses(actionsCheckout({ fetchDepth: 0 }), "Checkout")
        .uses(actionsSetupNode({ nodeVersion: "24", cache: "npm" }), "Setup Node")
        .run("npm ci", "Install")
        .run("npm test", "Test")
        .uses(actionsUploadArtifact({ name: "coverage", path: "coverage/lcov.info" }), "Upload");
    })
    .build();

  const payload = createWorkflowRenderPayload(workflow);
  const checkJob = payload.jobs["check"];
  assert(checkJob !== undefined, "expected rendered check job");
  assert(checkJob["runs-on"] === "ubuntu-latest", "expected RunnerLabel to render correctly");
  assert(Array.isArray(checkJob.steps), "expected rendered steps array");
  assert(checkJob.steps[0]?.uses === "actions/checkout@v4", "expected checkout wrapper to render");
  assert(
    checkJob.steps[1]?.uses === "actions/setup-node@v4",
    "expected setup-node wrapper to render"
  );
  assert(
    checkJob.steps[4]?.uses === "actions/upload-artifact@v4",
    "expected upload-artifact wrapper to render"
  );
});

Deno.test("Deno supports composite action rendering through the public package entrypoint", () => {
  const action = defineCompositeAction({
    name: "Publish metadata",
    description: "Composite action compatibility proof",
  })
    .input("artifact", {
      description: "Artifact path",
      required: true,
    })
    .run("echo preparing")
    .uses("actions/checkout@v4", {
      name: "Checkout",
      with: {
        "fetch-depth": "0",
      },
    })
    .build();

  const payload = renderCompositeAction(action, (rendered) => rendered);

  assert(payload.name === "Publish metadata", "expected composite action name");
  assert(payload.runs.using === "composite", "expected composite action runner");
  const checkoutStep = payload.runs.steps[1];
  assert(
    checkoutStep !== undefined && "uses" in checkoutStep,
    "expected checkout step to be a uses step"
  );
  assert(checkoutStep.uses === "actions/checkout@v4", "expected typed uses payload");
});

Deno.test({
  name: "Deno imports reusable workflows through the yaml-import public entrypoint without env permission",
  permissions: {
    env: false,
    read: ["tests/deno/fixtures"],
  },
  async fn() {
    const ref = await importReusableWorkflow(
      `${Deno.cwd()}/tests/deno/fixtures/yaml-import-shared-build.yml`
    );
    assert(
      ref === "./.github/workflows/yaml-import-shared-build.yml",
      "expected reusable workflow ref"
    );
  },
});
