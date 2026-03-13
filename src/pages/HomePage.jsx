import HeroSection from '../components/HeroSection';
import FeatureCards from '../components/FeatureCards';
import DestinationExplorer from '../components/DestinationExplorer';
import IndiaTravelMap from '../components/IndiaTravelMap';
import usePageMeta from '../hooks/usePageMeta';

function HomePage() {
  usePageMeta(
    'SafarAI | AI-Powered Travel Planning Platform',
    'SafarAI helps travelers plan smarter and safer with AI itinerary generation, destination intelligence, transport tools, and personalized recommendations.'
  );

  return (
    <div className="bg-gradient-to-b from-white via-brand-50/40 to-accent-50/30">
      <div className="mx-auto max-w-6xl space-y-16 px-4 md:px-6">
        <HeroSection />
        <DestinationExplorer />
        <IndiaTravelMap />
        <FeatureCards />

        <section className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-2">
        <article className="interactive rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <h2 className="text-xl font-bold text-ink md:text-2xl">Explore Destinations</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Compare neighborhoods, culture, weather patterns, and seasonal events with AI-curated destination snapshots.</p>
        </article>
        <article className="interactive rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <h2 className="text-xl font-bold text-ink md:text-2xl">Travel Tools</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Use budget estimators, railway checkers, safety advisories, and map exploration tools from one streamlined dashboard.</p>
        </article>
        </section>
      </div>
    </div>
  );
}

export default HomePage;
