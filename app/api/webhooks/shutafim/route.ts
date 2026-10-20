import { NextResponse } from "next/server";
// No verified Shutafim signature/order/amount/currency contract is configured.
// Reject every callback without reading/logging payloads or changing finances.
export async function POST() {
  return NextResponse.json({ error: "Payment confirmation is disabled pending verified provider integration" }, { status: 503 });
}
export async function GET() {
  return NextResponse.json({ mode: "restricted", paymentConfirmationEnabled: false });
}
