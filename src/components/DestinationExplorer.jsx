import { Link } from 'react-router-dom';

const destinations = [
  {
    name: 'Goa',
    description: 'Golden beaches, vibrant nightlife, and Portuguese heritage charm.',
    budget: '₹37,000 – ₹75,000',
    bestTime: 'Nov - Feb',
    image:
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&q=80',
  },
  {
    name: 'Manali',
    description: 'Snow-capped peaks, pine valleys, and scenic mountain adventures.',
    budget: '₹41,000 – ₹91,000',
    bestTime: 'Oct - Feb',
    image:
      'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1400&q=80',
  },
  {
    name: 'Jaipur',
    description: 'Royal palaces, colorful bazaars, and timeless cultural landmarks.',
    budget: '₹29,000 – ₹66,000',
    bestTime: 'Oct - Mar',
    image:
      'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1400&q=80',
  },
  {
    name: 'Kerala',
    description: 'Backwaters, lush greenery, and serene coastal wellness escapes.',
    budget: '₹46,000 – ₹1,00,000',
    bestTime: 'Sep - Mar',
    image:
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1400&q=80',
  },
  {
    name: 'Leh Ladakh',
    description: 'High-altitude deserts, dramatic passes, and epic road journeys.',
    budget: '₹58,000 – ₹1,25,000',
    bestTime: 'Jun - Sep',
    image:
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1400&q=80',
  },
  {
    name: 'Rishikesh',
    description: 'River adventures, yoga retreats, and peaceful Himalayan vibes.',
    budget: '₹25,000 – ₹62,000',
    bestTime: 'Sep - Apr',
    image:
      'https://images.unsplash.com/photo-1624958723474-8163f8f8fdb7?auto=format&fit=crop&w=1400&q=80',
  },
];

const toDestinationPath = (name) => `/destination/${name.toLowerCase().replace(/\s+/g, '-')}`;

function DestinationExplorer() {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Explore Popular Destinations</h2>
          <p className="mt-1 text-sm text-slate-600 md:text-base">Discover amazing places travelers love.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {destinations.map((destination) => (
          <article
            key={destination.name}
            className="group interactive overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="relative h-52 overflow-hidden">
              <img
                src={destination.image}
                alt={destination.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-800">
                {destination.budget}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-lg font-bold text-white">{destination.name}</p>
                <p className="mt-1 text-sm text-white/85">{destination.bestTime}</p>
              </div>
            </div>

            <div className="space-y-3 p-5">
              <p className="text-sm leading-6 text-slate-600">{destination.description}</p>

              <div className="flex items-center justify-between rounded-xl bg-mist px-3 py-2 text-xs font-semibold text-slate-600">
                <span>Best time to visit</span>
                <span className="text-brand-700">{destination.bestTime}</span>
              </div>

              <Link
                to={toDestinationPath(destination.name)}
                className="interactive mt-1 block w-full rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
              >
                Explore Destination
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DestinationExplorer;
