import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Crown, Loader2, CheckCircle, CreditCard, ShieldCheck, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated } from "@/lib/auth";
import { subscriptionApi } from "@/lib/api";
import { apiClient } from "@/lib/apiClient";
import type { ApiError } from "@/lib/apiClient";

interface PlanDto {
  id: number;
  name: string;
  price: number;
  features: string[];
}

type CheckoutStep = "form" | "processing" | "success" | "failed";

const getErrorMessage = (err: unknown): string => {
  if (typeof err === "object" && err !== null && "detail" in err) {
    const detail = (err as ApiError).detail;
    if (typeof detail === "string") return detail;
  }
  if (err instanceof Error) return err.message;
  return "Платёж не прошёл. Попробуйте ещё раз.";
};

const Pricing = () => {
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("form");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successInfo, setSuccessInfo] = useState<{ last4: string; txn: string; amount: number } | null>(null);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [proPlan, setProPlan] = useState<PlanDto | null>(null);

  // Форма карты
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get<PlanDto[]>("/payments/plans")
      .then(res => {
        setPlans(res);
        const pro = res.find(p => p.name === "Pro");
        if (pro) setProPlan(pro);
      })
      .catch(() => {});
  }, []);

  const resetForm = () => {
    setCardNumber(""); setCardHolder(""); setExpiry(""); setCvc("");
    setStep("form"); setErrorMsg(""); setSuccessInfo(null);
  };

  const handleProClick = () => {
    if (!isAuthenticated()) {
      toast({ title: "Необходима авторизация", description: "Войдите, чтобы оформить подписку" });
      return;
    }
    resetForm();
    setUpsellOpen(true);
  };

  // Форматирование ввода
  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + "/" + digits.slice(2);
  };

  const handleCheckout = async () => {
    if (!proPlan) return;
    setStep("processing");
    setErrorMsg("");
    try {
      const res = await subscriptionApi.checkout({
        plan_id: proPlan.id,
        card_number: cardNumber,
        card_holder: cardHolder,
        expiry,
        cvc,
      });
      setSuccessInfo({ last4: res.card_last4, txn: res.transaction_id, amount: res.amount });
      setStep("success");
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
      setStep("failed");
    }
  };

  const handleSuccess = () => {
    toast({ title: "Подписка Pro активирована!", description: "Добро пожаловать в мир полных возможностей Insight" });
    setUpsellOpen(false);
    navigate("/dashboard");
  };

  const uiPlans = [
    {
      name: "Free",
      price: "0",
      currency: "₽",
      description: "Для знакомства с платформой",
      features: plans.find(p => p.name === "Free")?.features || [
        "До 10 инсайтов в день",
        "Базовый AI-анализ",
        "Email-уведомления",
        "1 отслеживаемая компания",
        "Доступ к архиву за 7 дней",
      ],
      cta: "Начать бесплатно",
      highlighted: false,
      onClick: () => navigate("/"),
    },
    {
      name: "Pro",
      price: "2 500",
      currency: "₽",
      description: "Для активных инвесторов",
      features: proPlan?.features || [
        "Безлимитные инсайты",
        "Расширенный AI-анализ",
        "Push + Email уведомления",
        "До 20 компаний",
        "Архив за 90 дней",
        "Экспорт в PDF",
        "Приоритетная поддержка",
      ],
      cta: "Выбрать Pro",
      highlighted: true,
      onClick: handleProClick,
    },
    {
      name: "Enterprise",
      price: "По запросу",
      currency: "",
      description: "Для команд и организаций",
      features: [
        "Всё из Pro",
        "Неограниченное количество пользователей",
        "API-доступ",
        "Кастомные источники новостей",
        "Интеграция с внутренними системами",
        "Dedicated менеджер",
        "SLA и приоритетная поддержка 24/7",
      ],
      cta: "Связаться с нами",
      highlighted: false,
      onClick: () => navigate("/contact"),
    },
  ];

  const formValid =
    cardNumber.replace(/\s/g, "").length >= 13 &&
    cardHolder.trim().length >= 2 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    /^\d{3,4}$/.test(cvc);

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
            {uiPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`p-8 flex flex-col relative ${
                  plan.highlighted
                    ? "border-accent shadow-elegant glow-card scale-105"
                    : "border-accent/10"
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
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.currency && <span className="text-lg">{plan.currency}</span>}
                    {plan.price !== "По запросу" && plan.price !== "0" && (
                      <span className="text-muted-foreground">/мес</span>
                    )}
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
                  onClick={plan.onClick}
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">
              Все цены указаны в рублях (RUB). Принимаем карты и банковские переводы.
            </p>
            <p className="text-sm text-muted-foreground">
              Остались вопросы? <a href="/contact" className="text-accent hover:underline">Свяжитесь с нами</a>
            </p>
          </div>
        </div>
      </main>

      <Footer />

      {/* Checkout modal */}
      <Dialog open={upsellOpen} onOpenChange={(o) => { if (!o) resetForm(); setUpsellOpen(o); }}>
        <DialogContent className="sm:max-w-lg">
          {step === "form" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-accent" />
                  Оформление подписки Pro
                </DialogTitle>
                <DialogDescription>
                  Защищённая оплата. Демонстрационный режим — реальные средства не списываются.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="p-4 rounded-lg border border-accent/30 bg-accent/5 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">К оплате</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">2 500</span>
                      <span className="text-lg">₽</span>
                      <span className="text-sm text-muted-foreground ml-1">/ 30 дней</span>
                    </div>
                  </div>
                  <CreditCard className="h-10 w-10 text-accent/60" />
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="card">Номер карты</Label>
                    <Input
                      id="card"
                      inputMode="numeric"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="holder">Имя держателя</Label>
                    <Input
                      id="holder"
                      placeholder="IVAN IVANOV"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="exp">Срок действия</Label>
                      <Input
                        id="exp"
                        inputMode="numeric"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvc">CVC</Label>
                      <Input
                        id="cvc"
                        inputMode="numeric"
                        placeholder="123"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Данные карты передаются по защищённому соединению
                </div>

                <Button
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={handleCheckout}
                  disabled={!formValid}
                >
                  Оплатить 2 500 ₽
                </Button>
              </div>
            </>
          )}

          {step === "processing" && (
            <div className="py-12 flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
              <div>
                <div className="font-semibold text-lg">Обрабатываем платёж…</div>
                <div className="text-sm text-muted-foreground mt-1">Подтверждаем операцию в банке-эмитенте</div>
              </div>
            </div>
          )}

          {step === "success" && successInfo && (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <div className="font-semibold text-xl">Оплата прошла успешно</div>
                <div className="text-sm text-muted-foreground mt-1">Подписка Pro активирована на 30 дней</div>
              </div>
              <div className="w-full text-sm border rounded-lg p-3 space-y-1 text-left">
                <div className="flex justify-between"><span className="text-muted-foreground">Сумма</span><span className="font-medium">{successInfo.amount.toLocaleString("ru-RU")} ₽</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Карта</span><span className="font-medium">•••• {successInfo.last4}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">ID транзакции</span><span className="font-mono text-xs">{successInfo.txn}</span></div>
              </div>
              <Button className="w-full" onClick={handleSuccess}>Перейти в Dashboard</Button>
            </div>
          )}

          {step === "failed" && (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <ShieldCheck className="h-10 w-10 text-red-500" />
              </div>
              <div>
                <div className="font-semibold text-xl">Платёж отклонён</div>
                <div className="text-sm text-muted-foreground mt-1">{errorMsg || "Банк отклонил операцию. Попробуйте другую карту."}</div>
              </div>
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1" onClick={() => setUpsellOpen(false)}>Закрыть</Button>
                <Button className="flex-1" onClick={() => setStep("form")}>Попробовать ещё раз</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
