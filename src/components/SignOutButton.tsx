'use client';

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.replace('/');
      }}
      className="pressable h-[52px] w-full rounded-btn bg-card text-[15px] font-semibold text-ink3"
    >
      로그아웃
    </button>
  );
}
