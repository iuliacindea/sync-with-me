import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, start, end, isAllDay, timeZone } = await req.json();

    if (!id || !title || !start) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const client = await clerkClient();
    let tokenResponse = await client.users.getUserOauthAccessToken(
      clerkUserId,
      "oauth_google"
    );

    let accessToken = tokenResponse?.data?.[0]?.token;

    if (!accessToken) {
      tokenResponse = await client.users.getUserOauthAccessToken(
        clerkUserId,
        "google"
      );
      accessToken = tokenResponse?.data?.[0]?.token;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google account not connected or missing permissions." },
        { status: 400 }
      );
    }

    const userTimeZone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Bucharest";

    const eventBody: any = { summary: title };

    if (isAllDay) {
      const dateStr = start.split("T")[0];
      eventBody.start = { date: dateStr };
      eventBody.end = { date: dateStr };
    } else {
      eventBody.start = { dateTime: new Date(start).toISOString(), timeZone: userTimeZone };
      eventBody.end = { dateTime: new Date(end).toISOString(), timeZone: userTimeZone };
    }

    const googleRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!googleRes.ok) {
      const errData = await googleRes.json();
      console.error("Google Calendar Update Error:", errData);
      return NextResponse.json(
        { error: errData?.error?.message || "Failed to update event." },
        { status: googleRes.status }
      );
    }

    const updatedEvent = await googleRes.json();
    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error("Error updating Google event:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
    }

    const client = await clerkClient();
    let tokenResponse = await client.users.getUserOauthAccessToken(
      clerkUserId,
      "oauth_google"
    );

    let accessToken = tokenResponse?.data?.[0]?.token;

    if (!accessToken) {
      tokenResponse = await client.users.getUserOauthAccessToken(
        clerkUserId,
        "google"
      );
      accessToken = tokenResponse?.data?.[0]?.token;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google account not connected." },
        { status: 400 }
      );
    }

    const googleRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!googleRes.ok) {
      return NextResponse.json(
        { error: "Failed to delete event from Google Calendar." },
        { status: googleRes.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Google event:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}