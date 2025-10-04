import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Target, Users, Zap } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-32 pb-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-6">
              <h1 className="text-5xl font-bold">
                О <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">нас</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Insight создан командой финансовых аналитиков и AI-инженеров, 
                которые столкнулись с проблемой информационной перегрузки в мире финансов.
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Наша миссия</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Мы верим, что качественная аналитика должна быть доступна каждому инвестору, 
                а не только крупным игрокам с армией аналитиков. Наша цель — демократизировать 
                доступ к инсайтам мирового уровня с помощью искусственного интеллекта.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-8 text-center border-accent/10">
                <div className="h-16 w-16 rounded-full gradient-accent flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Точность</h3>
                <p className="text-muted-foreground">
                  95%+ точность в определении тональности и влияния новостей
                </p>
              </Card>

              <Card className="p-8 text-center border-accent/10">
                <div className="h-16 w-16 rounded-full gradient-accent flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Скорость</h3>
                <p className="text-muted-foreground">
                  Анализ новостей за секунды после публикации
                </p>
              </Card>

              <Card className="p-8 text-center border-accent/10">
                <div className="h-16 w-16 rounded-full gradient-accent flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Доступность</h3>
                <p className="text-muted-foreground">
                  Простой интерфейс для инвесторов любого уровня
                </p>
              </Card>
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Наша команда</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Команда Insight объединяет экспертов в области финансов, машинного обучения 
                и data science. Наши аналитики имеют опыт работы в ведущих инвестиционных 
                банках и хедж-фондах, а инженеры — в передовых AI-лабораториях.
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Технологии</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Мы используем state-of-the-art NLP модели и машинное обучение для анализа 
                текстов. Наша платформа обрабатывает миллионы документов ежедневно, 
                выделяя только самое важное для ваших инвестиционных решений.
              </p>
            </div>

            <Card className="p-8 gradient-primary/10 border-accent/20 text-center">
              <p className="text-2xl font-bold mb-4">
                "Insight — это то, чего мне не хватало в начале карьеры инвестора"
              </p>
              <p className="text-muted-foreground">— Основатель и CEO Insight</p>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
