import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/user";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getOrCreateDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const eventId = resolvedParams.id;

    if (!eventId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    const event = await db.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.createdById !== currentUser.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own events." },
        { status: 403 }
      );
    }

    await db.event.delete({ where: { id: eventId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}