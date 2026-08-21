import { Switch, Select, RangeSlider, Field } from './ui/Input';
import Icon from './ui/Icon';
import { formatINR } from '../lib/format';

/**
 * TripPreferences (formerly SearchPanel) — the controlled preference block
 * used inside the Trip Planner. Every original control is preserved
 * (travellers, trip type, budget, travel preference toggles); it is now a
 * controlled component so the planner can factor preferences into the
 * generated plan and the live budget estimate.
 */

export const TRIP_TYPES = ['Adventure', 'Relaxation', 'Cultural', 'Budget', 'Luxury'];

export const PREFERENCE_FIELDS = [
  { key: 'safetyPriority', label: 'Safety priority', description: 'Well-lit areas, verified stays' },
  { key: 'foodExploration', label: 'Food exploration', description: 'Street food and local classics' },
  { key: 'localCulture', label: 'Local culture', description: 'Heritage, crafts, performances' },
  { key: 'fastTransport', label: 'Fast transport', description: 'Prefer flights and express trains' },
  { key: 'budgetFriendly', label: 'Budget friendly', description: 'Optimise for value over comfort' },
];

export const defaultPreferences = {
  travelers: '2',
  tripType: 'Cultural',
  budget: 45000,
  safetyPriority: true,
  foodExploration: true,
  localCulture: true,
  fastTransport: false,
  budgetFriendly: true,
};

export function selectedPreferenceLabels(values) {
  return PREFERENCE_FIELDS.filter((field) => values[field.key]).map((field) => field.label);
}

export default function TripPreferences({ values, onChange }) {
  const set = (patch) => onChange({ ...values, ...patch });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Travellers" htmlFor="pref-travelers">
          <Select
            id="pref-travelers"
            icon="users"
            value={values.travelers}
            onChange={(event) => set({ travelers: event.target.value })}
          >
            {Array.from({ length: 10 }, (_, index) => String(index + 1)).map((value) => (
              <option key={value} value={value}>
                {value} {value === '1' ? 'traveller' : 'travellers'}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Trip type" htmlFor="pref-type">
          <Select
            id="pref-type"
            icon="target"
            value={values.tripType}
            onChange={(event) => set({ tripType: event.target.value })}
          >
            {TRIP_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        <div className="sm:pt-1">
          <RangeSlider
            id="pref-budget"
            label="Budget cap"
            min={10000}
            max={200000}
            step={5000}
            value={values.budget}
            onChange={(budget) => set({ budget })}
            format={(value) => formatINR(value, { compact: true })}
          />
        </div>
      </div>

      <div>
        <p className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-fg-subtle">
          <Icon name="sparkles" size="xs" className="text-brand-500" />
          Travel preferences
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {PREFERENCE_FIELDS.map((field) => (
            <Switch
              key={field.key}
              id={`pref-${field.key}`}
              label={field.label}
              description={field.description}
              checked={Boolean(values[field.key])}
              onChange={(next) => set({ [field.key]: next })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
