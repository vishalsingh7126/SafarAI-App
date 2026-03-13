import { Link, useParams } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';

const destinationData = {
  goa: {
    name: 'Goa',
    description:
      'Goa blends relaxed beaches, vibrant coastal culture, Portuguese heritage, and lively food scenes into one of India\'s most versatile holiday destinations.',
    bestTime: 'Nov - Feb',
    budgetRange: '$450 - $900',
    topAttractions: ['Baga Beach', 'Fort Aguada', 'Dudhsagar Falls'],
  },
  manali: {
    name: 'Manali',
    description:
      'Manali is a mountain escape known for snow-lined valleys, adventure sports, cedar forests, and a cool-weather atmosphere that works for both couples and trekkers.',
    bestTime: 'Oct - Feb',
    budgetRange: '$500 - $1100',
    topAttractions: ['Solang Valley', 'Rohtang Pass', 'Hadimba Temple'],
  },
  jaipur: {
    name: 'Jaipur',
    description:
      'Jaipur offers royal architecture, bustling bazaars, grand forts, and a rich Rajasthani cultural identity that makes it a strong heritage destination.',
    bestTime: 'Oct - Mar',
    budgetRange: '$350 - $800',
    topAttractions: ['Amber Fort', 'City Palace', 'Hawa Mahal'],
  },
  kerala: {
    name: 'Kerala',
    description:
      'Kerala combines calm backwaters, tropical greenery, coastal towns, and wellness-focused experiences into a slow and scenic South India journey.',
    bestTime: 'Sep - Mar',
    budgetRange: '$550 - $1200',
    topAttractions: ['Alleppey Backwaters', 'Munnar Tea Gardens', 'Kovalam Beach'],
  },
  'leh-ladakh': {
    name: 'Leh Ladakh',
    description:
      'Leh Ladakh is defined by dramatic high-altitude landscapes, monasteries, winding mountain roads, and some of the most cinematic road-trip routes in India.',
    bestTime: 'Jun - Sep',
    budgetRange: '$700 - $1500',
    topAttractions: ['Pangong Lake', 'Nubra Valley', 'Thiksey Monastery'],
  },
  rishikesh: {
    name: 'Rishikesh',
    description:
      'Rishikesh balances riverside calm, yoga retreats, spiritual landmarks, and adventure activities, making it ideal for both wellness and thrill-focused travelers.',
    bestTime: 'Sep - Apr',
    budgetRange: '$300 - $750',
    topAttractions: ['Laxman Jhula', 'Triveni Ghat', 'River Rafting Zone'],
  },
};

function DestinationDetails() {
  const { name } = useParams();
  const destination = destinationData[name?.toLowerCase() ?? ''];

  usePageMeta(
    destination ? `${destination.name} | SafarAI` : 'Destination Details | SafarAI',
    destination
      ? `Explore attractions, budget expectations, and the best time to visit ${destination.name} with SafarAI.`
      : 'Explore destination details with SafarAI.'
  );

  if (!destination) {
    return (
      <section className="rounded-2xl border border-brand-100 bg-white/90 p-8 shadow-panel">
        <h1 className="text-3xl font-bold text-ink">Destination Not Found</h1>
        <p className="mt-3 text-slate-600">The destination you selected is not available yet.</p>
        <Link
          to="/"
          className="interactive mt-6 inline-flex rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
        >
          Back to Home
        </Link>
      </section>
    );
  }

  const itinerary = [
    `Start with ${destination.topAttractions[0]} and get familiar with the local vibe.`,
    `Reserve the next stretch for ${destination.topAttractions[1]} and nearby food or market stops.`,
    `Wrap up with ${destination.topAttractions[2]} and a relaxed evening around the area.`,
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-brand-100 bg-white/90 p-8 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">Destination Details</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink">{destination.name}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{destination.description}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Best Time to Visit</p>
          <p className="mt-3 text-2xl font-bold text-ink">{destination.bestTime}</p>
        </article>

        <article className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Estimated Budget</p>
          <p className="mt-3 text-2xl font-bold text-ink">{destination.budgetRange}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-ink">Top Attractions</h2>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {destination.topAttractions.length} places
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {destination.topAttractions.map((attraction, index) => (
            <article
              key={attraction}
              className="interactive rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-5 shadow-panel transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 text-sm font-bold text-white">
                {index + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{attraction}</h3>
              <p className="mt-2 text-sm text-slate-600">
                A high-interest stop commonly included in {destination.name} itineraries.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
        <h2 className="text-2xl font-bold text-ink">Suggested Itinerary</h2>
        <ol className="mt-5 space-y-3">
          {itinerary.map((item, index) => (
            <li key={item} className="flex gap-4 rounded-2xl border border-brand-100 bg-mist p-4">
              <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <p className="text-sm leading-6 text-slate-700">{item}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default DestinationDetails;