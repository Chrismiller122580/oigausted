import { JOIN_FAQ_CATEGORIES } from '@/lib/public-site';

export interface FaqAccordionItem {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
}

interface FaqAccordionProps {
  items: FaqAccordionItem[];
  groupByCategory?: boolean;
}

export function FaqAccordion({ items, groupByCategory = true }: FaqAccordionProps) {
  if (!groupByCategory) {
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <FaqDetails key={item.id} item={item} />
        ))}
      </div>
    );
  }

  const grouped = items.reduce<Record<string, FaqAccordionItem[]>>((acc, item) => {
    const key = item.category || 'general';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const categoryOrder = ['join', 'buyer', 'seller', 'payments', 'account', 'general'];
  const sortedKeys = [
    ...categoryOrder.filter((k) => grouped[k]?.length),
    ...Object.keys(grouped).filter((k) => !categoryOrder.includes(k)),
  ];

  return (
    <div className="space-y-10">
      {sortedKeys.map((categoryKey) => (
        <section key={categoryKey}>
          <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
            {JOIN_FAQ_CATEGORIES[categoryKey] || categoryKey}
          </h2>
          <div className="space-y-3">
            {grouped[categoryKey].map((item) => (
              <FaqDetails key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FaqDetails({ item }: { item: FaqAccordionItem }) {
  return (
    <details className="group rounded-2xl border border-border bg-card px-5 py-4 open:shadow-sm">
      <summary className="cursor-pointer list-none font-medium text-zinc-900 dark:text-white marker:content-none flex items-start justify-between gap-4">
        <span>{item.question}</span>
        <span
          aria-hidden="true"
          className="text-orange-600 transition-transform group-open:rotate-45 text-xl leading-none"
        >
          +
        </span>
      </summary>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
        {item.answer}
      </p>
    </details>
  );
}