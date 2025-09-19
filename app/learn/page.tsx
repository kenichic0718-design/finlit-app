'use client';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from "@/lib/supabaseClient";
const supabase = getSupabaseClient();

type Q = {
  id: number; topic: string; question: string;
  choices: string[]; answer_index: number;
  rationale_correct: string; rationale_wrong: string;
};

export default function LearnPage() {
  const [q, setQ] = useState<Q | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);

  const ensureVisitor = () => {
    if (!localStorage.getItem('visitor_id')) {
      const id = crypto.randomUUID();
      localStorage.setItem('visitor_id', id);
    }
    return localStorage.getItem('visitor_id')!;
  };

  const load = async () => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .limit(1)
      .single();
    if (!error && data) setQ({
      ...data,
      choices: Array.isArray(data.choices) ? data.choices : JSON.parse(data.choices)
    });
  };

  useEffect(() => { ensureVisitor(); load(); }, []);

  const answer = async (idx: number) => {
    setChosen(idx);
    if (!q) return;
    const visitor_id = ensureVisitor();
    const { data: prof } = await supabase
      .from('profiles').select('id').eq('visitor_id', visitor_id).single();
    let profile_id = prof?.id;
    if (!profile_id) {
      const ins = await supabase.from('profiles')
        .insert({ visitor_id }).select('id').single();
      profile_id = ins.data?.id;
    }
    if (profile_id) {
      await supabase.from('quiz_results').insert({
        profile_id, question_id: q.id, chosen_index: idx, is_correct: idx===q.answer_index
      });
    }
  };

  if (!q) return <p>読み込み中...</p>;
  const correct = chosen != null ? q.answer_index === chosen : null;

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500">{q.topic}</div>
      <div className="font-semibold">{q.question}</div>
      <div className="space-y-2">
        {q.choices.map((c, i) => (
          <button key={i}
            disabled={chosen !== null}
            onClick={() => answer(i)}
            className={`w-full border rounded p-2 text-left ${chosen===i?'border-black':'border-gray-300'}`}>
            {String.fromCharCode(65+i)}. {c}
          </button>
        ))}
      </div>

      {chosen !== null && (
        <div className="p-3 border border-gray-300 rounded bg-white text-black">
          <div className="font-semibold">{correct ? '正解！' : '不正解'}</div>
          <p className="text-sm mt-1">
            {correct ? q.rationale_correct : q.rationale_wrong}
          </p>
          <div className="mt-3 text-sm">
            <div className="font-semibold">今日の行動提案</div>
            {q.topic === '固定費'
              ? <p>携帯/サブスク/保険の月額を1つ見直してみよう。下の「記録」で固定費カテゴリを確認。</p>
              : <p>「目標」で想定年率を1%上下にして、複利の差を体感してみよう。</p>}
          </div>
        </div>
      )}
    </div>
  );
}

