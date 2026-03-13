import usePageMeta from '../hooks/usePageMeta';

function ProfilePage() {
  usePageMeta('Profile | SafarAI', 'Manage account preferences, saved trips, and personalization settings in SafarAI.');

  return (
    <section className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
      <h1 className="text-2xl font-bold text-ink">User Account & Saved Trips</h1>
      <p className="mt-2 text-slate-600">Starter page for account details, saved itineraries, and personalization controls.</p>
    </section>
  );
}

export default ProfilePage;
