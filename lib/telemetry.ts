// lib/telemetry.ts
"use client";

export type TelemetryEventType =
  | "session_start"
  | "page_view"
  | "log_created"
  | "budget_saved"
  | "quiz_mini_started"
  | "quiz_mini_completed"
  | "quiz_forced_started"
  | "quiz_forced_completed"
  | "sim_scholar_view"
  | "sim_scholar_run"
  | "sim_budget_view"
  | "sim_budget_run"
  | "category_toggled"
  | "category_added"
  | "category_renamed"; // ★ 追加

type TelemetryDetail = Record<string, unknown>;

/**
 * クライアント側から行動ログを Supabase へ送る。
 * - SSR（window がない環境）では何もしない
 * - 失敗しても UI は壊さない
 */
export async function trackEvent(
  eventType: TelemetryEventType,
  detail?: TelemetryDetail
) {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        event_type: eventType,
        detail: {
          ...detail,
          path: window.location.pathname,
          ua: window.navigator.userAgent,
        },
      }),
    });
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[telemetry] failed to send event", e);
    }
    // 本番では黙って無視（ユーザー体験を優先）
  }
}

