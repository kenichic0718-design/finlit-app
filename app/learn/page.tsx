// app/learn/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * 「学ぶ」トップページ
 *
 * - 事前テスト（Pre）
 * - 毎日のミニクイズ
 * - ミニクイズの成績
 * - 事後テスト（Post）
 *
 * ※ 「今日の必須5問」はレイアウト上のカードからは外し、
 *    ログイン後の強制出題（RequiredGate）でのみ出現させる。
 */
export default function LearnPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">学ぶ</h1>
        <p className="text-sm leading-relaxed text-neutral-200">
          家計管理・借入・インフレ・投資など、大学生にとって身近なお金のテーマを学びます。
          事前テスト → 日々の学び → 事後テスト、という流れを想定しています。
        </p>
        <p className="text-xs text-emerald-300">
          ログイン中のため、クイズの成績やテスト結果はあなたのアカウントに紐づいて保存されます。
        </p>
      </header>

      <section className="space-y-4">
        {/* 事前テスト */}
        <Link
          href="/learn/pretest"
          className="block rounded-2xl border border-zinc-700/70 bg-zinc-900/70 p-4 shadow-sm transition hover:border-emerald-500/60 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="inline-flex items-center rounded-full border border-emerald-500/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                STEP 1
              </div>
              <h2 className="text-base font-semibold">事前テスト（Pre）</h2>
            </div>
            <span className="text-xs text-neutral-400">約10分</span>
          </div>
          <p className="mt-2 text-sm text-neutral-200">
            学習前の金融リテラシーを測る20問テストです。時間の目安は約10分です。
          </p>
          <p className="mt-3 text-xs text-neutral-400 text-right">→ 開始する</p>
        </Link>

        {/* 毎日のミニクイズ */}
        <Link
          href="/learn/quiz"
          className="block rounded-2xl border border-zinc-700/70 bg-zinc-900/70 p-4 shadow-sm transition hover:border-emerald-500/60 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="inline-flex items-center rounded-full border border-emerald-500/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                STEP 2
              </div>
              <h2 className="text-base font-semibold">毎日のミニクイズ</h2>
            </div>
            <span className="text-xs text-neutral-400">すきま時間でOK</span>
          </div>
          <p className="mt-2 text-sm text-neutral-200">
            家計管理・借入・インフレ・投資などの短いクイズで、少しずつ理解を深めます。
          </p>
          <p className="mt-3 text-xs text-neutral-400 text-right">→ クイズに進む</p>
        </Link>

        {/* ミニクイズの成績 */}
        <Link
          href="/learn/stats"
          className="block rounded-2xl border border-zinc-700/70 bg-zinc-900/70 p-4 shadow-sm transition hover:border-emerald-500/60 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="inline-flex items-center rounded-full border border-zinc-600 px-2 py-0.5 text-[10px] font-semibold text-neutral-200">
                学習の振り返り
              </div>
              <h2 className="text-base font-semibold">ミニクイズの成績</h2>
            </div>
          </div>
          <p className="mt-2 text-sm text-neutral-200">
            直近30日間のミニクイズの正答率や、テーマ別の得意・苦手を確認できます。
          </p>
          <p className="mt-3 text-xs text-neutral-400 text-right">→ 成績を見る</p>
        </Link>

        {/* 事後テスト */}
        <Link
          href="/learn/posttest"
          className="block rounded-2xl border border-zinc-700/70 bg-zinc-900/70 p-4 shadow-sm transition hover:border-emerald-500/60 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="inline-flex items-center rounded-full border border-emerald-500/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                STEP 3
              </div>
              <h2 className="text-base font-semibold">事後テスト（Post）</h2>
            </div>
            <span className="text-xs text-neutral-400">約10分</span>
          </div>
          <p className="mt-2 text-sm text-neutral-200">
            学習後の金融リテラシーを測る20問テストです。事前テストと同じ形式で、理解の変化を確認できます。
          </p>
          <p className="mt-3 text-xs text-neutral-400 text-right">→ 開始する</p>
        </Link>
      </section>
    </main>
  );
}

