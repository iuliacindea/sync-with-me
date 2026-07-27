import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/user";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export async function GET(req: Request) {
  try {
    const currentUser = await getOrCreateDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required." }, { status: 400 });
    }

    // Get all members of the group
    const groupMembers = await db.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });

    if (groupMembers.length === 0) {
      return NextResponse.json({ error: "Group has no members." }, { status: 400 });
    }

    const memberUserIds = groupMembers.map((m) => m.userId);

    // Fetch availability for ALL members
    const allAvailabilities = await db.availability.findMany({
      where: { userId: { in: memberUserIds } },
    });

    const commonSlots: { dayOfWeek: number; startTime: string; endTime: string }[] = [];

    // Check each day of week (0..6)
    for (let day = 0; day <= 6; day++) {
      const daySlots = allAvailabilities.filter((a) => a.dayOfWeek === day);

      // Overlap exists ONLY IF all members defined availability for this day
      if (daySlots.length === memberUserIds.length) {
        let maxStart = Math.max(...daySlots.map((s) => timeToMinutes(s.startTime)));
        let minEnd = Math.min(...daySlots.map((s) => timeToMinutes(s.endTime)));

        if (maxStart < minEnd) {
          commonSlots.push({
            dayOfWeek: day,
            startTime: minutesToTime(maxStart),
            endTime: minutesToTime(minEnd),
          });
        }
      }
    }

    return NextResponse.json({ commonSlots });
  } catch (error) {
    console.error("Error comparing group availability:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}