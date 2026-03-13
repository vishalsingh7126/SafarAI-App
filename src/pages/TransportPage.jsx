import usePageMeta from '../hooks/usePageMeta';

function TransportPage() {
  usePageMeta('Transport | SafarAI', 'Railway and transport planning tools for smoother trip movement with SafarAI.');

  return (
    <section className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
      <h1 className="text-2xl font-bold text-ink">Railway & Transport Tools</h1>
      <p className="mt-2 text-slate-600">Starter page for route checks, transfer planning, and transport intelligence modules.</p>
    </section>
  );
}

export default TransportPage;
