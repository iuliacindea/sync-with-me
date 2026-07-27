import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/user";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Fetch current user's weekly availability
export async function GET() {
  try {
    const currentUser = await getOrCreateDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const availabilities = await db.availability.findMany({
      where: { userId: currentUser.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ availabilities });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Save or update weekly availability
export async function POST(req: Request) {
  try {
    const currentUser = await getOrCreateDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schedule } = await req.json(); // Array of { dayOfWeek, startTime, endTime }

    if (!Array.isArray(schedule)) {
      return NextResponse.json({ error: "Invalid schedule format." }, { status: 400 });
    }

    // Delete existing availability settings and insert the new ones
    await db.availability.deleteMany({
      where: { userId: currentUser.id },
    });

    if (schedule.length > 0) {
      await db.availability.createMany({
        data: schedule.map((slot: { dayOfWeek: number; startTime: string; endTime: string }) => ({
          userId: currentUser.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving availability:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}