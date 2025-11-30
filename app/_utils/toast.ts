// app/_utils/toast.ts
'use client';

export type ToastType = 'info' | 'success' | 'error';

function ensureContainer() {
  let el = document.getElementById('toast-root') as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-root';
    Object.assign(el.style, {
      position: 'fixed',
      right: '16px',
      bottom: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: '9999',
      pointerEvents: 'none',
    } as CSSStyleDeclaration);
    document.body.appendChild(el);
  }
  return el;
}

export function toast(message: string, type: ToastType = 'info', ms = 2600) {
  if (typeof window === 'undefined') return;
  const root = ensureContainer();
  const card = document.createElement('div');
  const color =
    type === 'success' ? '#16a34a' :
    type === 'error'   ? '#dc2626' : '#2563eb';

  Object.assign(card.style, {
    pointerEvents: 'auto',
    color: '#111827',
    background: 'white',
    border: `1px solid ${color}`,
    boxShadow: '0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '14px',
    maxWidth: '360px',
    transition: 'transform .15s ease, opacity .15s ease',
  } as CSSStyleDeclaration);

  card.textContent = message;
  root.appendChild(card);
  requestAnimationFrame(() => {
    card.style.transform = 'translateY(0)';
    card.style.opacity = '1';
  });

  const timer = setTimeout(() => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(6px)';
    setTimeout(() => root.removeChild(card), 200);
  }, ms);

  card.addEventListener('click', () => {
    clearTimeout(timer);
    card.style.opacity = '0';
    card.style.transform = 'translateY(6px)';
    setTimeout(() => root.removeChild(card), 200);
  });
}

