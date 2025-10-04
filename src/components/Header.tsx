import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthModal } from "./AuthModal";
import { getUser, removeUser, isAuthenticated } from "@/lib/auth";
import { LogOut, LayoutDashboard, Moon, Sun, Folder, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState(getUser());
  const [isDark, setIsDark] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    setIsDark(theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, []);

  useEffect(() => {
    setUser(getUser());
  }, [authModalOpen]);

  const handleLogout = () => {
    removeUser();
    setUser(null);
    toast({
      title: "Выход выполнен",
      description: "До скорой встречи!"
    });
    navigate("/");
  };

  const handleAuthSuccess = () => {
    setUser(getUser());
    navigate("/dashboard");
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
    toast({
      title: `${newTheme === 'dark' ? 'Тёмная' : 'Светлая'} тема`,
      description: "Тема успешно изменена"
    });
  };

  return (
    <>
      <header className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-accent" />
              <span className="text-xl font-bold bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                Insight
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-sm hover:text-accent transition-colors">
                Возможности
              </Link>
              <Link to="/pricing" className="text-sm hover:text-accent transition-colors">
                Цены
              </Link>
              <Link to="/blog" className="text-sm hover:text-accent transition-colors">
                Блог
              </Link>
              <Link to="/about" className="text-sm hover:text-accent transition-colors">
                О нас
              </Link>
              <Link to="/contact" className="text-sm hover:text-accent transition-colors">
                Контакты
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              
              {isAuthenticated() && user ? (
                <>
                  <Button variant="ghost" onClick={() => navigate("/sources")}>
                    <Folder className="mr-2 h-4 w-4" />
                    Источники
                  </Button>
                  <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {user.name}
                  </Button>
                  <Button variant="ghost" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Выход
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setAuthModalOpen(true)}>
                    Войти
                  </Button>
                  <Button 
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    Начать бесплатно
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default Header;
