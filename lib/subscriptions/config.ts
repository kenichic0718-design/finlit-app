// lib/subscriptions/config.ts
export type SubscriptionDetectConfig = {
  detectionWindowWeeks: number;   // 学習用の探索窓（固定）
  minOccurrences: number;         // 候補化に必要な反復回数
  amountTolerancePct: number;     // 金額近似の許容幅（0.35 = ±35%）
  enableWeeklyRhythm: boolean;    // 週次リズムも検出
  enableMonthlyRhythm: boolean;   // 月次/隔月リズムを検出
  memoHints: string[];            // メモ語彙（部分一致で+1の弱加点）
};

export const DEFAULT_DETECT_CONFIG: SubscriptionDetectConfig = {
  detectionWindowWeeks: 12,
  minOccurrences: 2,
  amountTolerancePct: 0.35,
  enableWeeklyRhythm: true,
  enableMonthlyRhythm: true,
  memoHints: [
    'prime','プライム','netflix','ネトフリ','spotify','spoti','music',
    'youtube','yt','youtubepremium','apple','icloud','i cloud','kindle',
    'amazon','楽天','rakuten','nhk','通信','モバイル','mobile','サブスク',
  ],
};

// “厳密/ゆるめ”のプリセット（UIトグルで切替）
export const STRICT_PRESET: SubscriptionDetectConfig = {
  ...DEFAULT_DETECT_CONFIG,
  minOccurrences: 3,
  amountTolerancePct: 0.25,
};

export const LOOSE_PRESET: SubscriptionDetectConfig = {
  ...DEFAULT_DETECT_CONFIG,
  minOccurrences: 2,
  amountTolerancePct: 0.35,
};

