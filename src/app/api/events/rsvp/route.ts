import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/user";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const currentUser = await getOrCreateDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, status } = await req.json();

    if (!eventId || !["ACCEPTED", "DECLINED"].includes(status)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Check if RSVP exists first
    const existingRsvp = await db.eventRSVP.findFirst({
      where: {
        eventId: eventId,
        userId: currentUser.id,
      },
    });

    if (existingRsvp) {
      await db.eventRSVP.update({
        where: { id: existingRsvp.id },
        data: { status },
      });
    } else {
      await db.eventRSVP.create({
        data: {
          eventId: eventId,
          userId: currentUser.id,
          status,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting RSVP:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}