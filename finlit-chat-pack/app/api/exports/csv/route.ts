// app/api/exports/csv/route.ts
import { getSupabaseRoute } from "@/app/_supabase/server";

export const dynamic = "force-dynamic";

function startEndFromYM(ym?: string) {
  const now = new Date();
  const [y, m] = (ym || now.toISOString().slice(0, 7)).split("-").map(Number);
  const start = new Date(y, (m ?? now.getMonth() + 1) - 1, 1, 0, 0, 0);
  const end = new Date(y, (m ?? now.getMonth() + 1), 1, 0, 0, 0);
  return { start, end };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ym = searchParams.get("month") || undefined;
  const { start, end } = startEndFromYM(ym);

  const supabase = await getSupabaseRoute();

  const { data, error } = await supabase
    .from("logs")
    .select("created_at, kind, amount, category_id, memo")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    return new Response(`error,${error.message}`, {
      headers: { "content-type": "text/csv; charset=utf-8" },
      status: 500,
    });
  }

  const header = ["created_at", "kind", "amount", "category_id", "memo"].join(",");
  const lines = (data || []).map((r: any) =>
    [
      new Date(r.created_at).toISOString(),
      r.kind ?? "",
      r.amount ?? 0,
      r.category_id ?? "",
      (String(r.memo ?? "") || "").replace(/"/g, '""'), // CSV escape
    ].join(","),
  );
  const csv = [header, ...lines].join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="logs_${ym || new Date().toISOString().slice(0,7)}.csv"`,
    },
  });
}

