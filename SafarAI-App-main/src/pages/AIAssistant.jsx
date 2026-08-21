import { useSearchParams } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import TravelAssistantChat from '../components/TravelAssistantChat';
import Card from '../components/ui/Card';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { PageHeader } from '../components/ui/Section';
import { useAssistant } from '../context/AssistantContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { aiStatus } from '../services/aiService';

const CAPABILITIES = [
  { icon: 'sparkles', title: 'Itineraries', body: 'Day-by-day plans for any Indian destination and trip length.' },
  { icon: 'wallet', title: 'Budgets', body: 'Season-aware cost breakdowns you can sanity-check instantly.' },
  { icon: 'shield', title: 'Safety', body: 'Risk notes, emergency numbers and solo-travel guidance.' },
  { icon: 'train', title: 'Transport', body: 'Rail, road and flight trade-offs with realistic timings.' },
];

const STARTERS = [
  'Plan a 6-day Kerala trip for two under ₹60,000',
  'Compare Manali and Rishikesh for a long weekend',
  'What should I eat in Old Delhi in one evening?',
  'Is Leh Ladakh doable in September with kids?',
];

function AIAssistant() {
  usePageMeta(
    'AI Travel Assistant | SafarAI',
    'Ask anything about destinations, trips, budgets, or travel advice.'
  );

  const [searchParams] = useSearchParams();
  const initialQuestion = searchParams.get('q') || undefined;
  const { send, reset, messages } = useAssistant();
  const { preferences, recent, trips } = useWorkspace();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI assistant"
        icon="bot"
        title="Your travel co-pilot"
        description="Ask in plain language. SafarAI answers with structured, practical plans grounded in the same data the rest of the product uses."
        actions={
          <>
            <Button variant="secondary" leadingIcon="refresh" onClick={reset} disabled={messages.length <= 1}>
              New chat
            </Button>
            <Button to="/trip-planner" leadingIcon="sparkles">
              Open planner
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <TravelAssistantChat mode="page" initialQuestion={initialQuestion} />

        <aside className="space-y-4">
          <Card padding="lg">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-fg">Assistant status</h2>
              <Badge tone={aiStatus.configured ? 'success' : 'warning'} dot>
                {aiStatus.configured ? 'Live model' : 'Offline mode'}
              </Badge>
            </div>
            <p className="mt-2 text-xs leading-5 text-fg-muted">
              {aiStatus.configured
                ? `Connected to ${aiStatus.model} via Groq for low-latency responses.`
                : 'No API key configured, so answers are generated from SafarAI’s built-in destination, stay and food datasets.'}
            </p>
          </Card>

          <Card padding="lg">
            <h2 className="text-sm font-bold text-fg">Try asking</h2>
            <div className="mt-3 space-y-2">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => send(starter)}
                  className="group flex w-full items-start gap-2 rounded-xl border border-line bg-surface-muted px-3 py-2.5 text-left text-xs leading-5 text-fg-muted transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-fg"
                >
                  <Icon name="arrowUpRight" size="xs" className="mt-0.5 shrink-0 text-brand-500" />
                  {starter}
                </button>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="text-sm font-bold text-fg">What it can do</h2>
            <ul className="mt-3 space-y-3">
              {CAPABILITIES.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-300">
                    <Icon name={item.icon} size="sm" />
                  </span>
                  <span>
                    <span className="block text-xs font-bold text-fg">{item.title}</span>
                    <span className="block text-2xs leading-5 text-fg-muted">{item.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="lg" tone="muted">
            <h2 className="text-sm font-bold text-fg">Your context</h2>
            <p className="mt-1 text-2xs text-fg-subtle">Shared with the assistant to personalise answers.</p>
            <ul className="mt-3 space-y-2 text-xs text-fg-muted">
              <li className="flex items-center gap-2">
                <Icon name="mapPin" size="xs" className="text-brand-500" /> Home city: {preferences.homeCity}
              </li>
              <li className="flex items-center gap-2">
                <Icon name="target" size="xs" className="text-brand-500" /> Style: {preferences.travelStyle}
              </li>
              <li className="flex items-center gap-2">
                <Icon name="luggage" size="xs" className="text-brand-500" /> Saved trips: {trips.length}
              </li>
              <li className="flex items-center gap-2">
                <Icon name="history" size="xs" className="text-brand-500" /> Recently viewed: {recent.length}
              </li>
            </ul>
            <Button to="/profile" size="sm" variant="secondary" className="mt-4" trailingIcon="arrowRight">
              Manage preferences
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default AIAssistant;
