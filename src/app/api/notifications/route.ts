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


    const notifications = await db.notification.findMany({
      where: { 
        userId: currentUser.id,
        isRead: false 
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      unreadCount: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


export async function DELETE(req: Request) {
  try {
    const currentUser = await getOrCreateDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("id");

    if (notificationId) {
      await db.notification.delete({
        where: { id: notificationId },
      });
    } else {

      await db.notification.deleteMany({
        where: { userId: currentUser.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}