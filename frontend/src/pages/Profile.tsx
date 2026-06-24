import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  User, Mail, Shield, Calendar, Crown, CheckCircle, Loader2,
  CreditCard, Clock, BadgeCheck
} from "lucide-react";
import { getUser, saveUser } from "@/lib/auth";
import { usersApi, subscriptionApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionInfo, User as ApiUser } from "@/lib/types";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<ApiUser | null>(getUser());
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoadingSub, setIsLoadingSub] = useState(true);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Edit profile
  const [editOpen, setEditOpen] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [isSaving, setIsSaving] = useState(false);

  const isPro = subscription?.plan === "Pro" && subscription?.is_active;

  useEffect(() => {
    subscriptionApi.mySubscription()
      .then(setSubscription)
      .catch(() => {})
      .finally(() => setIsLoadingSub(false));
  }, []);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    await new Promise(r => setTimeout(r, 2000));
    try {
      await subscriptionApi.subscribePro();
      const newSub = await subscriptionApi.mySubscription();
      setSubscription(newSub);
      toast({ title: "Подписка Pro активирована!", description: "Добро пожаловать в мир полных возможностей Insight" });
      setUpsellOpen(false);
    } catch {
      toast({ title: "Ошибка", description: "Не удалось оформить подписку", variant: "destructive" });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await usersApi.updateMe({ first_name: firstName, last_name: lastName });
      saveUser(updated);
      setUser(updated);
      toast({ title: "Профиль обновлён" });
      setEditOpen(false);
    } catch {
      toast({ title: "Ошибка", description: "Не удалось обновить профиль", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  };

  if (!user) return null;

  const displayName = user.first_name
    ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}`
    : user.username;

  const planFeatures = isPro
    ? ["Безлимитные инсайты", "Расширенный AI-анализ", "Push + Email уведомления", "До 20 компаний", "Архив за 90 дней", "Экспорт в PDF", "Приоритетная поддержка"]
    : ["До 10 инсайтов в день", "Базовый AI-анализ", "Email-уведомления", "1 отслеживаемая компания", "Доступ к архиву за 7 дней"];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <div className="container mx-auto px-6 py-12 max-w-4xl">

          {/* Title */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-2">Личный кабинет</h1>
            <p className="text-muted-foreground">Управляйте профилем и подпиской</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* User info card */}
            <Card className="p-6 shadow-elegant border-accent/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center">
                  <User className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{displayName}</h2>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{user.role}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Зарегистрирован: {formatDate(user.created_at)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                  <span>Аккаунт {user.is_active ? "активен" : "неактивен"}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="mt-6 w-full border-accent/30"
                onClick={() => {
                  setFirstName(user.first_name || "");
                  setLastName(user.last_name || "");
                  setEditOpen(true);
                }}
              >
                Редактировать профиль
              </Button>
            </Card>

            {/* Subscription card */}
            <Card className={`p-6 shadow-elegant ${isPro ? "border-accent glow-card" : "border-accent/20"}`}>
              <div className="flex items-center gap-3 mb-6">
                {isPro ? (
                  <Crown className="h-6 w-6 text-accent" />
                ) : (
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                )}
                <div>
                  <h2 className="text-xl font-bold">
                    {isLoadingSub ? "..." : (subscription?.plan || "Free")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isPro ? "Активная подписка" : "Базовый тариф"}
                  </p>
                </div>
                {isPro && (
                  <div className="ml-auto px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-semibold">
                    Pro
                  </div>
                )}
              </div>

              {isPro && subscription?.expires_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Clock className="h-4 w-4" />
                  <span>Действует до: {formatDate(subscription.expires_at)}</span>
                </div>
              )}

              <ul className="space-y-2 mb-6">
                {planFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`h-4 w-4 flex-shrink-0 ${isPro ? "text-accent" : "text-muted-foreground"}`} />
                    <span className={!isPro ? "text-muted-foreground" : ""}>{f}</span>
                  </li>
                ))}
              </ul>

              {!isPro && (
                <Button
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 glow-accent"
                  onClick={() => setUpsellOpen(true)}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Перейти на Pro — 2 500 ₽/мес
                </Button>
              )}
            </Card>
          </div>

          {/* Quick links */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <Card
              className="p-5 border-accent/10 hover:border-accent/30 hover:glow-card transition-all cursor-pointer"
              onClick={() => navigate("/dashboard")}
            >
              <h3 className="font-semibold mb-1">Перейти к инсайтам</h3>
              <p className="text-sm text-muted-foreground">Откройте дашборд с аналитикой рынков</p>
            </Card>
            <Card
              className="p-5 border-accent/10 hover:border-accent/30 hover:glow-card transition-all cursor-pointer"
              onClick={() => navigate("/blog")}
            >
              <h3 className="font-semibold mb-1">Читать блог</h3>
              <p className="text-sm text-muted-foreground">Актуальные статьи и аналитика</p>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      {/* Edit profile modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Введите имя"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>Фамилия</Label>
              <Input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Введите фамилию"
                disabled={isSaving}
              />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Сохранить"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upsell modal */}
      <Dialog open={upsellOpen} onOpenChange={setUpsellOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" />
              Подписка Pro
            </DialogTitle>
            <DialogDescription>
              Получите полный доступ ко всем возможностям Insight
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-lg border border-accent/30 bg-accent/5">
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold">2 500</span>
                <span className="text-lg">₽</span>
                <span className="text-muted-foreground">/мес</span>
              </div>
              <ul className="space-y-2">
                {planFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Обработка платежа...
                </>
              ) : (
                "Оплатить подписку Pro"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
