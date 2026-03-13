import { useMemo, useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';
import { destinationCosts } from '../data/budgetDatabase';
import { stateHotelCosts } from '../data/stateHotelCosts';
import { transportCosts } from '../data/transportCosts';
import { seasonMultipliers } from '../data/seasonMultipliers';
import { formatINR } from '../utils/currencyFormatter';

const STYLE_CONFIG = {
  Budget: {
    multiplier: 0.8,
    color: 'from-emerald-400 to-teal-500',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  Standard: {
    multiplier: 1,
    color: 'from-brand-400 to-accent-500',
    badge: 'bg-brand-100 text-brand-700',
  },
  Luxury: {
    multiplier: 1.6,
    color: 'from-violet-500 to-purple-600',
    badge: 'bg-violet-100 text-violet-700',
  },
};

const DESTINATION_STATE_MAP = {
  goa: 'goa',
  manali: 'himachal_pradesh',
  jaipur: 'rajasthan',
  delhi: 'delhi',
  mumbai: 'maharashtra',
  kerala: 'kerala',
  'leh ladakh': 'ladakh',
  rishikesh: 'uttarakhand',
  udaipur: 'rajasthan',
  shimla: 'himachal_pradesh',
  darjeeling: 'west_bengal',
  gangtok: 'sikkim',
  amritsar: 'punjab',
  varanasi: 'uttar_pradesh',
  pondicherry: 'tamil_nadu',
  hampi: 'karnataka',
  ooty: 'tamil_nadu',
  munnar: 'kerala',
  andaman: 'andaman_nicobar',
  lakshadweep: 'lakshadweep',
};

const RESULT_CARDS = [
  {
    key: 'hotel',
    label: 'Hotel Cost',
    icon: '🏨',
    desc: (days) => `${days} night${days > 1 ? 's' : ''} stay`,
  },
  {
    key: 'food',
    label: 'Food Cost',
    icon: '🍽️',
    desc: (days, travelers) => `${days} day${days > 1 ? 's' : ''} × ${travelers} traveler${travelers > 1 ? 's' : ''}`,
  },
  {
    key: 'travel',
    label: 'Travel Cost',
    icon: '🚆',
    desc: (_, travelers, meta) => `${meta.travelMode} (${meta.distance}) × ${travelers} traveler${travelers > 1 ? 's' : ''}`,
  },
  {
    key: 'activities',
    label: 'Activities Cost',
    icon: '🎭',
    desc: (days) => `${days} day${days > 1 ? 's' : ''} experiences`,
  },
];

const destinationOptions = Object.keys(destinationCosts).map((key) => ({
  value: key,
  label: key
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' '),
}));

function CostCard({ icon, label, desc, amount, style }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:shadow-panel">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xl font-bold text-ink">{formatINR(amount)}</p>
        <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STYLE_CONFIG[style].badge}`}>
          {style}
        </span>
      </div>
    </div>
  );
}

function BudgetCalculator() {
  usePageMeta('Budget Calculator | SafarAI', 'Estimate destination-based travel cost using smart trip budget calculations.');

  const [form, setForm] = useState({
    destination: destinationOptions[0]?.value || '',
    days: '3',
    travelers: '2',
    style: 'Standard',
    travelMode: 'train',
    distance: 'medium',
    season: 'normal',
  });
  const [result, setResult] = useState(null);

  const selectedDestinationLabel = useMemo(
    () => destinationOptions.find((option) => option.value === form.destination)?.label || form.destination,
    [form.destination]
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCalculate(e) {
    e.preventDefault();

    const days = Math.max(1, parseInt(form.days, 10) || 1);
    const travelers = Math.max(1, parseInt(form.travelers, 10) || 1);

    const destination = destinationCosts[form.destination];
    const destinationState = DESTINATION_STATE_MAP[form.destination];
    const hotelCost = stateHotelCosts[destinationState] || destination?.hotelCost || 0;
    const styleMultiplier = STYLE_CONFIG[form.style]?.multiplier || 1;
    const seasonMultiplier = seasonMultipliers[form.season] || 1;

    const modeKey = form.travelMode === 'flight' ? 'flight' : 'train';
    const distanceKey = form.distance in transportCosts ? form.distance : 'medium';
    const transportCost = transportCosts[distanceKey]?.[modeKey] || 0;

    if (!destination) return;

    const dailyCost =
      hotelCost +
      destination.foodCost * travelers +
      destination.activityCost;

    const travelCost = transportCost * travelers;

    const baseHotel = hotelCost * days;
    const baseFood = destination.foodCost * travelers * days;
    const baseActivities = destination.activityCost * days;

    const hotel = Math.round(baseHotel * styleMultiplier * seasonMultiplier);
    const food = Math.round(baseFood * styleMultiplier * seasonMultiplier);
    const activities = Math.round(baseActivities * styleMultiplier * seasonMultiplier);
    const travel = Math.round(travelCost * styleMultiplier * seasonMultiplier);

    const total = Math.round(
      (dailyCost * days + travelCost) * styleMultiplier * seasonMultiplier
    );

    setResult({
      hotel,
      food,
      travel,
      activities,
      total,
      days,
      travelers,
      style: form.style,
      destination: selectedDestinationLabel,
      travelMode: form.travelMode === 'flight' ? 'Flight' : 'Train',
      distance: form.distance.charAt(0).toUpperCase() + form.distance.slice(1),
      season:
        form.season === 'off'
          ? 'Off Season'
          : form.season === 'peak'
            ? 'Peak Season'
            : 'Normal Season',
      styleMultiplier,
      seasonMultiplier,
    });
  }

  const inputBase =
    'w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm text-ink placeholder-slate-400 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-300/50';

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-600">
          💰 Budget Planner
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">Travel Budget Calculator</h1>
        <p className="mt-2 text-base text-slate-500">Estimate travel cost using destination averages, transport, and season intelligence.</p>
      </div>

      <form
        onSubmit={handleCalculate}
        className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="destination">
              Destination
            </label>
            <select
              id="destination"
              name="destination"
              value={form.destination}
              onChange={handleChange}
              className={inputBase}
            >
              {destinationOptions.map((destination) => (
                <option key={destination.value} value={destination.value}>
                  {destination.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="days">
              Number of Days
            </label>
            <input
              id="days"
              name="days"
              type="number"
              min="1"
              max="60"
              value={form.days}
              onChange={handleChange}
              className={inputBase}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="travelers">
              Number of Travelers
            </label>
            <input
              id="travelers"
              name="travelers"
              type="number"
              min="1"
              max="50"
              value={form.travelers}
              onChange={handleChange}
              className={inputBase}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-ink">Travel Style</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.keys(STYLE_CONFIG).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, style }))}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    form.style === style
                      ? `bg-gradient-to-r ${STYLE_CONFIG[style].color} border-transparent text-white shadow-float`
                      : 'border-brand-200 bg-white text-brand-800 hover:border-brand-300 hover:bg-brand-50'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="travelMode">
              Travel Mode
            </label>
            <select
              id="travelMode"
              name="travelMode"
              value={form.travelMode}
              onChange={handleChange}
              className={inputBase}
            >
              <option value="train">Train</option>
              <option value="flight">Flight</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="distance">
              Distance Category
            </label>
            <select
              id="distance"
              name="distance"
              value={form.distance}
              onChange={handleChange}
              className={inputBase}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="season">
              Travel Season
            </label>
            <select
              id="season"
              name="season"
              value={form.season}
              onChange={handleChange}
              className={inputBase}
            >
              <option value="off">Off Season</option>
              <option value="normal">Normal Season</option>
              <option value="peak">Peak Season</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="interactive mt-7 w-full rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 py-3.5 text-sm font-bold text-white shadow-float transition-all duration-200 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
        >
          Calculate Budget
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-ink">
            Budget Estimate for <span className="text-brand-600">{result.destination}</span>
          </h2>

          <div className="space-y-3">
            {RESULT_CARDS.map(({ key, label, icon, desc }) => (
              <CostCard
                key={key}
                icon={icon}
                label={label}
                desc={desc(result.days, result.travelers, result)}
                amount={result[key]}
                style={result.style}
              />
            ))}
          </div>

          <div
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${STYLE_CONFIG[result.style].color} p-6 text-white shadow-float`}
          >
            <div className="absolute right-4 top-4 text-5xl opacity-20">₹</div>
            <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Estimated Total Budget</p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight">{formatINR(result.total)}</p>
            <p className="mt-2 text-sm opacity-75">
              {result.days} day{result.days > 1 ? 's' : ''} · {result.travelers} traveler{result.travelers > 1 ? 's' : ''} · {result.style} style · {result.season}
            </p>
            <p className="mt-1 text-xs opacity-75">
              Multipliers: style ×{result.styleMultiplier} · season ×{result.seasonMultiplier}
            </p>
          </div>

          <p className="text-center text-xs text-slate-400">
            * Estimates are approximate and may vary by booking date, demand, and availability.
          </p>
        </div>
      )}
    </div>
  );
}

export default BudgetCalculator;
