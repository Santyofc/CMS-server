import { NextResponse } from "next/server";
import { listGithubRepos } from "@/lib/services/providers/github";
import { requireApiUser } from "@/lib/security/auth";

export async function GET() {
  const auth = await requireApiUser("viewer");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const data = await listGithubRepos();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load repositories" }, { status: 500 });
  }
}

