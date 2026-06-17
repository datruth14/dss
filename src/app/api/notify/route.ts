import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { heading, content, playerIds } = await request.json();

  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    return NextResponse.json({ ok: false, reason: "OneSignal not configured" });
  }

  const body: Record<string, any> = {
    app_id: appId,
    app_url: "https://dss-orpin.vercel.app/tools/inventify/",
    headings: { en: heading },
    contents: { en: content },
  };

  if (playerIds?.length) {
    body.include_player_ids = playerIds;
  } else {
    body.included_segments = ["All"];
  }

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json({ ok: res.ok, data });
}
