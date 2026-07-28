import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    // Interval: de la începutul lunii trecute până peste 3 luni
    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

    // Step 1: Preluăm lista tuturor calendarelor utilizatorului (Primary + Holidays/Sărbători)
    const listRes = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // Adăugăm explicit calendarul primar ȘI calendarele publice de sărbători
    let calendarIds: string[] = [
      "primary",
      "en.ro#holiday@group.v.calendar.google.com",
      "ro.romanian#holiday@group.v.calendar.google.com"
    ];

    try {
      const listRes = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.items && Array.isArray(listData.items)) {
          const userCals = listData.items
            .filter((cal: any) => cal.selected !== false)
            .map((cal: any) => cal.id);
          
          // Combinăm calendarele fără să avem duplicate
          calendarIds = Array.from(new Set([...calendarIds, ...userCals]));
        }
      }
    } catch (err) {
      console.log("Could not fetch calendarList, falling back to defaults", err);
    }

    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData.items && Array.isArray(listData.items)) {
        // Selectăm doar calendarele bifate/vizibile ale utilizatorului
        calendarIds = listData.items
          .filter((cal: any) => cal.selected !== false)
          .map((cal: any) => cal.id);
      }
    }

    // Step 2: Preluăm evenimentele din toate calendarele identificate
    let allGoogleEvents: any[] = [];

    for (const calId of calendarIds) {
      try {
        const calendarRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
            calId
          )}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (calendarRes.ok) {
          const calendarData = await calendarRes.json();
          if (calendarData.items) {
            allGoogleEvents.push(...calendarData.items);
          }
        }
      } catch (e) {
        console.error(`Failed to fetch events for calendar ${calId}`, e);
      }
    }

    // Step 3: Formatăm evenimentele pentru react-big-calendar
    // Step 3: Formatăm evenimentele pentru react-big-calendar
    const busySlots = allGoogleEvents
      .filter((evt: any) => evt.start && (evt.start.dateTime || evt.start.date))
      .map((evt: any) => {
        let start: string;
        let end: string;
        const isAllDay = Boolean(evt.start.date);

        if (isAllDay) {
          // Pentru evenimentele All Day, trimitem direct string-ul YYYY-MM-DD
          // cu ore fixe pentru a preveni conversiile UTC automate ale Node.js
          const dateOnly = evt.start.date; // Ex: "2026-07-29"
          start = `${dateOnly}T00:00:00`;
          end = `${dateOnly}T23:59:59`;
        } else {
          start = new Date(evt.start.dateTime).toISOString();
          end = new Date(evt.end.dateTime).toISOString();
        }

        return {
          id: evt.id,
          title: evt.summary || "Ocupat",
          start,
          end,
          allDay: isAllDay,
        };
      });

    return NextResponse.json({
      success: true,
      count: busySlots.length,
      busySlots,
    });
  } catch (error) {
    console.error("Error syncing Google Calendar:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}