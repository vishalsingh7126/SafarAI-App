import usePageMeta from '../hooks/usePageMeta';

function SafetyPage() {
  usePageMeta('Safety | SafarAI', 'Get travel safety intelligence and context-aware alerts with SafarAI.');

  return (
    <section className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
      <h1 className="text-2xl font-bold text-ink">Travel Safety Intelligence</h1>
      <p className="mt-2 text-slate-600">Starter page for risk signals, safe-zone insights, and emergency-aware trip recommendations.</p>
    </section>
  );
}

export default SafetyPage;
