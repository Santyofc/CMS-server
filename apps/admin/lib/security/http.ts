import { NextResponse } from "next/server";

export function errorResponse(publicMessage: string, status = 500) {
  return NextResponse.json({ error: publicMessage }, { status });
}
