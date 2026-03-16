import { NextResponse } from "next/server";

const domains = [
  { id: "d1", domain: "zonasurtech.online", target: "3.137.182.156", environment: "production", serverId: "srv-01" },
  { id: "d2", domain: "facturas.zonasurtech.online", target: "3.137.182.156", environment: "production", serverId: "srv-01" },
  { id: "d3", domain: "dev.zonasurtech.online", target: "18.221.239.217", environment: "staging", serverId: "srv-02" }
];

export async function GET() {
  return NextResponse.json({ data: domains });
}
