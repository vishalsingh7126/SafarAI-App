import { useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';

const MOCK_TRAINS = [
  {
    name: 'Rajdhani Express',
    number: '12301',
    departure: '16:55',
    arrival: '10:00+1',
    duration: '17h 05m',
    from: 'New Delhi',
    to: 'Howrah',
  },
  {
    name: 'Shatabdi Express',
    number: '12001',
    departure: '06:00',
    arrival: '14:00',
    duration: '8h 00m',
    from: 'New Delhi',
    to: 'Bhopal',
  },
  {
    name: 'Duronto Express',
    number: '12213',
    departure: '23:15',
    arrival: '15:30+1',
    duration: '16h 15m',
    from: 'Mumbai Central',
    to: 'New Delhi',
  },
  {
    name: 'Vande Bharat Express',
    number: '22436',
    departure: '06:00',
    arrival: '14:00',
    duration: '8h 00m',
    from: 'New Delhi',
    to: 'Varanasi',
  },
];

const STATIONS = [
  { name: 'New Delhi', code: 'NDLS', city: 'New Delhi' },
  { name: 'Mumbai Central', code: 'BCT', city: 'Mumbai' },
  { name: 'Chennai Central', code: 'MAS', city: 'Chennai' },
  { name: 'Howrah Junction', code: 'HWH', city: 'Kolkata' },
  { name: 'KSR Bengaluru City', code: 'SBC', city: 'Bengaluru' },
];

function RailwayExplorer() {
  usePageMeta('Railway Explorer | SafarAI', 'Search trains, check PNR status, and explore Indian railway stations with SafarAI.');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const [pnrNumber, setPnrNumber] = useState('');

  const handleSearchTrains = () => {
    setSearchResults(MOCK_TRAINS);
  };

  const inputClass =
    'w-full rounded-xl border border-brand-100 bg-white/80 px-4 py-2.5 text-sm text-ink placeholder-slate-400 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 transition';

  const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink">Indian Railway Explorer</h1>
        <p className="mt-2 text-slate-600">Search trains, check PNR status, and explore railway stations.</p>
      </div>

      {/* Section 1 — Train Search */}
      <section className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
        <div className="mb-5 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-xs font-bold text-white">
            TS
          </div>
          <h2 className="text-xl font-bold text-ink">Train Search</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>From Station</label>
            <input
              type="text"
              placeholder="e.g. New Delhi"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>To Station</label>
            <input
              type="text"
              placeholder="e.g. Mumbai Central"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Travel Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSearchTrains}
          className="interactive mt-5 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-6 py-2.5 text-sm font-semibold text-white shadow-float hover:opacity-90"
        >
          Search Trains
        </button>

        {searchResults && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold text-slate-500">
              Showing {searchResults.length} example trains
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {searchResults.map((train) => (
                <article
                  key={train.number}
                  className="interactive group rounded-xl border border-brand-100 bg-white p-4 shadow-sm hover:-translate-y-1 hover:shadow-float"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink">{train.name}</p>
                      <p className="text-xs text-slate-500">#{train.number}</p>
                    </div>
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                      {train.duration}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-ink">{train.departure}</p>
                      <p className="text-xs text-slate-500">{train.from}</p>
                    </div>
                    <div className="flex flex-1 items-center gap-1">
                      <div className="h-px flex-1 border-t-2 border-dashed border-brand-200" />
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-ink">{train.arrival}</p>
                      <p className="text-xs text-slate-500">{train.to}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Section 2 — PNR Status */}
      <section className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
        <div className="mb-5 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-xs font-bold text-white">
            PNR
          </div>
          <h2 className="text-xl font-bold text-ink">PNR Status</h2>
        </div>

        <div className="max-w-sm">
          <label className={labelClass}>PNR Number</label>
          <input
            type="text"
            placeholder="Enter 10-digit PNR"
            maxLength={10}
            value={pnrNumber}
            onChange={(e) => setPnrNumber(e.target.value.replace(/\D/g, ''))}
            className={inputClass}
          />
        </div>

        <div className="mt-5 rounded-xl border border-accent-100 bg-accent-50/60 p-4">
          <p className="text-sm text-slate-700">
            Click below to check official railway PNR status.
          </p>
          <a
            href="https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html"
            target="_blank"
            rel="noopener noreferrer"
            className="interactive mt-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-sm hover:border-brand-300 hover:bg-brand-50"
          >
            Check PNR on Indian Railways
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </section>

      {/* Section 3 — Station Explorer */}
      <section className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
        <div className="mb-5 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-xs font-bold text-white">
            SE
          </div>
          <h2 className="text-xl font-bold text-ink">Station Explorer</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {STATIONS.map((station) => (
            <article
              key={station.code}
              className="interactive group rounded-2xl border border-brand-100 bg-white p-5 shadow-panel hover:-translate-y-1 hover:shadow-float"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-xs font-bold text-white transition group-hover:scale-105">
                {station.code.slice(0, 2)}
              </div>
              <h3 className="text-sm font-semibold text-ink">{station.name}</h3>
              <p className="mt-1 text-xs font-bold tracking-widest text-brand-600">{station.code}</p>
              <p className="mt-0.5 text-xs text-slate-500">{station.city}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default RailwayExplorer;
