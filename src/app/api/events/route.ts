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

    const { groupId, title, location, cost, items, dayOfWeek, startTime, endTime } = await req.json();

    if (!groupId || !title || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required event fields." }, { status: 400 });
    }

    // 1. Create the Event
    const event = await db.event.create({
      data: {
        groupId,
        createdById: currentUser.id,
        title,
        location: location || null,
        cost: cost || null,
        items: items || null,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        rsvps: {
          create: {
            userId: currentUser.id,
            status: "ACCEPTED", // Creator automatically accepts
          },
        },
      },
    });

    // 2. Fetch all members of the group EXCEPT the current user
    const otherMembers = await db.groupMember.findMany({
      where: {
        groupId: groupId,
        userId: { not: currentUser.id },
      },
      select: { userId: true },
    });

    // 3. Create Notification for EVERY other member in the group
    if (otherMembers.length > 0) {
      const creatorName = currentUser.name || currentUser.email || "A friend";

      await db.notification.createMany({
        data: otherMembers.map((member) => ({
          userId: member.userId,
          title: "New Event Proposed! 🎉",
          message: `${creatorName} proposed "${title}".`,
          link: "/dashboard/groups",
        })),
      });
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}