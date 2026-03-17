import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { deploymentRuns, getDb } from "@/packages/db";
import { requireApiUser } from "@/lib/security/auth";
import { writeAuditLog } from "@/lib/security/audit";
import { runScript } from "@/lib/security/exec";
import { errorResponse } from "@/lib/security/http";
import { logError } from "@/lib/security/logger";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { enforceSameOrigin } from "@/lib/security/request-integrity";
import { getRequestAuditMeta } from "@/lib/security/request-meta";

function resolveScriptPath() {
  const configuredPath = process.env.DEPLOY_SCRIPT_PATH ?? "/var/www/cms/scripts/deploy.sh";
  const allowlist = [
    "/var/www/cms/scripts/deploy.sh",
    path.resolve(process.cwd(), "scripts", "deploy.sh")
  ];
  const allowlistSet = new Set(allowlist);

  if (!allowlistSet.has(configuredPath)) {
    throw new Error("DEPLOY_SCRIPT_PATH is not allowlisted.");
  }

  const absoluteConfiguredPath = path.resolve(configuredPath);

  if (!fs.existsSync(absoluteConfiguredPath)) {
    throw new Error("DEPLOY_SCRIPT_PATH does not exist.");
  }

  const stat = fs.lstatSync(absoluteConfiguredPath);
  if (stat.isSymbolicLink()) {
    throw new Error("DEPLOY_SCRIPT_PATH cannot be a symbolic link.");
  }

  const realPath = fs.realpathSync(absoluteConfiguredPath);
  const allowedRealPaths = new Set(allowlist.map((candidate) => path.resolve(candidate)));
  if (!allowedRealPaths.has(realPath)) {
    throw new Error("Resolved deploy script path is not allowlisted.");
  }

  if (path.basename(realPath) !== "deploy.sh") {
    throw new Error("Resolved deploy script is invalid.");
  }

  return realPath;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestMeta = getRequestAuditMeta(request);

  const sameOrigin = enforceSameOrigin(request);
  if (!sameOrigin.ok) {
    return sameOrigin.response;
  }

  const auth = await requireApiUser("admin");
  if (!auth.ok) {
    return auth.response;
  }

  const rate = await checkRateLimit(`deploy:${auth.user.id}`, 5, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many deploy requests" }, { status: 429 });
  }

  const db = getDb();
  const externalId = crypto.randomUUID();

  try {
    let gitOutput = "";
    if ((process.env.GIT_AUTO_PUSH ?? "false") === "true") {
      const gitResult = await runScript("scripts/git-sync.sh");
      gitOutput = gitResult.output;
      if (gitResult.code !== 0) {
        throw new Error(`git-sync failed: ${gitResult.output}`);
      }
    }

    if ((process.env.ENABLE_AUTO_DEPLOY ?? "true") !== "true") {
      return NextResponse.json({ error: "Auto deploy disabled" }, { status: 409 });
    }

    const deployPath = resolveScriptPath();
    const result = await runScript(deployPath);
    const success = result.code === 0;

    await db.insert(deploymentRuns).values({
      provider: "system",
      external_id: externalId,
      project_name: "cms",
      status: success ? "success" : "failed",
      url: null,
      metadata: { output: result.output, git: gitOutput }
    });

    await writeAuditLog({
      userId: auth.user.id,
      action: "deploy",
      provider: "system",
      target: "cms",
      payloadSummary: {},
      result: success ? "success" : "fail",
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      statusCode: success ? 200 : 500,
      durationMs: Date.now() - startedAt,
      requestId: requestMeta.requestId,
      errorMessage: success ? undefined : "Deploy script failed"
    });

    return NextResponse.json({
      data: {
        id: externalId,
        status: success ? "success" : "failed",
        output: result.output
      }
    }, { status: success ? 200 : 500 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deploy failed";
    logError({ route: "/api/deploy", requestId: requestMeta.requestId }, error, "deploy failed");

    await db.insert(deploymentRuns).values({
      provider: "system",
      external_id: externalId,
      project_name: "cms",
      status: "failed",
      url: null,
      metadata: { error: message }
    });

    await writeAuditLog({
      userId: auth.user.id,
      action: "deploy",
      provider: "system",
      target: "cms",
      payloadSummary: { error: message },
      result: "fail",
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      requestId: requestMeta.requestId,
      errorMessage: message
    });

    return errorResponse("Deploy failed", 500);
  }
}

