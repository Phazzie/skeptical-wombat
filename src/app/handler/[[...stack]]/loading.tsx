/**
 * Loading UI for the /handler route segment.
 *
 * Stack Auth's StackHandler component may internally call suspendIfSsr()
 * when rendered on the server. This loading.tsx creates a Suspense boundary
 * so that suspension is caught and shows this fallback instead of a 500 error.
 */
export default function HandlerLoading() {
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
