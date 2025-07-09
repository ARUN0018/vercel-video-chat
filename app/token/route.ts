import { getData } from "@/src/data/getToken";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // You can extract parameters from the request if needed
  const { searchParams } = new URL(request.url);
  const session = searchParams.get("session");

  // Logic to fetch users
  return NextResponse.json({ token: getData(session ?? "") });
}
