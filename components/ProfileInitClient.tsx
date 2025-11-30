// components/ProfileInitClient.tsx
"use client";

import { useEffect, useRef } from "react";

/**
 * ログイン済みユーザーのプロフィール初期化＆カテゴリ初期投入を行うためのクライアント。
 *
 * - マウント時に /api/profile/init を POST する
 * - categories が既にあれば何もしない（/api/profile/init 側が判定）
 * - 未ログインなら 401 が返るが、無視して問題なし
 */
export default function ProfileInitClient() {
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    // 失敗しても UI は止めず、ログだけ出しておく
    fetch("/api/profile/init", {
      method: "POST",
      credentials: "include",
    }).catch((err) => {
      console.warn("[ProfileInitClient] init failed", err);
    });
  }, []);

  return null;
}

