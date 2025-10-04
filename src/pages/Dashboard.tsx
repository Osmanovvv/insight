import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightCard } from "@/components/InsightCard";
import { InsightDetailModal } from "@/components/InsightDetailModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Download, Bell, Plus, X, TrendingUp, TrendingDown, Minus, BarChart3, Activity } from "lucide-react";
import { getUser, isAuthenticated } from "@/lib/auth";
import { mockInsights, filterInsights, saveSubscription, getSubscription, Insight } from "@/lib/insights-data";
import { getSources } from "@/lib/sources-data";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(getUser());
  const [insights, setInsights] = useState(mockInsights);
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [selectedSentiment, setSelectedSentiment] = useState("Все");
  const [selectedDateRange, setSelectedDateRange] = useState("Все");
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }
    setUser(getUser());
    const subscription = getSubscription();
    if (subscription) {
      setEmailNotifications(true);
    }
  }, [navigate]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      const shuffled = [...insights].sort(() => Math.random() - 0.5);
      setInsights(shuffled);
      setIsLoading(false);
      toast({
        title: "Инсайты обновлены",
        description: "Лента успешно обновлена"
      });
    }, 1000);
  };


  const handleInsightClick = (insight: Insight) => {
    setSelectedInsight(insight);
    setDetailModalOpen(true);
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim()) {
      setCustomKeywords([...customKeywords, keywordInput.trim().toLowerCase()]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setCustomKeywords(customKeywords.filter(k => k !== keyword));
  };

  const handleExportPDF = () => {
    const filteredInsights = filterInsights(insights, selectedCategory, customKeywords);
    const content = filteredInsights.map(insight => 
      `${insight.title}\n${insight.category} | ${insight.source}\n${insight.impact}\n${insight.recommendation}\n\n`
    ).join('---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insight-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    
    toast({
      title: "Экспорт завершён",
      description: "Инсайты сохранены в файл"
    });
  };

  const handleNotificationToggle = (checked: boolean) => {
    setEmailNotifications(checked);
    if (checked && user) {
      saveSubscription(user.email);
      toast({
        title: "Подписка активирована",
        description: "Вы подписаны на рассылку инсайтов"
      });
    } else {
      toast({
        title: "Подписка отключена",
        description: "Рассылка инсайтов отключена"
      });
    }
  };

  const sentimentMap: Record<string, 'positive' | 'neutral' | 'negative'> = {
    'Позитив': 'positive',
    'Нейтрально': 'neutral',
    'Негатив': 'negative'
  };

  const filteredInsights = filterInsights(
    insights,
    selectedCategory === "Все" ? undefined : selectedCategory,
    customKeywords.length > 0 ? customKeywords : undefined,
    selectedSentiment === "Все" ? undefined : sentimentMap[selectedSentiment],
    selectedDateRange === "Все" ? undefined : selectedDateRange
  );

  // Статистика
  const totalInsights = insights.length;
  const positivePercent = Math.round((insights.filter(i => i.sentiment === 'positive').length / totalInsights) * 100);
  const negativePercent = Math.round((insights.filter(i => i.sentiment === 'negative').length / totalInsights) * 100);
  const neutralPercent = 100 - positivePercent - negativePercent;
  
  const topCompanies = [
    { name: 'Apple', count: insights.filter(i => i.keywords.some(k => k.toLowerCase().includes('apple'))).length },
    { name: 'Tesla', count: insights.filter(i => i.keywords.some(k => k.toLowerCase().includes('tesla'))).length },
    { name: 'Microsoft', count: insights.filter(i => i.keywords.some(k => k.toLowerCase().includes('microsoft'))).length },
  ].sort((a, b) => b.count - a.count).slice(0, 3);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Добро пожаловать, {user.name}!</h1>
            <p className="text-muted-foreground">Ваш персональный центр аналитики и инсайтов</p>
          </div>

          <Tabs defaultValue="insights" className="space-y-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="insights">Инсайты</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-6">
              {/* Аналитика */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-6 shadow-elegant border-accent/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Всего инсайтов</p>
                    <BarChart3 className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-3xl font-bold">{totalInsights}</p>
                </Card>
                
                <Card className="p-6 shadow-elegant border-accent/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Тональность</p>
                    <Activity className="h-4 w-4 text-accent" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-400">Позитив</span>
                      <span className="font-semibold">{positivePercent}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-400">Нейтрально</span>
                      <span className="font-semibold">{neutralPercent}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-400">Негатив</span>
                      <span className="font-semibold">{negativePercent}%</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 shadow-elegant border-accent/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Топ компании</p>
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                  <div className="space-y-1">
                    {topCompanies.map((company, idx) => (
                      <div key={company.name} className="flex items-center justify-between text-sm">
                        <span>{idx + 1}. {company.name}</span>
                        <span className="font-semibold">{company.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Фильтры и действия */}
              <Card className="p-6 shadow-elegant border-accent/20">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Категория</Label>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {["Все", "Технологии", "Энергетика", "Крипто", "Финансы"].map(cat => (
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
                    
                    <div>
                      <Label>Период</Label>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {["Все", "День", "Неделя", "Месяц"].map(period => (
                          <Button
                            key={period}
                            variant={selectedDateRange === period ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedDateRange(period)}
                            className={selectedDateRange === period ? "bg-accent text-accent-foreground" : ""}
                          >
                            {period}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Источники и темы</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Например: apple.com, bitcoin, oil"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                      />
                      <Button onClick={handleAddKeyword} variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {customKeywords.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {customKeywords.map(keyword => (
                          <div key={keyword} className="flex items-center gap-1 bg-accent/20 px-3 py-1 rounded-full text-sm">
                            {keyword}
                            <button onClick={() => handleRemoveKeyword(keyword)} className="ml-1">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleRefresh} variant="outline" className="border-accent/50">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Обновить инсайты
                    </Button>
                    <Button onClick={handleExportPDF} variant="outline" className="border-accent/50">
                      <Download className="mr-2 h-4 w-4" />
                      Скачать PDF
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Лента инсайтов */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">
                  Лента инсайтов 
                  <span className="text-muted-foreground text-lg ml-2">
                    ({filteredInsights.length})
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
                  <div className="grid gap-6">
                    {filteredInsights.map(insight => (
                      <InsightCard 
                        key={insight.id} 
                        insight={insight} 
                        onClick={() => handleInsightClick(insight)}
                      />
                    ))}
                  </div>
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
                  <p className="text-sm"><span className="font-medium">Имя:</span> {user.name}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {user.email}</p>
                  <p className="text-sm"><span className="font-medium">Тариф:</span> Free (Демо)</p>
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
    </div>
  );
};

export default Dashboard;
