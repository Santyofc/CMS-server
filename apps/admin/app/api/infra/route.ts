import { NextRequest, NextResponse } from "next/server";

const servers = [
  { id: "srv-01", name: "zona-sur-tech-server", ip: "3.137.182.156", environment: "production", status: "online" },
  { id: "srv-02", name: "zona-sur-tech-dev", ip: "18.221.239.217", environment: "staging", status: "online" }
];

export async function GET() {
  return NextResponse.json({ data: servers });
}

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const id = `srv-${Math.floor(Math.random() * 10000)}`;
  return NextResponse.json({ data: { id, ...payload } }, { status: 201 });
}
