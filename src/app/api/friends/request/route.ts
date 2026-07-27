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

    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const receiver = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!receiver) {
      return NextResponse.json({ error: "User not found with this email." }, { status: 404 });
    }

    if (receiver.id === currentUser.id) {
      return NextResponse.json({ error: "You cannot add yourself." }, { status: 400 });
    }

    // Check existing request
    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: currentUser.id },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Friendship request already exists." }, { status: 400 });
    }

    // Create Friendship
    const friendship = await db.friendship.create({
      data: {
        senderId: currentUser.id,
        receiverId: receiver.id,
        status: "PENDING",
      },
    });

    // Create Notification for the receiver
    await db.notification.create({
      data: {
        userId: receiver.id,
        title: "New Friend Request 👋",
        message: `${currentUser.name || currentUser.email} sent you a friend request.`,
        link: "/dashboard/friends",
      },
    });

    return NextResponse.json({ success: true, friendship });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}