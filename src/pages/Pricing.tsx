import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { savePricingRequest } from "@/lib/insights-data";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handlePlanClick = (planName: string) => {
    if (planName === "Free") {
      window.location.href = "/";
      return;
    }
    setSelectedPlan(planName);
    setRequestModalOpen(true);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Ошибка",
        description: "Введите email",
        variant: "destructive"
      });
      return;
    }
    savePricingRequest(email, selectedPlan);
    toast({
      title: "Заявка отправлена",
      description: "Мы свяжемся с вами в ближайшее время"
    });
    setRequestModalOpen(false);
    setEmail("");
  };

  const plans = [
    {
      name: "Free",
      price: "0",
      description: "Для знакомства с платформой",
      features: [
        "До 10 инсайтов в день",
        "Базовый AI-анализ",
        "Email-уведомления",
        "1 отслеживаемая компания",
        "Доступ к архиву за 7 дней"
      ],
      cta: "Начать бесплатно",
      highlighted: false
    },
    {
      name: "Pro",
      price: "49",
      description: "Для активных инвесторов",
      features: [
        "Безлимитные инсайты",
        "Расширенный AI-анализ",
        "Push + Email уведомления",
        "До 20 компаний",
        "Архив за 90 дней",
        "Экспорт в PDF",
        "Приоритетная поддержка"
      ],
      cta: "Выбрать Pro",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Для команд и организаций",
      features: [
        "Всё из Pro",
        "Неограниченное количество пользователей",
        "API-доступ",
        "Кастомные источники новостей",
        "Интеграция с внутренними системами",
        "Dedicated менеджер",
        "SLA и приоритетная поддержка 24/7"
      ],
      cta: "Связаться с нами",
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-32 pb-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-5xl font-bold">
              Прозрачные <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">цены</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Выберите план, который подходит вашим потребностям
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name}
                className={`p-8 flex flex-col ${
                  plan.highlighted 
                    ? 'border-accent shadow-elegant glow-card scale-105' 
                    : 'border-accent/10'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-accent-foreground rounded-full text-sm font-semibold">
                    Популярный
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    {plan.price !== "Custom" && <span className="text-lg">$</span>}
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground">/мес</span>}
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={
                    plan.highlighted
                      ? "bg-accent text-accent-foreground hover:bg-accent/90 glow-accent w-full"
                      : "w-full"
                  }
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => handlePlanClick(plan.name)}
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">
              Все цены указаны в USD. Принимаем карты и банковские переводы.
            </p>
            <p className="text-sm text-muted-foreground">
              Остались вопросы? <a href="/contact" className="text-accent hover:underline">Свяжитесь с нами</a>
            </p>
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Оставить заявку на {selectedPlan}</DialogTitle>
            <DialogDescription>
              Укажите ваш email, и мы свяжемся с вами для обсуждения деталей
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="request-email">Email</Label>
              <Input
                id="request-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Отправить заявку
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
