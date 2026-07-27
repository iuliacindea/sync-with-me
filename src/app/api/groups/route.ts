import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/user";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getOrCreateDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await db.groupMember.findMany({
      where: { userId: currentUser.id },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, imageUrl: true },
                },
              },
            },
            events: {
              include: {
                rsvps: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });

    const groups = memberships.map((m) => m.group);
    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getOrCreateDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, friendIds } = await req.json();

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Group name is required." }, { status: 400 });
    }

    const allMemberIds = Array.from(new Set([currentUser.id, ...(friendIds || [])]));

    const group = await db.group.create({
      data: {
        name: name.trim(),
        members: {
          create: allMemberIds.map((userId) => ({
            userId,
            role: userId === currentUser.id ? "ADMIN" : "MEMBER",
          })),
        },
      },
      include: {
        members: true,
        events: true,
      },
    });

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}