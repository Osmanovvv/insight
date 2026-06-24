import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveUser } from "@/lib/auth";
import { authApi, usersApi } from "@/lib/api";
import type { ApiError } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (isAdmin?: boolean) => void;
}

type ValidationErrorDetail = {
  msg?: string;
};

const isApiError = (err: unknown): err is ApiError => {
  return typeof err === "object" && err !== null && "detail" in err;
};

export const AuthModal = ({ open, onOpenChange, onSuccess }: AuthModalProps) => {
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput || !password) {
      toast({ title: "Ошибка", description: "Заполните все поля", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.login(loginInput, password);

      // Получаем настоящие данные пользователя
      const user = await usersApi.me();
      saveUser(user);

      toast({ title: "Успешный вход", description: "Добро пожаловать в Insight!" });
      onOpenChange(false);
      onSuccess(user.role === "admin");
    } catch (err: unknown) {
      toast({
        title: "Ошибка входа",
        description: isApiError(err) && typeof err.detail === "string" ? err.detail : "Неверный логин или пароль",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !regPassword || !name) {
      toast({ title: "Ошибка", description: "Заполните все поля", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register({
        email,
        username: name,
        password: regPassword,
        role: "investor",
      });

      await authApi.login(email, regPassword);
      const user = await usersApi.me();
      saveUser(user);

      toast({ title: "Регистрация успешна", description: "Добро пожаловать в Insight!" });
      onOpenChange(false);
      onSuccess(false);
    } catch (err: unknown) {
      let errorMessage = "Возможно, email или имя пользователя уже заняты";

      if (isApiError(err) && Array.isArray(err.detail)) {
        errorMessage = err.detail
          .map((e: ValidationErrorDetail) => (e.msg || "").replace("Value error, ", ""))
          .filter(Boolean)
          .join(", ");
      } else if (isApiError(err) && typeof err.detail === "string") {
        errorMessage = err.detail;
      }

      toast({
        title: "Ошибка регистрации",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Insight</DialogTitle>
          <DialogDescription className="text-center">
            Войдите или создайте аккаунт
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" disabled={isLoading}>Вход</TabsTrigger>
            <TabsTrigger value="register" disabled={isLoading}>Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-input">Email или логин</Label>
                <Input
                  id="login-input"
                  type="text"
                  placeholder="your@email.com или username"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Войти"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Имя пользователя (Логин)</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Например: john_doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Пароль</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Зарегистрироваться"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
