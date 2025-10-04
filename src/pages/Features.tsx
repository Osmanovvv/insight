import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Sparkles, TrendingUp, Bell, Search, FileText, Filter, BarChart3, Zap } from "lucide-react";
import newsAggregationImg from "@/assets/news-aggregation.jpg";
import aiAnalysisImg from "@/assets/ai-analysis.jpg";

const Features = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-32 pb-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-5xl font-bold">
              Функционал <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">Insight</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Полный набор инструментов для анализа новостей и принятия инвестиционных решений
            </p>
          </div>

          <div className="space-y-24">
            {/* Step 1 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                  <span className="text-accent font-semibold">Шаг 1</span>
                </div>
                <h2 className="text-4xl font-bold">Сбор новостей</h2>
                <p className="text-lg text-muted-foreground">
                  Автоматический мониторинг тысяч источников: финансовые издания, корпоративные релизы, 
                  социальные сети и специализированные ресурсы.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 border-accent/10">
                    <Search className="h-8 w-8 text-accent mb-3" />
                    <h3 className="font-semibold mb-2">Умный поиск</h3>
                    <p className="text-sm text-muted-foreground">Фильтрация по компаниям, отраслям, регионам</p>
                  </Card>
                  <Card className="p-6 border-accent/10">
                    <Filter className="h-8 w-8 text-accent mb-3" />
                    <h3 className="font-semibold mb-2">Персонализация</h3>
                    <p className="text-sm text-muted-foreground">Настройка источников под ваши интересы</p>
                  </Card>
                </div>
              </div>
              <div className="relative h-96 rounded-2xl overflow-hidden border border-accent/20">
                <img 
                  src={newsAggregationImg} 
                  alt="News Aggregation Dashboard" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 relative h-96 rounded-2xl overflow-hidden border border-accent/20">
                <img 
                  src={aiAnalysisImg} 
                  alt="AI Analysis Interface" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="order-1 lg:order-2 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                  <span className="text-accent font-semibold">Шаг 2</span>
                </div>
                <h2 className="text-4xl font-bold">AI-анализ</h2>
                <p className="text-lg text-muted-foreground">
                  Глубокий анализ с использованием передовых языковых моделей. Выделение ключевых фактов, 
                  оценка тональности и прогнозирование влияния на рынки.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 border-accent/10">
                    <Sparkles className="h-8 w-8 text-accent mb-3" />
                    <h3 className="font-semibold mb-2">NLP-технологии</h3>
                    <p className="text-sm text-muted-foreground">Понимание контекста и нюансов</p>
                  </Card>
                  <Card className="p-6 border-accent/10">
                    <TrendingUp className="h-8 w-8 text-accent mb-3" />
                    <h3 className="font-semibold mb-2">Прогнозы</h3>
                    <p className="text-sm text-muted-foreground">Оценка влияния на котировки</p>
                  </Card>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                  <span className="text-accent font-semibold">Шаг 3</span>
                </div>
                <h2 className="text-4xl font-bold">Инсайты и уведомления</h2>
                <p className="text-lg text-muted-foreground">
                  Структурированные инсайты с рекомендациями, оповещения о важных событиях 
                  и экспорт отчётов в удобном формате.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 border-accent/10">
                    <Bell className="h-8 w-8 text-accent mb-3" />
                    <h3 className="font-semibold mb-2">Мгновенные алерты</h3>
                    <p className="text-sm text-muted-foreground">Email и push-уведомления</p>
                  </Card>
                  <Card className="p-6 border-accent/10">
                    <FileText className="h-8 w-8 text-accent mb-3" />
                    <h3 className="font-semibold mb-2">PDF-отчёты</h3>
                    <p className="text-sm text-muted-foreground">Экспорт аналитики</p>
                  </Card>
                </div>
              </div>
              <div className="relative h-96 rounded-2xl gradient-subtle opacity-20" />
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-center mb-12">Дополнительные возможности</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 border-accent/10 hover:glow-card transition-all">
                <BarChart3 className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-3">Визуализация данных</h3>
                <p className="text-muted-foreground">
                  Интерактивные графики и дашборды для отслеживания трендов
                </p>
              </Card>

              <Card className="p-8 border-accent/10 hover:glow-card transition-all">
                <Zap className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-3">Реал-тайм обновления</h3>
                <p className="text-muted-foreground">
                  Моментальная обработка новостей сразу после публикации
                </p>
              </Card>

              <Card className="p-8 border-accent/10 hover:glow-card transition-all">
                <Filter className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-3">Умные фильтры</h3>
                <p className="text-muted-foreground">
                  Настраиваемые правила для отсеивания шума и фокуса на важном
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Features;
