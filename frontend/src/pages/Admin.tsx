import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import type { AdminStats } from "@/lib/types";
import { Users, BookOpen, Newspaper, TrendingUp, Loader2, RefreshCw } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = () => {
    setIsLoading(true);
    adminApi.stats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <div className="container mx-auto px-6 py-12">

          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl font-bold mb-2">Панель администратора</h1>
              <p className="text-muted-foreground">Управление платформой Insight</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadStats} className="border-accent/30">
              <RefreshCw className="mr-2 h-4 w-4" />
              Обновить
            </Button>
          </div>

          {/* Stats */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : stats ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="p-6 border-accent/20 shadow-elegant">
                <p className="text-sm text-muted-foreground mb-1">Новых пользователей сегодня</p>
                <p className="text-4xl font-bold text-accent">{stats.users_today}</p>
              </Card>
              <Card className="p-6 border-accent/20 shadow-elegant">
                <p className="text-sm text-muted-foreground mb-1">Новостей сегодня</p>
                <p className="text-4xl font-bold text-accent">{stats.news_today}</p>
              </Card>
              <Card className="p-6 border-accent/20 shadow-elegant">
                <p className="text-sm text-muted-foreground mb-1">Всего блогов</p>
                <p className="text-4xl font-bold text-accent">{stats.total_blogs}</p>
              </Card>
              <Card className="p-6 border-accent/20 shadow-elegant">
                <p className="text-sm text-muted-foreground mb-1">Всего пользователей</p>
                <p className="text-4xl font-bold text-accent">{stats.total_users}</p>
              </Card>
            </div>
          ) : null}

          {/* Navigation cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card
              className="p-8 border-accent/20 hover:border-accent/50 hover:glow-card transition-all cursor-pointer group"
              onClick={() => navigate("/admin/users")}
            >
              <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                <Users className="h-7 w-7 text-accent" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Пользователи</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Управление аккаунтами: список, подписки, удаление
              </p>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 w-full">
                Открыть
              </Button>
            </Card>

            <Card
              className="p-8 border-accent/20 hover:border-accent/50 hover:glow-card transition-all cursor-pointer group"
              onClick={() => navigate("/admin/blogs")}
            >
              <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                <BookOpen className="h-7 w-7 text-accent" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Блоги</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Создание, редактирование и публикация материалов
              </p>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 w-full">
                Открыть
              </Button>
            </Card>

            <Card
              className="p-8 border-accent/20 hover:border-accent/50 hover:glow-card transition-all cursor-pointer group"
              onClick={() => navigate("/admin/news")}
            >
              <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                <Newspaper className="h-7 w-7 text-accent" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Инсайты</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Просмотр, редактирование и скрытие новостей
              </p>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 w-full">
                Открыть
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
