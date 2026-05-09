/**
 * Loading UI for the /app route segment.
 *
 * This file creates an implicit Suspense boundary that wraps the /app page.tsx.
 * Stack Auth's useUser() calls suspendIfSsr() which suspends the component during
 * SSR. Without a Suspense boundary, Next.js treats the suspension as an error.
 * With loading.tsx in place, Next.js catches the suspension and shows this fallback
 * until client-side hydration takes over and auth state is available.
 */
export default function AppLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid #333',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
