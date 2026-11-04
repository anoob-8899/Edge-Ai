import { NextResponse } from "next/server";
import { OPTICAL_SCENARIOS } from "@/lib/opticoach/scenarios";

export async function GET() {
  return NextResponse.json({
    scenarios: OPTICAL_SCENARIOS,
  });
}
