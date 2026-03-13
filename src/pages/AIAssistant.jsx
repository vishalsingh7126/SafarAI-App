import usePageMeta from '../hooks/usePageMeta';
import TravelAssistantChat from '../components/TravelAssistantChat';

function AIAssistant() {
  usePageMeta(
    'AI Travel Assistant | SafarAI',
    'Ask anything about destinations, trips, budgets, or travel advice.'
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">AI Travel Assistant</h1>
        <p className="mt-2 text-slate-600">
          Ask anything about destinations, trips, budgets, or travel advice.
        </p>
      </div>

      <div className="mx-auto max-w-4xl">
        <TravelAssistantChat mode="page" />
      </div>
    </div>
  );
}

export default AIAssistant;
