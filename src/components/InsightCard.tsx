import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Insight } from "@/lib/insights-data";

interface InsightCardProps {
  insight: Insight;
  onClick?: () => void;
}

export const InsightCard = ({ insight, onClick }: InsightCardProps) => {
  const sentimentConfig = {
    positive: { icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-400/10', label: 'Положительно' },
    negative: { icon: TrendingDown, color: 'text-red-400', bgColor: 'bg-red-400/10', label: 'Негативно' },
    neutral: { icon: Minus, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', label: 'Нейтрально' }
  };

  const config = sentimentConfig[insight.sentiment];
  const SentimentIcon = config.icon;

  return (
    <Card 
      className="p-6 shadow-elegant hover:glow-card transition-all border-accent/10 hover:border-accent/30 animate-fade-in cursor-pointer"
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="border-accent/50">{insight.category}</Badge>
              <span className="text-xs text-muted-foreground">{insight.source}</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{insight.title}</h3>
            <p className="text-xs text-muted-foreground">{insight.date}</p>
          </div>
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <SentimentIcon className={`h-5 w-5 ${config.color}`} />
          </div>
        </div>

        <div className="space-y-3 border-l-2 border-accent pl-4">
          <div>
            <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
              <SentimentIcon className={`h-4 w-4 ${config.color}`} />
              Влияние на рынок
            </h4>
            <p className="text-sm text-muted-foreground">{insight.impact}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Рекомендация</h4>
            <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
