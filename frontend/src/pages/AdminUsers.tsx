import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { adminApi } from "@/lib/api";
import type { UserWithSub } from "@/lib/types";
import {
  ArrowLeft, Trash2, Crown, XCircle, CalendarPlus, Loader2,
  RefreshCw, User, Search, ShieldOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithSub[]>([]);
  const [filtered, setFiltered] = useState<UserWithSub[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<UserWithSub | null>(null);
  const [extendTarget, setExtendTarget] = useState<UserWithSub | null>(null);
  const [extendDays, setExtendDays] = useState("30");
  const [isActing, setIsActing] = useState(false);

  const loadUsers = useCallback(() => {
    setIsLoading(true);
    adminApi.listUsers()
      .then(data => {
        setUsers(data);
        setFiltered(data);
      })
      .catch(() => toast({ title: "Ошибка", description: "Не удалось загрузить пользователей", variant: "destructive" }))
      .finally(() => setIsLoading(false));
  }, [toast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? users.filter(u =>
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.first_name || "").toLowerCase().includes(q)
          )
        : users
    );
  }, [search, users]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsActing(true);
    try {
      await adminApi.deleteUser(deleteTarget.id);
      toast({ title: "Пользователь удалён" });
      setDeleteTarget(null);
      loadUsers();
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    } finally {
      setIsActing(false);
    }
  };

  const handleCancelSub = async (user: UserWithSub) => {
    try {
      await adminApi.cancelSubscription(user.id);
      toast({ title: "Подписка аннулирована" });
      loadUsers();
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const handleExtend = async () => {
    if (!extendTarget) return;
    const days = parseInt(extendDays) || 30;
    setIsActing(true);
    try {
      await adminApi.extendSubscription(extendTarget.id, days);
      toast({ title: `Подписка продлена на ${days} дней` });
      setExtendTarget(null);
      loadUsers();
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    } finally {
      setIsActing(false);
    }
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ru-RU");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <div className="container mx-auto px-6 py-12">

          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Пользователи</h1>
              <p className="text-muted-foreground text-sm">Всего: {users.length}</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadUsers} className="ml-auto border-accent/30">
              <RefreshCw className="mr-2 h-4 w-4" />
              Обновить
            </Button>
          </div>

          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center border-accent/10">
              <p className="text-muted-foreground">Пользователи не найдены</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(user => (
                <Card key={user.id} className="p-4 border-accent/10 hover:border-accent/30 transition-colors">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-accent" />
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{user.first_name || user.username}</span>
                        <span className="text-muted-foreground text-sm">@{user.username}</span>
                        {user.role === "admin" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">admin</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>

                    <div className="text-sm text-center">
                      <p className="text-muted-foreground text-xs">Регистрация</p>
                      <p>{formatDate(user.created_at)}</p>
                    </div>

                    <div className="text-sm text-center min-w-[100px]">
                      <p className="text-muted-foreground text-xs">Подписка</p>
                      <p className={user.subscription_active ? "text-accent font-semibold" : ""}>
                        {user.subscription_plan || "Free"}
                      </p>
                      {user.subscription_expires && (
                        <p className="text-xs text-muted-foreground">до {formatDate(user.subscription_expires)}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {user.subscription_active && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Продлить подписку"
                            onClick={() => { setExtendTarget(user); setExtendDays("30"); }}
                          >
                            <CalendarPlus className="h-4 w-4 text-green-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Аннулировать подписку"
                            onClick={() => handleCancelSub(user)}
                          >
                            <XCircle className="h-4 w-4 text-yellow-400" />
                          </Button>
                        </>
                      )}
                      {user.role !== "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Удалить пользователя"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить пользователя?</DialogTitle>
            <DialogDescription>
              Вы собираетесь удалить аккаунт{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.username}</span>.
              Это действие необратимо.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1">
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isActing}
              className="flex-1"
            >
              {isActing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Удалить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extend subscription */}
      <Dialog open={!!extendTarget} onOpenChange={o => !o && setExtendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Продлить подписку</DialogTitle>
            <DialogDescription>
              Продление подписки для{" "}
              <span className="font-semibold text-foreground">{extendTarget?.username}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Количество дней</Label>
              <Input
                type="number"
                min="1"
                value={extendDays}
                onChange={e => setExtendDays(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setExtendTarget(null)} className="flex-1">
                Отмена
              </Button>
              <Button
                className="flex-1 bg-accent text-accent-foreground"
                onClick={handleExtend}
                disabled={isActing}
              >
                {isActing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Продлить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
