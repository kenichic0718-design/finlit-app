// components/AuthButtons.tsx
'use client';

export function LogoutButton() {
  const onClick = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
    } finally {
      // サインアウト後はログインへ
      location.href = '/login?next=%2Fsettings';
    }
  };

  return (
    <button
      onClick={onClick}
      className="rounded border px-3 py-1 hover:bg-gray-50"
      aria-label="ログアウト"
    >
      ログアウト
    </button>
  );
}

