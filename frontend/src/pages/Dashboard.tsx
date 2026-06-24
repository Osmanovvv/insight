import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightCard } from "@/components/InsightCard";
import { InsightDetailModal } from "@/components/InsightDetailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Download, Bell, TrendingUp, TrendingDown, Minus, BarChart3, Activity, Loader2, Lock, Crown, CheckCircle } from "lucide-react";
import { getUser, isAuthenticated } from "@/lib/auth";
import { filterInsights, saveSubscription, getSubscription, Insight } from "@/lib/insights-data";
import { analysisApi, subscriptionApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Analysis, SubscriptionInfo } from "@/lib/types";

const PAGE_SIZE = 20;
const FREE_LIMIT = 10;

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

const SENTIMENT_API_MAP: Record<string, string> = {
  Позитив: "positive",
  Нейтрально: "neutral",
  Негатив: "negative",
};

const mapAnalysisItems = (data: Analysis[]): Insight[] =>
  data.map((item) => ({
    id: String(item.id),
    title: item.news?.title || "Без заголовка",
    source: item.news?.source || "Неизвестно",
    category: item.news?.category_name || "Прочее",
    sentiment:
      item.sentiment === "positive" || item.sentiment === "negative" || item.sentiment === "neutral"
        ? item.sentiment
        : "neutral",
    impact: item.impact === "high" ? "Высокое" : item.impact === "medium" ? "Среднее" : "Низкое",
    recommendation: item.summary || "",
    date: item.created_at,
    keywords: [],
    content: item.news?.content || "",
    detailedAnalysis: item.summary || "",
  }));

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(getUser());
  const [insights, setInsights] = useState<Insight[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [selectedSentiment, setSelectedSentiment] = useState("Все");
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const isPro = subscription?.plan === "Pro" && subscription?.is_active;

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setPage(0);
    try {
      const sentimentParam =
        selectedSentiment !== "Все" ? SENTIMENT_API_MAP[selectedSentiment] : undefined;
      const categoryParam = selectedCategory !== "Все" ? selectedCategory : undefined;

      const [data, countData] = await Promise.all([
        analysisApi.list({ skip: 0, limit: PAGE_SIZE, sentiment: sentimentParam, category: categoryParam }),
        analysisApi.count({ sentiment: sentimentParam }).catch(() => null),
      ]);

      setInsights(mapAnalysisItems(data));
      setTotal(countData?.total ?? data.length);
    } catch (err) {
      console.error("Failed to fetch insights", err);
      toast({ title: "Ошибка", description: "Не удалось загрузить данные из API", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedSentiment, selectedCategory, toast]);

  const loadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const sentimentParam =
        selectedSentiment !== "Все" ? SENTIMENT_API_MAP[selectedSentiment] : undefined;
      const categoryParam = selectedCategory !== "Все" ? selectedCategory : undefined;
      const data = await analysisApi.list({ skip: nextPage * PAGE_SIZE, limit: PAGE_SIZE, sentiment: sentimentParam, category: categoryParam });
      setInsights(prev => [...prev, ...mapAnalysisItems(data)]);
      setPage(nextPage);
    } catch {
      toast({ title: "Ошибка", description: "Не удалось загрузить следующую страницу", variant: "destructive" });
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setUser(getUser());
    if (getSubscription()) setEmailNotifications(true);
    subscriptionApi.mySubscription().then(setSubscription).catch(() => {});
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleRefresh = () => {
    fetchInsights();
    toast({ title: "Обновление инсайтов", description: "Запрашиваем свежие данные с сервера..." });
  };

  const handleInsightClick = (insight: Insight) => {
    setSelectedInsight(insight);
    setDetailModalOpen(true);
  };

  const handleExportPDF = async () => {
    if (!isPro) {
      setUpsellOpen(true);
      return;
    }
    // Оверлей без показа пользователю: в viewport для отрисовки, но невидим (opacity: 0)
    const wrapper = document.createElement("div");
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.style.cssText = [
      "position: fixed; inset: 0; z-index: 99999;",
      "background: #fff; overflow: auto;",
      "display: flex; justify-content: center; padding: 24px;",
      "opacity: 0; pointer-events: none;",
    ].join(" ");

    const content = document.createElement("div");
    content.style.cssText = [
      "font-family: Arial, Helvetica, sans-serif;",
      "padding: 20px; font-size: 14px; line-height: 1.5; color: #1a1a1a;",
      "width: 210mm; min-height: 297mm; box-sizing: border-box; background: #fff;",
    ].join(" ");
    content.innerHTML = `
      <h1 style="font-size: 18px; margin-bottom: 8px;">Отчёт по инсайтам — Insight</h1>
      <p style="font-size: 12px; color: #666; margin-bottom: 20px;">Дата: ${new Date().toLocaleDateString("ru-RU")}</p>
      ${filteredInsights.length === 0 ? "<p>Нет инсайтов для отображения.</p>" : ""}
      ${filteredInsights
        .map(
          (i) => `
        <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; margin-bottom: 4px;">${escapeHtml(i.title)}</div>
          <div style="font-size: 12px; color: #555; margin-bottom: 4px;">${escapeHtml(i.category)} | ${escapeHtml(i.source)}</div>
          <div style="font-size: 12px; margin-bottom: 4px;">Влияние: ${escapeHtml(i.impact)}</div>
          <div style="font-size: 13px;">${escapeHtml(i.recommendation || "")}</div>
        </div>
      `
        )
        .join("")}
    `;

    wrapper.appendChild(content);
    document.body.appendChild(wrapper);

    try {
      const { default: html2pdf } = await import("html2pdf.js");
      await new Promise<void>((r) => setTimeout(r, 300));
      await html2pdf()
        .set({
          margin: 15,
          filename: `insight-report-${new Date().toISOString().split("T")[0]}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(content)
        .save();
      toast({ title: "Экспорт завершён", description: "Инсайты сохранены в PDF" });
    } finally {
      document.body.removeChild(wrapper);
    }
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    await new Promise(r => setTimeout(r, 2000));
    try {
      await subscriptionApi.subscribePro();
      const newSub = await subscriptionApi.mySubscription();
      setSubscription(newSub);
      toast({ title: "Подписка активирована!", description: "Добро пожаловать в Pro!" });
      setUpsellOpen(false);
    } catch {
      toast({ title: "Ошибка", description: "Не удалось оформить подписку", variant: "destructive" });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleNotificationToggle = (checked: boolean) => {
    setEmailNotifications(checked);
    if (checked && user) {
      saveSubscription(user.email);
      toast({ title: "Подписка активирована", description: "Вы подписаны на рассылку инсайтов" });
    } else {
      toast({ title: "Подписка отключена", description: "Рассылка инсайтов отключена" });
    }
  };

  const sentimentMap: Record<string, "positive" | "neutral" | "negative"> = {
    Позитив: "positive",
    Нейтрально: "neutral",
    Негатив: "negative",
  };

  const filteredInsights = filterInsights(
    insights,
    selectedCategory === "Все" ? undefined : selectedCategory,
    undefined,
    selectedSentiment === "Все" ? undefined : sentimentMap[selectedSentiment],
    undefined
  );

  const positiveCount = insights.filter(i => i.sentiment === "positive").length;
  const negativeCount = insights.filter(i => i.sentiment === "negative").length;
  const neutralCount = insights.filter(i => i.sentiment === "neutral").length;
  const totalLoaded = insights.length;
  const positivePercent = totalLoaded ? Math.round((positiveCount / totalLoaded) * 100) : 0;
  const negativePercent = totalLoaded ? Math.round((negativeCount / totalLoaded) * 100) : 0;
  const neutralPercent = 100 - positivePercent - negativePercent;

  const hasMore = isPro && insights.length < total;
  const freeLimitReached = !isPro && insights.length >= FREE_LIMIT;

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Добро пожаловать, {user.first_name || user.username}!</h1>
              <p className="text-muted-foreground">Ваш персональный центр аналитики и инсайтов</p>
            </div>
            {isPro && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-accent/50 bg-accent/10">
                <Crown className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-accent">Pro</span>
              </div>
            )}
          </div>

          <Tabs defaultValue="insights" className="space-y-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="insights">Инсайты</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-6 shadow-elegant border-accent/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Всего инсайтов</p>
                    <BarChart3 className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-3xl font-bold">{total}</p>
                  {insights.length < total && (
                    <p className="text-xs text-muted-foreground mt-1">Загружено: {insights.length}</p>
                  )}
                </Card>

                <Card className="p-6 shadow-elegant border-accent/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Тональность (загружено)</p>
                    <Activity className="h-4 w-4 text-accent" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-400">Позитив</span>
                      <span className="font-semibold">{positivePercent}% ({positiveCount})</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-400">Нейтрально</span>
                      <span className="font-semibold">{neutralPercent}% ({neutralCount})</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-400">Негатив</span>
                      <span className="font-semibold">{negativePercent}% ({negativeCount})</span>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6 shadow-elegant border-accent/20">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Категория</Label>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {["Все", "Экономика", "Политика", "Технологии", "Криптовалюты", "Энергетика", "Финансы", "Промышленность", "Здравоохранение"].map(cat => (
                          <Button
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(cat)}
                            className={selectedCategory === cat ? "bg-accent text-accent-foreground" : ""}
                          >
                            {cat}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Тональность</Label>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {["Все", "Позитив", "Нейтрально", "Негатив"].map(sent => (
                          <Button
                            key={sent}
                            variant={selectedSentiment === sent ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedSentiment(sent)}
                            className={selectedSentiment === sent ? "bg-accent text-accent-foreground" : ""}
                          >
                            {sent === "Позитив" && <TrendingUp className="mr-1 h-3 w-3" />}
                            {sent === "Негатив" && <TrendingDown className="mr-1 h-3 w-3" />}
                            {sent === "Нейтрально" && <Minus className="mr-1 h-3 w-3" />}
                            {sent}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleRefresh} variant="outline" className="border-accent/50">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Обновить инсайты
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      variant="outline"
                      className={isPro ? "border-accent/50" : "border-muted/50 opacity-80"}
                    >
                      {isPro ? (
                        <Download className="mr-2 h-4 w-4" />
                      ) : (
                        <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                      )}
                      Скачать PDF
                      {!isPro && <span className="ml-2 text-xs text-muted-foreground">Pro</span>}
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">
                  Лента инсайтов
                  <span className="text-muted-foreground text-lg ml-2">
                    ({filteredInsights.length} из {total})
                  </span>
                </h2>

                {isLoading ? (
                  <div className="grid gap-6">
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-6 w-full" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-12 w-12 rounded-lg" />
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : filteredInsights.length === 0 ? (
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground">
                      Нет инсайтов по выбранным фильтрам. Попробуйте изменить настройки.
                    </p>
                  </Card>
                ) : (
                  <>
                    <div className="grid gap-6">
                      {filteredInsights.map(insight => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onClick={() => handleInsightClick(insight)}
                        />
                      ))}
                    </div>

                    {(hasMore || freeLimitReached) && (
                      <div className="flex justify-center pt-4">
                        {hasMore ? (
                          <Button
                            variant="outline"
                            className="border-accent/50 min-w-[180px]"
                            onClick={loadMore}
                            disabled={isLoadingMore}
                          >
                            {isLoadingMore ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Загрузка...
                              </>
                            ) : (
                              `Загрузить ещё (осталось ${total - insights.length})`
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="min-w-[240px] border-amber-500/50 text-amber-600 dark:text-amber-400 opacity-90"
                            disabled
                            onClick={() => setUpsellOpen(true)}
                          >
                            <Lock className="mr-2 h-4 w-4" />
                            До 10 инсайтов в день. Купить Pro для загрузки ещё
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="p-6 shadow-elegant border-accent/20">
                <h2 className="text-2xl font-bold mb-6">Настройки уведомлений</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={handleNotificationToggle}
                    />
                    <label
                      htmlFor="email-notifications"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                    >
                      <Bell className="h-4 w-4" />
                      Присылать инсайты на email
                    </label>
                  </div>
                  {emailNotifications && (
                    <div className="ml-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                      <p className="text-sm text-muted-foreground">
                        Email: <span className="text-foreground font-medium">{user.email}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Вы будете получать ежедневную сводку инсайтов
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6 shadow-elegant border-accent/20">
                <h2 className="text-2xl font-bold mb-4">Информация об аккаунте</h2>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Имя:</span> {user.first_name || user.username}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {user.email}</p>
                  <p className="text-sm">
                    <span className="font-medium">Тариф:</span>{" "}
                    <span className={isPro ? "text-accent font-semibold" : ""}>
                      {subscription?.plan || "Free"}
                    </span>
                  </p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      <InsightDetailModal
        insight={selectedInsight}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />

      {/* Upsell modal */}
      <Dialog open={upsellOpen} onOpenChange={setUpsellOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" />
              Функция доступна в Pro
            </DialogTitle>
            <DialogDescription>
              Экспорт в PDF доступен только пользователям с подпиской Pro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-lg border border-accent/30 bg-accent/5">
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold">2 500</span>
                <span className="text-muted-foreground">₽/мес</span>
              </div>
              <ul className="space-y-2">
                {[
                  "Безлимитные инсайты",
                  "Расширенный AI-анализ",
                  "Push + Email уведомления",
                  "До 20 компаний",
                  "Архив за 90 дней",
                  "Экспорт в PDF",
                  "Приоритетная поддержка",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => { setUpsellOpen(false); navigate("/pricing"); }}
            >
              Перейти к оплате
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
