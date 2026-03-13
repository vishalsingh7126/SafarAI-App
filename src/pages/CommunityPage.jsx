import usePageMeta from '../hooks/usePageMeta';

function CommunityPage() {
  usePageMeta('Community | SafarAI', 'Read and share traveler reviews and stories on SafarAI.');

  return (
    <section className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
      <h1 className="text-2xl font-bold text-ink">Traveler Reviews & Stories</h1>
      <p className="mt-2 text-slate-600">Starter page for community posts, trip experiences, and traveler-generated recommendations.</p>
    </section>
  );
}

export default CommunityPage;
