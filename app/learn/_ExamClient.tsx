// app/learn/_ExamClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PRE_QUESTIONS,
  POST_QUESTIONS,
  type FlatExamQuestion,
} from './_examQuestions';
import { trackEvent } from '@/lib/telemetry'; // ★ 追加：テレメトリ

export type ExamAnswerDetail = {
  topic: string;
  questionId: string;
  correctIndex: number;
  selectedIndex: number | null;
  isCorrect: boolean;
};

type Mode = 'pre' | 'post';

type Props = {
  mode: Mode;
  /** ラベル用。省略時は mode と同じ（pre / post） */
  kind?: 'pre' | 'post';
  /** 解答完了時にスコア & 詳細を親へ渡す */
  onFinish?: (
    score: number,
    total: number,
    details: ExamAnswerDetail[],
  ) => void;
};

export default function ExamClient({ mode, kind = mode, onFinish }: Props) {
  const [cursor, setCursor] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);

  // 20問固定（PRE / POST どちらも EXAM_ITEMS 由来で 20問）
  const questions: FlatExamQuestion[] = useMemo(
    () => (mode === 'pre' ? PRE_QUESTIONS : POST_QUESTIONS),
    [mode],
  );

  const current = questions[cursor];

  // 表示用スコア（事後テスト完了画面で使用）
  const correctCount = useMemo(
    () =>
      questions.reduce((acc, q, idx) => {
        const a = answers[idx];
        return a === q.answerIndex ? acc + 1 : acc;
      }, 0),
    [answers, questions],
  );

  // ★ 追加：事前/事後テスト開始のテレメトリ（初回マウント時に1回）
  useEffect(() => {
    void trackEvent('quiz_forced_started', {
      phase: kind, // "pre" | "post"
      totalCount: questions.length,
    });
  }, [kind, questions.length]);

  const handleChoose = (idx: number) => {
    // 一度選んだ選択肢は変更不可
    if (answers[cursor] !== null && answers[cursor] !== undefined) return;

    const nextAnswers = [...answers];
    nextAnswers[cursor] = idx;
    setAnswers(nextAnswers);

    const isLast = cursor + 1 === questions.length;

    // 最終的なスコアをローカルで計算（useMemo 依存ではなく nextAnswers ベース）
    const finalScore = questions.reduce((acc, q, index) => {
      const a = nextAnswers[index];
      return a === q.answerIndex ? acc + 1 : acc;
    }, 0);

    // SQL で使えるような詳細 JSON
    const details: ExamAnswerDetail[] = questions.map((q, index) => {
      const selected = nextAnswers[index] ?? null;
      return {
        topic: q.topic,
        questionId: q.id,
        correctIndex: q.answerIndex,
        selectedIndex: selected,
        isCorrect: selected === q.answerIndex,
      };
    });

    // 自動遷移（0.5秒ディレイ）
    setTimeout(() => {
      if (isLast) {
        // ★ 追加：事前/事後テスト完了のテレメトリ
        void trackEvent('quiz_forced_completed', {
          phase: kind, // "pre" | "post"
          correctCount: finalScore,
          totalCount: questions.length,
        });

        setFinished(true);
        onFinish?.(finalScore, questions.length, details);
      } else {
        setCursor((c) => c + 1);
      }
    }, 500);
  };

  if (finished) {
    const isPre = kind === 'pre';
    const isPost = kind === 'post';

    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-50">
          {isPre ? '事前テスト' : '事後テスト'}
        </h2>
        <p className="text-sm text-zinc-200">
          あなたの{isPre ? '事前' : '事後'}テストは完了しました。
          このスコアは今後の学習統計に反映されます。
        </p>

        {/* 事後テストだけスコアを画面表示 */}
        {isPost && (
          <p className="text-sm text-zinc-300">
            スコア：{correctCount} / {questions.length}
          </p>
        )}

        <Link
          href="/learn"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20"
        >
          学ぶページへ戻る
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <div>
          問 {cursor + 1} / {questions.length}
        </div>
        <div>{kind === 'pre' ? '事前テスト' : '事後テスト'}</div>
      </div>

      <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/70 p-4">
        <p className="text-sm font-medium text-zinc-50">
          {current.question}
        </p>
      </div>

      <ul className="space-y-3">
        {current.choices.map((choice, idx) => {
          const selected = answers[cursor] === idx;

          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => handleChoose(idx)}
                className={[
                  'w-full rounded-xl border px-3 py-2 text-left text-sm transition',
                  selected
                    ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-100'
                    : 'border-zinc-700/70 bg-zinc-900/70 text-zinc-100 hover:border-zinc-500',
                ].join(' ')}
              >
                {choice}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 h-1.5 w-full rounded-full bg-zinc-800">
        <div
          className="h-1.5 rounded-full bg-emerald-500"
          style={{
            width: `${((cursor + 1) / questions.length) * 100}%`,
          }}
        />
      </div>
    </section>
  );
}

