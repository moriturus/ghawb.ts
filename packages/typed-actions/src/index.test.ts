import { describe, expect, it } from "vitest";

import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

import {
  actionsCache,
  actionsConfigurePages,
  actionsCheckout,
  actionsDeployPages,
  actionsDownloadArtifact,
  actionsGithubScript,
  actionsLabeler,
  actionsSetupDotnet,
  actionsSetupGo,
  actionsSetupJava,
  actionsSetupNode,
  actionsSetupPython,
  actionsUploadPagesArtifact,
  actionsUploadArtifact,
} from "./index.js";

describe("@ghawb/typed-actions", () => {
  it("omits with when a typed action wrapper has no inputs", () => {
    expect(actionsCheckout()).toEqual({ uses: "actions/checkout@v6" });
    expect(actionsSetupNode()).toEqual({ uses: "actions/setup-node@v6" });
    expect(actionsUploadArtifact()).toEqual({ uses: "actions/upload-artifact@v7" });
    expect(actionsDownloadArtifact()).toEqual({ uses: "actions/download-artifact@v8" });
    expect(actionsSetupPython()).toEqual({ uses: "actions/setup-python@v6" });
    expect(actionsSetupGo()).toEqual({ uses: "actions/setup-go@v6" });
    expect(actionsSetupDotnet()).toEqual({ uses: "actions/setup-dotnet@v5" });
    expect(actionsConfigurePages()).toEqual({ uses: "actions/configure-pages@v6" });
    expect(actionsDeployPages()).toEqual({ uses: "actions/deploy-pages@v5" });
    expect(actionsLabeler()).toEqual({ uses: "actions/labeler@v6" });
  });

  it("builds checkout wrapper inputs with serialized booleans and numbers", () => {
    expect(
      actionsCheckout({
        fetchDepth: 0,
        lfs: true,
        persistCredentials: false,
        sparseCheckout: ["src", "tests"],
        submodules: "recursive",
      })
    ).toEqual({
      uses: "actions/checkout@v6",
      with: {
        "fetch-depth": "0",
        lfs: "true",
        "persist-credentials": "false",
        "sparse-checkout": "src\ntests",
        submodules: "recursive",
      },
    });
  });

  it("builds setup-node wrapper inputs with typed cache fields", () => {
    expect(
      actionsSetupNode({
        nodeVersion: "22",
        cache: "pnpm",
        cacheDependencyPath: ["pnpm-lock.yaml", "packages/*/pnpm-lock.yaml"],
        packageManagerCache: true,
      })
    ).toEqual({
      uses: "actions/setup-node@v6",
      with: {
        "node-version": "22",
        cache: "pnpm",
        "cache-dependency-path": "pnpm-lock.yaml\npackages/*/pnpm-lock.yaml",
        "package-manager-cache": "true",
      },
    });
  });

  it("builds upload/download artifact wrappers with their documented input names", () => {
    expect(
      actionsUploadArtifact({
        name: "dist",
        path: ["dist", "coverage"],
        overwrite: true,
        retentionDays: 7,
      })
    ).toEqual({
      uses: "actions/upload-artifact@v7",
      with: {
        name: "dist",
        path: "dist\ncoverage",
        overwrite: "true",
        "retention-days": "7",
      },
    });

    expect(
      actionsDownloadArtifact({
        artifactIds: [123, "456"],
        mergeMultiple: true,
        runId: 789,
      })
    ).toEqual({
      uses: "actions/download-artifact@v8",
      with: {
        "artifact-ids": "123,456",
        "merge-multiple": "true",
        "run-id": "789",
      },
    });
  });

  it("covers the remaining documented wrapper input shapes", () => {
    expect(
      actionsCheckout({
        repository: "moriturus/ghawb.ts",
        ref: "main",
        token: "${{ secrets.GITHUB_TOKEN }}",
        sshKey: "ssh-private-key",
        sshKnownHosts: "github.com ssh-rsa AAAA",
        sshStrict: true,
        sshUser: "git",
        path: "src-repo",
        clean: false,
        filter: "blob:none",
        sparseCheckoutConeMode: false,
        fetchTags: true,
        showProgress: false,
        submodules: false,
        setSafeDirectory: true,
        githubServerUrl: "https://github.example.com",
      })
    ).toEqual({
      uses: "actions/checkout@v6",
      with: {
        repository: "moriturus/ghawb.ts",
        ref: "main",
        token: "${{ secrets.GITHUB_TOKEN }}",
        "ssh-key": "ssh-private-key",
        "ssh-known-hosts": "github.com ssh-rsa AAAA",
        "ssh-strict": "true",
        "ssh-user": "git",
        path: "src-repo",
        clean: "false",
        filter: "blob:none",
        "sparse-checkout-cone-mode": "false",
        "fetch-tags": "true",
        "show-progress": "false",
        submodules: "false",
        "set-safe-directory": "true",
        "github-server-url": "https://github.example.com",
      },
    });

    expect(
      actionsSetupNode({
        alwaysAuth: true,
        nodeVersionFile: ".nvmrc",
        architecture: "x64",
        checkLatest: false,
        registryUrl: "https://registry.npmjs.org",
        scope: "@ghawb",
        token: "${{ secrets.NPM_TOKEN }}",
        mirror: "https://mirror.example.com/node",
        mirrorToken: "mirror-token",
      })
    ).toEqual({
      uses: "actions/setup-node@v6",
      with: {
        "always-auth": "true",
        "node-version-file": ".nvmrc",
        architecture: "x64",
        "check-latest": "false",
        "registry-url": "https://registry.npmjs.org",
        scope: "@ghawb",
        token: "${{ secrets.NPM_TOKEN }}",
        mirror: "https://mirror.example.com/node",
        "mirror-token": "mirror-token",
      },
    });

    expect(
      actionsUploadArtifact({
        ifNoFilesFound: "error",
        compressionLevel: 0,
        includeHiddenFiles: true,
      })
    ).toEqual({
      uses: "actions/upload-artifact@v7",
      with: {
        "if-no-files-found": "error",
        "compression-level": "0",
        "include-hidden-files": "true",
      },
    });

    expect(
      actionsDownloadArtifact({
        name: "dist",
        artifactIds: "123",
        path: "artifacts",
        pattern: "dist-*",
        githubToken: "${{ secrets.GITHUB_TOKEN }}",
        repository: "moriturus/ghawb.ts",
        skipDecompress: false,
        digestMismatch: "warn",
      })
    ).toEqual({
      uses: "actions/download-artifact@v8",
      with: {
        name: "dist",
        "artifact-ids": "123",
        path: "artifacts",
        pattern: "dist-*",
        "github-token": "${{ secrets.GITHUB_TOKEN }}",
        repository: "moriturus/ghawb.ts",
        "skip-decompress": "false",
        "digest-mismatch": "warn",
      },
    });
  });

  it("builds cache and language setup wrappers with typed serialization", () => {
    expect(
      actionsCache({
        path: ["~/.cache/pip", ".venv"],
        key: "pip-${{ runner.os }}-${{ hashFiles('requirements.txt') }}",
        restoreKeys: ["pip-${{ runner.os }}-", "pip-"],
        uploadChunkSize: 1024,
        enableCrossOsArchive: true,
        failOnCacheMiss: false,
        lookupOnly: true,
        saveAlways: false,
      })
    ).toEqual({
      uses: "actions/cache@v5",
      with: {
        path: "~/.cache/pip\n.venv",
        key: "pip-${{ runner.os }}-${{ hashFiles('requirements.txt') }}",
        "restore-keys": "pip-${{ runner.os }}-\npip-",
        "upload-chunk-size": "1024",
        enableCrossOsArchive: "true",
        "fail-on-cache-miss": "false",
        "lookup-only": "true",
        "save-always": "false",
      },
    });

    expect(
      actionsSetupPython({
        pythonVersion: "3.12",
        pythonVersionFile: ".python-version",
        cache: "pip",
        architecture: "arm64",
        checkLatest: true,
        token: "${{ secrets.GITHUB_TOKEN }}",
        cacheDependencyPath: ["requirements.txt", "requirements-dev.txt"],
        updateEnvironment: false,
        allowPrereleases: true,
        freethreaded: false,
      })
    ).toEqual({
      uses: "actions/setup-python@v6",
      with: {
        "python-version": "3.12",
        "python-version-file": ".python-version",
        cache: "pip",
        architecture: "arm64",
        "check-latest": "true",
        token: "${{ secrets.GITHUB_TOKEN }}",
        "cache-dependency-path": "requirements.txt\nrequirements-dev.txt",
        "update-environment": "false",
        "allow-prereleases": "true",
        freethreaded: "false",
      },
    });

    expect(
      actionsSetupGo({
        goVersion: "1.24",
        goVersionFile: "go.mod",
        checkLatest: false,
        token: "${{ secrets.GITHUB_TOKEN }}",
        cache: true,
        cacheDependencyPath: ["go.sum", "tools/go.sum"],
        architecture: "x64",
      })
    ).toEqual({
      uses: "actions/setup-go@v6",
      with: {
        "go-version": "1.24",
        "go-version-file": "go.mod",
        "check-latest": "false",
        token: "${{ secrets.GITHUB_TOKEN }}",
        cache: "true",
        "cache-dependency-path": "go.sum\ntools/go.sum",
        architecture: "x64",
      },
    });

    expect(
      actionsSetupJava({
        javaVersion: "21",
        javaVersionFile: ".java-version",
        distribution: "temurin",
        javaPackage: "jdk",
        architecture: "x64",
        jdkFile: "downloads/jdk.tar.gz",
        checkLatest: true,
        serverId: "central",
        serverUsername: "MAVEN_USERNAME",
        serverPassword: "MAVEN_TOKEN",
        settingsPath: "~/.m2",
        overwriteSettings: false,
        gpgPrivateKey: "${{ secrets.GPG_PRIVATE_KEY }}",
        gpgPassphrase: "GPG_PASSPHRASE",
        cache: "maven",
        cacheDependencyPath: ["pom.xml", "submodule/pom.xml"],
        token: "${{ secrets.GITHUB_TOKEN }}",
        mvnToolchainId: "temurin_21",
        mvnToolchainVendor: "temurin",
      })
    ).toEqual({
      uses: "actions/setup-java@v5",
      with: {
        "java-version": "21",
        "java-version-file": ".java-version",
        distribution: "temurin",
        "java-package": "jdk",
        architecture: "x64",
        jdkFile: "downloads/jdk.tar.gz",
        "check-latest": "true",
        "server-id": "central",
        "server-username": "MAVEN_USERNAME",
        "server-password": "MAVEN_TOKEN",
        "settings-path": "~/.m2",
        "overwrite-settings": "false",
        "gpg-private-key": "${{ secrets.GPG_PRIVATE_KEY }}",
        "gpg-passphrase": "GPG_PASSPHRASE",
        cache: "maven",
        "cache-dependency-path": "pom.xml\nsubmodule/pom.xml",
        token: "${{ secrets.GITHUB_TOKEN }}",
        "mvn-toolchain-id": "temurin_21",
        "mvn-toolchain-vendor": "temurin",
      },
    });

    expect(
      actionsSetupDotnet({
        dotnetVersion: ["8.0.x", "9.0.x"],
        dotnetQuality: "preview",
        globalJsonFile: "src/global.json",
        sourceUrl: "https://nuget.pkg.github.com/moriturus/index.json",
        owner: "moriturus",
        configFile: "NuGet.config",
        cache: true,
        cacheDependencyPath: ["packages.lock.json", "src/*/packages.lock.json"],
      })
    ).toEqual({
      uses: "actions/setup-dotnet@v5",
      with: {
        "dotnet-version": "8.0.x\n9.0.x",
        "dotnet-quality": "preview",
        "global-json-file": "src/global.json",
        "source-url": "https://nuget.pkg.github.com/moriturus/index.json",
        owner: "moriturus",
        "config-file": "NuGet.config",
        cache: "true",
        "cache-dependency-path": "packages.lock.json\nsrc/*/packages.lock.json",
      },
    });
  });

  it("builds GitHub-maintenance wrappers with typed serialization", () => {
    expect(
      actionsGithubScript({
        script: "return { ok: true };",
        githubToken: "${{ secrets.GITHUB_TOKEN }}",
        debug: true,
        userAgent: "ghawb-tests",
        previews: ["mercy", "nebula"],
        resultEncoding: "string",
        retries: 3,
        retryExemptStatusCodes: [400, 404, "422"],
        baseUrl: "https://ghe.example.com/api/v3",
      })
    ).toEqual({
      uses: "actions/github-script@v9",
      with: {
        script: "return { ok: true };",
        "github-token": "${{ secrets.GITHUB_TOKEN }}",
        debug: "true",
        "user-agent": "ghawb-tests",
        previews: "mercy,nebula",
        "result-encoding": "string",
        retries: "3",
        "retry-exempt-status-codes": "400,404,422",
        "base-url": "https://ghe.example.com/api/v3",
      },
    });

    expect(
      actionsConfigurePages({
        staticSiteGenerator: "next",
        generatorConfigFile: "apps/web/next.config.js",
        token: "${{ secrets.PAGES_TOKEN }}",
        enablement: true,
      })
    ).toEqual({
      uses: "actions/configure-pages@v6",
      with: {
        static_site_generator: "next",
        generator_config_file: "apps/web/next.config.js",
        token: "${{ secrets.PAGES_TOKEN }}",
        enablement: "true",
      },
    });

    expect(
      actionsUploadPagesArtifact({
        name: "docs-site",
        path: "dist/docs",
        retentionDays: 7,
      })
    ).toEqual({
      uses: "actions/upload-pages-artifact@v5",
      with: {
        name: "docs-site",
        path: "dist/docs",
        "retention-days": "7",
      },
    });

    expect(
      actionsDeployPages({
        token: "${{ secrets.GITHUB_TOKEN }}",
        timeout: 900000,
        errorCount: 20,
        reportingInterval: 10000,
        artifactName: "docs-site",
        preview: true,
      })
    ).toEqual({
      uses: "actions/deploy-pages@v5",
      with: {
        token: "${{ secrets.GITHUB_TOKEN }}",
        timeout: "900000",
        error_count: "20",
        reporting_interval: "10000",
        artifact_name: "docs-site",
        preview: "true",
      },
    });

    expect(
      actionsLabeler({
        repoToken: "${{ secrets.GITHUB_TOKEN }}",
        configurationPath: ".github/labeler.yml",
        syncLabels: true,
        dot: false,
        prNumber: [123, "456"],
      })
    ).toEqual({
      uses: "actions/labeler@v6",
      with: {
        "repo-token": "${{ secrets.GITHUB_TOKEN }}",
        "configuration-path": ".github/labeler.yml",
        "sync-labels": "true",
        dot: "false",
        "pr-number": "123,456",
      },
    });
  });

  it("allows overriding the internal action ref version per wrapper call", () => {
    expect(actionsCheckout({}, { version: "v5" })).toEqual({ uses: "actions/checkout@v5" });
    expect(actionsCache({ path: ".cache", key: "cache-key" }, { version: "v4" })).toEqual({
      uses: "actions/cache@v4",
      with: {
        path: ".cache",
        key: "cache-key",
      },
    });
    expect(
      actionsGithubScript(
        {
          script: "return true;",
        },
        { version: "main" }
      )
    ).toEqual({
      uses: "actions/github-script@main",
      with: {
        script: "return true;",
      },
    });
  });

  it("rejects blank action ref overrides", () => {
    expect(() => actionsCheckout({}, { version: "   " })).toThrow(
      'typed action wrapper option "version" must not be empty'
    );
  });

  it("allows job.uses() to accept a typed action wrapper from the opt-in package", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("typed-actions"),
      name: "Typed Actions",
    })
      .onPush()
      .addJob(createJobId("build"), (job) =>
        job
          .runsOn("ubuntu-latest")
          .uses(actionsCheckout({ fetchDepth: 1 }), "Checkout")
          .uses(actionsSetupNode({ nodeVersion: "22", cache: "pnpm", packageManagerCache: true }), {
            name: "Setup Node",
            id: "setup-node",
          })
          .uses(actionsCache({ path: "~/.pnpm-store", key: "pnpm-${{ runner.os }}" }), "Cache")
          .uses(actionsSetupPython({ pythonVersion: "3.12", cache: "pip" }), "Setup Python")
          .uses(actionsUploadPagesArtifact({ path: "dist" }), "Upload Pages Artifact")
      )
      .build();

    expect(workflow.jobs[0]?.steps).toEqual([
      {
        kind: "uses",
        name: "Checkout",
        uses: "actions/checkout@v6",
        with: {
          "fetch-depth": "1",
        },
      },
      {
        kind: "uses",
        name: "Setup Node",
        id: "setup-node",
        uses: "actions/setup-node@v6",
        with: {
          "node-version": "22",
          cache: "pnpm",
          "package-manager-cache": "true",
        },
      },
      {
        kind: "uses",
        name: "Cache",
        uses: "actions/cache@v5",
        with: {
          path: "~/.pnpm-store",
          key: "pnpm-${{ runner.os }}",
        },
      },
      {
        kind: "uses",
        name: "Setup Python",
        uses: "actions/setup-python@v6",
        with: {
          "python-version": "3.12",
          cache: "pip",
        },
      },
      {
        kind: "uses",
        name: "Upload Pages Artifact",
        uses: "actions/upload-pages-artifact@v5",
        with: {
          path: "dist",
        },
      },
    ]);
  });
});
