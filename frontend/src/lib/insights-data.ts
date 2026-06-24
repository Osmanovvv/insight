// Mock-данные для инсайтов

export interface Insight {
  id: string;
  title: string;
  source: string;
  category: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  impact: string;
  recommendation: string;
  date: string;
  keywords: string[];
  content: string;
  detailedAnalysis: string;
}

export const mockInsights: Insight[] = [];

export const filterInsights = (
  insights: Insight[],
  category?: string,
  keywords?: string[],
  sentiment?: 'positive' | 'neutral' | 'negative',
  dateRange?: string
): Insight[] => {
  let filtered = [...insights];

  if (category && category !== 'Все') {
    filtered = filtered.filter(insight => insight.category === category);
  }

  if (keywords && keywords.length > 0) {
    filtered = filtered.filter(insight =>
      keywords.some(keyword =>
        insight.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase())) ||
        insight.title.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  if (sentiment) {
    filtered = filtered.filter(insight => insight.sentiment === sentiment);
  }

  if (dateRange && dateRange !== 'Все') {
    const now = new Date();
    const insightDate = new Date(insights[0].date); // Используем как базу

    if (dateRange === 'День') {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter(insight => new Date(insight.date) >= oneDayAgo);
    } else if (dateRange === 'Неделя') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(insight => new Date(insight.date) >= oneWeekAgo);
    } else if (dateRange === 'Месяц') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(insight => new Date(insight.date) >= oneMonthAgo);
    }
  }

  return filtered;
};

export const saveSubscription = (email: string) => {
  localStorage.setItem('insight_subscription', email);
};

export const getSubscription = (): string | null => {
  return localStorage.getItem('insight_subscription');
};

export const savePricingRequest = (email: string, plan: string) => {
  const requests = JSON.parse(localStorage.getItem('insight_pricing_requests') || '[]');
  requests.push({ email, plan, date: new Date().toISOString() });
  localStorage.setItem('insight_pricing_requests', JSON.stringify(requests));
};
