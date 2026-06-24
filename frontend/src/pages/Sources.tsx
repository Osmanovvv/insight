import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Wrench, Clock } from "lucide-react";

const Sources = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Мои источники</h1>
            <p className="text-muted-foreground">Управление источниками новостей и аналитики</p>
          </div>

          <Card className="p-12 shadow-elegant border-accent/20 text-center max-w-xl mx-auto mt-8">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Wrench className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3">В разработке</h2>
            <p className="text-muted-foreground mb-4">
              Раздел управления источниками новостей находится в активной разработке и будет доступен в ближайшее время.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Ожидайте обновлений</span>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sources;
