import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/user";
import { db } from "@/lib/db";

// Această linie dezactivează cache-ul și forțează citirea proaspătă din Neon!
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getOrCreateDbUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Cererile PENDING primite
    const pendingRequests = await db.friendship.findMany({
      where: {
        receiverId: currentUser.id,
        status: "PENDING",
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
      },
    });

    // 2. Prieteniile ACCEPTED
    const acceptedFriendships = await db.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: currentUser.id },
          { receiverId: currentUser.id },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, email: true, imageUrl: true } },
        receiver: { select: { id: true, name: true, email: true, imageUrl: true } },
      },
    });

    const friends = acceptedFriendships.map((f) => {
      return f.senderId === currentUser.id ? f.receiver : f.sender;
    });

    return NextResponse.json({
      requests: pendingRequests.map((r) => ({
        id: r.id,
        sender: r.sender,
      })),
      friends,
    });
  } catch (error) {
    console.error("Error fetching friends list:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}