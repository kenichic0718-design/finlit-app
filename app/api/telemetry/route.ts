// app/api/telemetry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getCurrentProfileId } from "@/app/_utils/getCurrentProfileId";

/**
 * 受け付けるイベント種別の一覧
 * （ここに入っていない event_type は 400 にする）
 */
const ALLOWED_EVENT_TYPES = [
  "session_start",
  "page_view",
  "log_created",
  "budget_saved",
  "quiz_mini_started",
  "quiz_mini_completed",
  "quiz_forced_started",
  "quiz_forced_completed",
  "sim_scholar_view",
  "sim_scholar_run",
  "sim_budget_view",
  "sim_budget_run",
  "category_toggled",
  "category_added",
  "category_renamed", // ★ ここを追加
] as const;

type AllowedEventType = (typeof ALLOWED_EVENT_TYPES)[number];

type Body = {
  event_type?: string;
  detail?: unknown;
};

function jsonError(status: number, message: string, detail?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      detail,
    },
    { status },
  );
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonError(400, "invalid_json", "JSON のパースに失敗しました。");
  }

  const eventTypeRaw = (body.event_type ?? "").toString();
  const detail = body.detail ?? null;

  if (!eventTypeRaw) {
    return jsonError(400, "missing_event_type", "`event_type` がありません。");
  }

  // 許可されているイベントのみ受け付ける
  if (!ALLOWED_EVENT_TYPES.includes(eventTypeRaw as AllowedEventType)) {
    return jsonError(
      400,
      "invalid_event_type",
      `この event_type は受け付けていません: ${eventTypeRaw}`,
    );
  }

  const supabase = supabaseServer();

  // ログインしていないケースもあるので null を許容
  const profileId = await getCurrentProfileId().catch(() => null);

  try {
    const { error } = await supabase.from("telemetry_events").insert({
      profile_id: profileId ?? null,
      event_type: eventTypeRaw,
      detail,
    });

    if (error) {
      // ★ ここで 500 を返さず、ログだけ出して成功扱いにする
      console.error("[/api/telemetry] insert error (ignored for UX)", error);
      return NextResponse.json(
        { ok: false, error: "insert_failed" },
        { status: 200 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("[/api/telemetry] unexpected error (ignored for UX)", err);
    return NextResponse.json(
      {
        ok: false,
        error: "unexpected_error",
        detail: err?.message ?? "予期せぬエラーが発生しました。",
      },
      { status: 200 },
    );
  }
}
