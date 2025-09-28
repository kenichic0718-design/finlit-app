// app/api/exports/csv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRoute } from "@/app/_supabase/route";

function ymOrThisMonth(ym?: string | null) {
  const now = new Date();
  return ym && /^\d{4}-\d{2}$/.test(ym)
    ? ym
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ym = ymOrThisMonth(url.searchParams.get("month"));
  const start = new Date(`${ym}-01T00:00:00Z`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const supabase = getSupabaseRoute();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("sign_in_required", { status: 401 });
  }

  const { data, error } = await supabase
    .from("logs")
    .select("at, kind, amount, category_id, categories(name), memo")
    .eq("user_id", user.id)
    .gte("at", start.toISOString())
    .lt("at", end.toISOString())
    .order("at", { ascending: true });

  if (error) return new NextResponse(error.message, { status: 500 });

  const header = "at,kind,amount,category_id,category_name,memo\n";
  const rows =
    (data ?? [])
      .map((r: any) =>
        [
          new Date(r.at).toISOString(),
          r.kind,
          r.amount,
          r.category_id,
          (r.categories?.name ?? "").replace(/,/g, " "),
          (r.memo ?? "").toString().replace(/[\r\n,]/g, " "),
        ].join(",")
      )
      .join("\n") + "\n";

  return new NextResponse(header + rows, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="logs-${ym}.csv"`,
    },
  });
}

