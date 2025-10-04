import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

const Blog = () => {
  const posts = [
    {
      title: "Топ-5 событий недели: как они повлияют на рынок",
      excerpt: "Анализ ключевых новостей недели и их потенциальное влияние на основные индексы и отдельные акции.",
      date: "15 января 2025",
      readTime: "5 мин",
      category: "Аналитика"
    },
    {
      title: "Почему AI-анализ новостей экономит инвесторам деньги",
      excerpt: "Исследование показывает, что своевременная реакция на новости с помощью AI может увеличить доходность портфеля на 15-20%.",
      date: "12 января 2025",
      readTime: "7 мин",
      category: "AI & Технологии"
    },
    {
      title: "Как интерпретировать корпоративные отчёты: гайд от Insight",
      excerpt: "Подробное руководство по чтению квартальных отчётов компаний и выделению ключевых метрик.",
      date: "8 января 2025",
      readTime: "10 мин",
      category: "Обучение"
    },
    {
      title: "Макроэкономические индикаторы января: что важно знать",
      excerpt: "Обзор основных макроэкономических показателей и их влияния на финансовые рынки в начале года.",
      date: "5 января 2025",
      readTime: "6 мин",
      category: "Макроэкономика"
    },
    {
      title: "Кейс: как Insight помог предсказать рост акций Tesla",
      excerpt: "Реальный пример успешного использования AI-анализа для принятия инвестиционного решения.",
      date: "2 января 2025",
      readTime: "8 мин",
      category: "Кейсы"
    },
    {
      title: "Тренды 2025: что будет двигать рынки в этом году",
      excerpt: "Прогнозы и аналитика главных драйверов роста для различных секторов экономики.",
      date: "1 января 2025",
      readTime: "12 мин",
      category: "Прогнозы"
    }
  ];

  const categories = ["Все", "Аналитика", "AI & Технологии", "Обучение", "Кейсы", "Прогнозы"];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-32 pb-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-5xl font-bold">
              Блог <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">Insight</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Инсайты, аналитика и обучающие материалы для умных инвесторов
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  category === "Все"
                    ? "bg-accent text-accent-foreground"
                    : "bg-card hover:bg-accent/10 border border-accent/20"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <Card key={index} className="p-6 hover:glow-card transition-all border-accent/10 hover:border-accent/30 cursor-pointer group">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                    {post.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button className="px-8 py-3 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors font-medium">
              Загрузить ещё статьи
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
