import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthModal } from "@/components/AuthModal";
import { ArrowRight, Sparkles, TrendingUp, Bell, FileText } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { isAuthenticated } from "@/lib/auth";

const Index = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleTryFree = () => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    navigate("/dashboard");
  };

  return (
    <>
    <AuthModal 
      open={authModalOpen} 
      onOpenChange={setAuthModalOpen}
      onSuccess={handleAuthSuccess}
    />
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <main className="flex-1 pt-20">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-subtle opacity-50" />
          <div className="container mx-auto px-6 py-24 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight animate-fade-in">
                  Новости превращаются в{" "}
                  <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                    инсайты
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  Меньше шума — больше решений. AI-анализ влияния событий на рынки в реальном времени.
                </p>
                <div className="flex gap-4">
                  <Button size="lg" onClick={handleTryFree} className="bg-accent text-accent-foreground hover:bg-accent/90 glow-accent">
                    Попробовать бесплатно
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-accent/50 hover:bg-accent/10" onClick={handleTryFree}>
                    Посмотреть демо
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
                <img 
                  src={heroImage} 
                  alt="AI Analytics Dashboard" 
                  className="relative rounded-2xl shadow-elegant glow-card"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-24 bg-card/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Как это работает</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Пример анализа новости в реальном времени
              </p>
            </div>

            <Card className="max-w-4xl mx-auto p-8 shadow-elegant glow-card border-accent/20">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <FileText className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Исходная новость</h3>
                    <p className="text-muted-foreground">
                      "Apple представила новую линейку процессоров M4, демонстрируя 40% прирост производительности по сравнению с предыдущим поколением."
                    </p>
                  </div>
                </div>

                <div className="border-l-2 border-accent pl-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <Sparkles className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">Что произошло</h4>
                      <p className="text-sm text-muted-foreground">
                        Технологический прорыв в производстве процессоров, укрепление позиций на рынке
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <TrendingUp className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">Влияние на рынок</h4>
                      <p className="text-sm text-muted-foreground">
                        <span className="text-green-400 font-medium">Положительно</span> для акций AAPL (+2-3% краткосрочно), 
                        <span className="text-yellow-400 font-medium"> нейтрально</span> для конкурентов (INTC, AMD)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Bell className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">Рекомендация</h4>
                      <p className="text-sm text-muted-foreground">
                        Рассмотреть покупку AAPL на коррекции. Следить за квартальным отчётом для подтверждения прогнозов.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Возможности платформы</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Всё необходимое для принятия умных инвестиционных решений
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 shadow-elegant hover:glow-card transition-all border-accent/10 hover:border-accent/30">
                <div className="h-12 w-12 rounded-lg gradient-accent flex items-center justify-center mb-6">
                  <Sparkles className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI-анализ</h3>
                <p className="text-muted-foreground">
                  Глубокий анализ новостей с выделением ключевых факторов и их влияния на рынки
                </p>
              </Card>

              <Card className="p-8 shadow-elegant hover:glow-card transition-all border-accent/10 hover:border-accent/30">
                <div className="h-12 w-12 rounded-lg gradient-accent flex items-center justify-center mb-6">
                  <TrendingUp className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Прогнозы</h3>
                <p className="text-muted-foreground">
                  Оценка краткосрочного и долгосрочного влияния событий на акции и рынки
                </p>
              </Card>

              <Card className="p-8 shadow-elegant hover:glow-card transition-all border-accent/10 hover:border-accent/30">
                <div className="h-12 w-12 rounded-lg gradient-accent flex items-center justify-center mb-6">
                  <Bell className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Уведомления</h3>
                <p className="text-muted-foreground">
                  Мгновенные оповещения о важных событиях по вашим компаниям и отраслям
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 gradient-primary opacity-10" />
          <div className="container mx-auto px-6 relative">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-4xl font-bold">
                Готовы принимать умные решения?
              </h2>
              <p className="text-xl text-muted-foreground">
                Присоединяйтесь к тысячам инвесторов, которые уже используют Insight
              </p>
              <Button size="lg" onClick={handleTryFree} className="bg-accent text-accent-foreground hover:bg-accent/90 glow-accent animate-glow">
                Начать бесплатно
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
    </>
  );
};

export default Index;
