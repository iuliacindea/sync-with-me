import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/user";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const currentUser = await getOrCreateDbUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, action } = await req.json(); // action: "ACCEPT" or "DECLINE"

    if (!requestId || !["ACCEPT", "DECLINE"].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
    }

    if (action === "ACCEPT") {
      await db.friendship.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" },
      });
    } else {
      await db.friendship.delete({
        where: { id: requestId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error responding to request:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}