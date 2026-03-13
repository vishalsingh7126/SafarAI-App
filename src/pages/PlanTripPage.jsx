import usePageMeta from '../hooks/usePageMeta';

function PlanTripPage() {
  usePageMeta('Plan Trip | SafarAI', 'Build AI-powered itineraries and save personalized travel plans with SafarAI.');

  return (
    <section className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
      <h1 className="text-2xl font-bold text-ink">AI Travel Planner</h1>
      <p className="mt-2 text-slate-600">Starter page for itinerary generation, saved trips, and trip optimization workflows.</p>
    </section>
  );
}

export default PlanTripPage;
