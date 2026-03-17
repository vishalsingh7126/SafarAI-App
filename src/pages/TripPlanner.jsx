import { searchCities } from '../services/destinationService';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import usePageMeta from '../hooks/usePageMeta';
import { generateAITravelResponse } from '../services/aiService';
import { supabase } from '../services/supabase';

const STYLE_OPTIONS = [
  { value: 'adventure', label: 'Adventure', icon: '🏔️', desc: 'Thrilling activities' },
  { value: 'relaxation', label: 'Relaxation', icon: '🌊', desc: 'Rest and recharge' },
  { value: 'cultural', label: 'Cultural', icon: '🏛️', desc: 'History and arts' },
  { value: 'food', label: 'Food & Cuisine', icon: '🍜', desc: 'Local flavors' },
  { value: 'nature', label: 'Nature', icon: '🌿', desc: 'Outdoors and wildlife' },
];

function TripPlanner() {
  usePageMeta(
    'Trip Planner | SafarAI',
    'Generate AI-powered multi-day travel itineraries with SafarAI.'
  );

  const [destination, setDestination] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [style, setStyle] = useState('cultural');
  const [itinerary, setItinerary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState('');

  const handleDestinationChange = async (value) => {
  setDestination(value);
  setActiveSuggestion(-1); // ← resets arrow selection on new typing
  if (value.trim().length >= 2) {
    const result = await searchCities(value);
    if (result.success && result.data.length > 0) {
      setSuggestions(result.data);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  } else {
    setSuggestions([]);
    setShowSuggestions(false);
  }
};

  const handleSuggestionClick = (city) => {
    setDestination(city.display_name || city.name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const calcDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate) - new Date(startDate);
    return diff < 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleGenerate = async () => {
    const days = calcDays();
    if (!destination.trim() || days <= 0) return;
    setIsGenerating(true);
    setItinerary(null);
    setError('');
    setSavedMsg(false);

    const selectedStyle = STYLE_OPTIONS.find(s => s.value === style);

    const prompt = `Create a detailed ${days}-day travel itinerary for ${destination.trim()}.
Travel style: ${selectedStyle?.label} — ${selectedStyle?.desc}
Travel dates: ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}

Format the response exactly like this for each day:
## Day 1 — [Creative theme for the day]
**Morning:** [Specific activity with real place names and details]
**Afternoon:** [Specific activity with real place names and details]
**Evening:** [Specific activity with real place names and details]
**🍽️ Food tip:** [Specific local dish and restaurant name to try]
**💡 Pro tip:** [One practical travel tip for this day]

Continue this exact format for all ${days} days. Use real place names, specific restaurant recommendations, and genuinely useful tips. Make it feel like advice from a local expert.`;

    const response = await generateAITravelResponse(prompt);
    if (response) {
      setItinerary(response);
    } else {
      setError('Something went wrong. Please try again.');
    }
    setIsGenerating(false);
  };

  const handleSaveTrip = async () => {
    if (!itinerary) return;
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const trip = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        destination: destination.trim(),
        startDate,
        endDate,
        days: calcDays(),
        travelStyle: style,
        itinerary,
        dateCreated: new Date().toISOString(),
      };
      try {
        const stored = localStorage.getItem('safarai_trips');
        const existing = stored ? JSON.parse(stored) : [];
        localStorage.setItem('safarai_trips', JSON.stringify([...existing, trip]));
        setSavedMsg(true);
      } catch {
        setError('Could not save trip. Please try again.');
      }
      setIsSaving(false);
      return;
    }

    const { error: saveError } = await supabase
      .from('itineraries')
      .insert([{
        user_id: user.id,
        destination: destination.trim(),
        days: calcDays(),
        travel_style: style,
        content: itinerary,
        estimated_budget: 0,
        currency: 'INR',
      }]);

    if (saveError) {
      setError('Could not save to database. Please try again.');
    } else {
      setSavedMsg(true);
    }
    setIsSaving(false);
  };

  const selectedStyleOption = STYLE_OPTIONS.find(s => s.value === style);

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-700 to-accent-600 p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xs font-bold">
            AI
          </div>
          <p className="text-sm font-semibold text-white/80 uppercase tracking-widest">
            SafarAI Trip Planner
          </p>
        </div>
        <h1 className="text-3xl font-bold">Plan Your Perfect Trip</h1>
        <p className="mt-2 text-white/80">
          AI-powered itineraries tailored to your style — any destination, any duration.
        </p>
      </div>

      {/* Input Form */}
      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-panel">
        <h2 className="text-lg font-bold text-ink mb-5">Trip Details</h2>

        <div className="grid gap-5">

          {/* Row 1: Destination */}
          <div className="relative">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">
              📍 Destination
            </label>
            <input
              type="text"
              placeholder="Where do you want to go? e.g. Goa, Tokyo, Paris"
              value={destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              onKeyDown={(e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setActiveSuggestion(prev =>
      prev < suggestions.length - 1 ? prev + 1 : prev
    );
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setActiveSuggestion(prev => prev > 0 ? prev - 1 : 0);
  } else if (e.key === 'Enter') {
    if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
      handleSuggestionClick(suggestions[activeSuggestion]);
      setActiveSuggestion(-1);
    } else {
      handleGenerate();
    }
  } else if (e.key === 'Escape') {
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  }
}}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              autoComplete="off"
              className="w-full rounded-xl border-2 border-brand-100 bg-white px-4 py-3 text-sm text-ink placeholder-slate-300 outline-none focus:border-brand-400 transition"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-brand-100 rounded-xl shadow-xl overflow-hidden">
                {suggestions.map((city, index) => (
  <button
    key={index}
    type="button"
    onMouseDown={() => handleSuggestionClick(city)}
    onMouseEnter={() => setActiveSuggestion(index)}
    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between border-b border-slate-50 last:border-0 transition ${
      activeSuggestion === index
        ? 'bg-brand-50 border-l-2 border-brand-500'
        : 'hover:bg-brand-50'
    }`}
  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">📍</span>
                      <span className="font-semibold text-ink">
                        {city.display_name || city.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      India
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Row 2: Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                📅 Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border-2 border-brand-100 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand-400 transition cursor-pointer"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                📅 End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border-2 border-brand-100 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand-400 transition cursor-pointer"
              />
            </div>
          </div>

          {/* Duration pill */}
          {calcDays() > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 px-4 py-1.5 text-xs font-semibold text-brand-700">
                🗓️ {calcDays()} Day{calcDays() !== 1 ? 's' : ''} Trip
              </span>
              <span className="text-xs text-slate-400">
                {formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}
              </span>
            </div>
          )}

          {startDate && endDate && calcDays() <= 0 && (
            <p className="text-xs font-semibold text-red-500">
              ⚠️ End date must be on or after the start date.
            </p>
          )}

          {/* Row 3: Travel Style */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">
              🎯 Travel Style
            </label>
            <div className="grid grid-cols-5 gap-2">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStyle(opt.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition ${
                    style === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-100 bg-white text-slate-500 hover:border-brand-200 hover:bg-brand-50'
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {error && (
          <p className="mt-4 text-xs font-semibold text-red-500">⚠️ {error}</p>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!destination.trim() || calcDays() <= 0 || isGenerating}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-6 py-3.5 text-sm font-bold text-white shadow-float hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition"
        >
          {isGenerating
            ? '✨ Generating your perfect itinerary...'
            : `Generate ${calcDays() > 0 ? `${calcDays()}-Day ` : ''}${selectedStyleOption?.icon} ${selectedStyleOption?.label} Itinerary`}
        </button>
      </section>

      {/* Loading State */}
      {isGenerating && (
        <div className="rounded-2xl border border-brand-100 bg-white p-10 text-center shadow-panel">
          <p className="text-4xl animate-bounce">✈️</p>
          <p className="mt-4 text-base font-bold text-brand-700">
            Planning your trip to {destination}...
          </p>
          <p className="mt-1 text-sm text-slate-400">
            SafarAI is crafting a personalised {selectedStyleOption?.label} itinerary for you
          </p>
          <div className="mt-4 flex justify-center gap-1">
            <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{animationDelay: '0ms'}}></span>
            <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{animationDelay: '150ms'}}></span>
            <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{animationDelay: '300ms'}}></span>
          </div>
        </div>
      )}

      {/* Itinerary Results */}
      {itinerary && !isGenerating && (
        <section className="space-y-4">

          {/* Trip Summary Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-brand-700 to-accent-600 p-6 text-white">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                  Your Itinerary
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  {destination.trim()} {selectedStyleOption?.icon}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                    📅 {formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                    🗓️ {calcDays()} Days
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                    {selectedStyleOption?.icon} {selectedStyleOption?.label}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveTrip}
                  disabled={savedMsg || isSaving}
                  className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-brand-700 hover:bg-brand-50 disabled:opacity-70 transition"
                >
                  {isSaving ? 'Saving...' : savedMsg ? '✓ Saved!' : '💾 Save Trip'}
                </button>
                <button
                  type="button"
                  onClick={() => { setItinerary(null); setSavedMsg(false); setError(''); }}
                  className="rounded-xl bg-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/30 transition"
                >
                  ✕ Clear
                </button>
              </div>
            </div>
          </div>

          {/* Itinerary Content */}
          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-panel">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <div className="mt-8 first:mt-0">
                    <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-2 text-sm font-bold text-white mb-4">
                      {children}
                    </div>
                  </div>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-4 text-base font-bold text-ink">{children}</h3>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-brand-700">{children}</strong>
                ),
                p: ({ children }) => (
                  <p className="mb-3 text-sm leading-relaxed text-slate-600 pl-2 border-l-2 border-brand-100">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="ml-4 mb-3 list-disc space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="ml-4 mb-3 list-decimal space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-slate-600">{children}</li>
                ),
              }}
            >
              {itinerary}
            </ReactMarkdown>
          </div>

          {!savedMsg && (
            <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-center">
              <p className="text-xs text-brand-700 font-semibold">
                💡 Log in to save this itinerary to your account and access it anytime
              </p>
            </div>
          )}

        </section>
      )}

      {/* Empty State */}
      {!itinerary && !isGenerating && (
        <div className="rounded-2xl border-2 border-dashed border-brand-100 bg-white p-12 text-center">
          <p className="text-5xl mb-4">🗺️</p>
          <h3 className="text-base font-bold text-ink mb-2">Ready to plan your trip?</h3>
          <p className="text-sm text-slate-400">
            Enter a destination, pick your dates and travel style above — SafarAI will create a personalised day-by-day itinerary for you.
          </p>
        </div>
      )}

    </div>
  );
}

export default TripPlanner;