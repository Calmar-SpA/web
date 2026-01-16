import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function getBuildId() {
  try {
    const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");
    const buildId = await readFile(buildIdPath, "utf8");
    return buildId.trim();
  } catch {
    return "development";
  }
}

export async function GET() {
  const buildId = await getBuildId();

  return NextResponse.json({
    buildId,
    timestamp: Date.now(),
  });
}
