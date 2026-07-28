import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, start, end, isAllDay, timeZone } = await req.json();

    if (!title || !start) {
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
      // Pentru all-day, trimitem exact data YYYY-MM-DD
      const dateStr = start.split("T")[0];
      eventBody.start = { date: dateStr };
      eventBody.end = { date: dateStr };
    } else {
      // Pentru ore specifice, includem timezone-ul local
      eventBody.start = { dateTime: new Date(start).toISOString(), timeZone: userTimeZone };
      eventBody.end = { dateTime: new Date(end).toISOString(), timeZone: userTimeZone };
    }

    const googleRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!googleRes.ok) {
      const errData = await googleRes.json();
      console.error("Google Calendar Insert Error:", errData);
      return NextResponse.json(
        { error: errData?.error?.message || "Failed to add event to Google Calendar." },
        { status: googleRes.status }
      );
    }

    const newEvent = await googleRes.json();
    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    console.error("Error creating Google event:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}