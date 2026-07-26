import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/user";
import { db } from "@/lib/db";

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

    if (email.toLowerCase() === currentUser.email.toLowerCase()) {
      return NextResponse.json({ error: "You cannot send a friend request to yourself!" }, { status: 400 });
    }

    // Find the recipient user by email in Neon DB
    const targetUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "No user found with this email address." },
        { status: 404 }
      );
    }

    // Check if a friendship or request already exists
    const existingFriendship = await db.friendship.findFirst({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: targetUser.id },
          { senderId: targetUser.id, receiverId: currentUser.id },
        ],
      },
    });

    if (existingFriendship) {
      return NextResponse.json(
        { error: "A friend request or friendship already exists between you!" },
        { status: 400 }
      );
    }

    // Create the friend request
    const friendship = await db.friendship.create({
      data: {
        senderId: currentUser.id,
        receiverId: targetUser.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, friendship });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}