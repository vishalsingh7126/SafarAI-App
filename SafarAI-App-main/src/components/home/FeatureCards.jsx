import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import Tabs from '../ui/Tabs';
import { SectionHeader, Reveal } from '../ui/Section';
import { modules, moduleCategories } from '../../data/modules';

export default function FeatureCards() {
  const [category, setCategory] = useState('All');

  const filtered = useMemo(
    () => (category === 'All' ? modules : modules.filter((module) => module.category === category)),
    [category]
  );

  const tabs = moduleCategories.map((item) => ({
    value: item,
    label: item,
    count: item === 'All' ? modules.length : modules.filter((module) => module.category === item).length,
  }));

  return (
    <section aria-labelledby="modules-heading" className="space-y-6">
      <SectionHeader
        eyebrow="Product"
        icon="layers"
        title="Every travel tool, one connected workspace"
        description="Nine modules that share the same data — plan in one, and the rest already know your trip."
        action={<Tabs tabs={tabs} value={category} onChange={setCategory} size="sm" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((module, index) => (
          <Reveal key={module.id} delay={(index % 3) * 60}>
            <Link
              to={module.route}
              className="halo group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-brand-400/10 blur-2xl transition-all duration-500 group-hover:bg-brand-400/25"
              />

              <div className="relative mb-4 flex items-center justify-between gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-float transition-transform duration-300 ease-spring group-hover:scale-110 group-hover:rotate-3">
                  <Icon name={module.icon} size="md" />
                </span>
                <span className="rounded-full border border-line bg-surface-muted px-2.5 py-1 text-2xs font-bold uppercase tracking-[0.16em] text-fg-subtle">
                  {module.category}
                </span>
              </div>

              <h3 className="relative text-base font-bold text-fg">{module.title}</h3>
              <p className="relative mt-2 text-sm leading-6 text-fg-muted">{module.description}</p>

              <div className="relative mt-3 grid grid-rows-[0fr] overflow-hidden transition-all duration-300 ease-smooth group-hover:grid-rows-[1fr]">
                <p className="overflow-hidden text-xs leading-5 text-fg-subtle">{module.detail}</p>
              </div>

              <span className="relative mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-brand-600 dark:text-brand-300">
                Open module
                <Icon
                  name="arrowRight"
                  size="sm"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
