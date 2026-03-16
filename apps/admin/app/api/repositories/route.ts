import { NextRequest, NextResponse } from "next/server";

const repositories = [
  { id: "1", name: "SaaS-Zona_Sur_Tech", private: true, adapter: "next-turborepo" },
  { id: "2", name: "fac-zona-sur-main", private: true, adapter: "nuxt" },
  { id: "3", name: "developer-portfolio", private: true, adapter: "vite-react" }
];

export async function GET(req: NextRequest) {
  return NextResponse.json({ data: repositories });
}

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const id = `${Date.now()}`;
  const record = { id, ...payload };
  return NextResponse.json({ data: record }, { status: 201 });
}
