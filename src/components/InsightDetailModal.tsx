import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Insight } from "@/lib/insights-data";
import { TrendingUp, TrendingDown, Minus, Share2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InsightDetailModalProps {
  insight: Insight | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InsightDetailModal = ({ insight, open, onOpenChange }: InsightDetailModalProps) => {
  const { toast } = useToast();

  if (!insight) return null;

  const sentimentConfig = {
    positive: { icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-400/10', label: 'Положительно' },
    negative: { icon: TrendingDown, color: 'text-red-400', bgColor: 'bg-red-400/10', label: 'Негативно' },
    neutral: { icon: Minus, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', label: 'Нейтрально' }
  };

  const config = sentimentConfig[insight.sentiment];
  const SentimentIcon = config.icon;

  const shareText = encodeURIComponent(`${insight.title} - Insight`);
  const shareUrl = encodeURIComponent(window.location.href);

  const handleShare = (platform: 'twitter' | 'telegram' | 'linkedin') => {
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        break;
    }
    window.open(url, '_blank', 'width=600,height=400');
    toast({
      title: "Открыто окно шаринга",
      description: `Делимся в ${platform}`
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl pr-8">{insight.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="border-accent/50">{insight.category}</Badge>
            <span className="text-sm text-muted-foreground">{insight.source}</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{insight.date}</span>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor}`}>
              <SentimentIcon className={`h-4 w-4 ${config.color}`} />
              <span className={`text-sm ${config.color}`}>{config.label}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">📰 Содержание новости</h3>
              <p className="text-muted-foreground leading-relaxed">{insight.content}</p>
            </div>

            <div className="border-l-4 border-accent pl-6 space-y-4 bg-accent/5 py-4 rounded-r-lg">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <SentimentIcon className={`h-5 w-5 ${config.color}`} />
                  Влияние на рынок
                </h3>
                <p className="text-muted-foreground">{insight.impact}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">💡 Краткая рекомендация</h3>
                <p className="text-muted-foreground">{insight.recommendation}</p>
              </div>
            </div>

            <div className="border-2 border-primary/20 rounded-lg p-6 bg-gradient-to-br from-primary/5 to-accent/5">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                🤖 AI-анализ и стратегия
              </h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{insight.detailedAnalysis}</p>
            </div>

            {insight.keywords.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">🔖 Ключевые слова</h3>
                <div className="flex gap-2 flex-wrap">
                  {insight.keywords.map((keyword, i) => (
                    <Badge key={i} variant="secondary" className="bg-accent/20">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="border-accent/50"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('telegram')}
              className="border-accent/50"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Telegram
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('linkedin')}
              className="border-accent/50"
            >
              <Share2 className="mr-2 h-4 w-4" />
              LinkedIn
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
