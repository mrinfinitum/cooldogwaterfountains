import { endSession } from "@/lib/session";

/** POST /api/account/logout/ — signs out on this browser. */
export async function POST() {
  await endSession();
  return Response.json({ signedIn: false });
}
