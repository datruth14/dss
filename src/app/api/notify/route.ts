import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { heading, content } = await request.json();

  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    return NextResponse.json({ ok: false, reason: "OneSignal not configured" });
  }

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      included_segments: ["All"],
      headings: { en: heading },
      contents: { en: content },
    }),
  });

  const data = await res.json();
  return NextResponse.json({ ok: res.ok, data });
}
