import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth";
import { getSources, addSource, removeSource, toggleSourceActive, Source } from "@/lib/sources-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, CheckCircle, XCircle, Power, ArrowUpDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const Sources = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sources, setSources] = useState<Source[]>([]);
  const [sourceInput, setSourceInput] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'status'>('name');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }
    setSources(getSources());
  }, [navigate]);

  const handleAddSource = () => {
    if (!sourceInput.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите URL источника",
        variant: "destructive"
      });
      return;
    }

    const result = addSource(sourceInput.trim());
    
    if (result.success) {
      toast({
        title: "Источник добавлен",
        description: result.message
      });
      setSources(getSources());
      setSourceInput("");
    } else {
      toast({
        title: result.source?.supported ? "Источник уже добавлен" : "Источник не поддерживается",
        description: result.message,
        variant: "destructive"
      });
      if (result.source) {
        setSources(getSources());
        setSourceInput("");
      }
    }
  };

  const handleRemoveSource = (id: string) => {
    removeSource(id);
    setSources(getSources());
    toast({
      title: "Источник удалён",
      description: "Источник успешно удалён из списка"
    });
  };

  const handleToggleActive = (id: string) => {
    toggleSourceActive(id);
    setSources(getSources());
    const source = sources.find(s => s.id === id);
    toast({
      title: source?.active ? "Источник отключен" : "Источник включен",
      description: source?.active ? "Новости не будут отображаться" : "Новости будут отображаться"
    });
  };

  const sortedSources = [...sources].sort((a, b) => {
    if (sortBy === 'status') {
      if (a.active === b.active) return a.name.localeCompare(b.name);
      return a.active ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Мои источники</h1>
            <p className="text-muted-foreground">Управление источниками новостей и аналитики</p>
          </div>

          <Card className="p-6 shadow-elegant border-accent/20 mb-8">
            <h2 className="text-xl font-semibold mb-4">Добавить источник</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Например: investing.com, bloomberg.com, rbc.ru"
                value={sourceInput}
                onChange={(e) => setSourceInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSource()}
                className="flex-1"
              />
              <Button onClick={handleAddSource} className="bg-accent text-accent-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Поддерживаемые источники: investing.com, bloomberg.com, reuters.com, techcrunch.com, coindesk.com, wsj.com, ft.com, cnbc.com
            </p>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Список источников
                <span className="text-muted-foreground text-lg ml-2">
                  ({sources.length})
                </span>
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSortBy(sortBy === 'name' ? 'status' : 'name')}
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sortBy === 'name' ? 'По алфавиту' : 'По статусу'}
              </Button>
            </div>
            
            {sources.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  Вы пока не добавили ни одного источника. Добавьте источники, чтобы получать персонализированные инсайты.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {sortedSources.map(source => (
                  <Card 
                    key={source.id} 
                    className={`p-4 shadow-elegant hover:glow-card transition-all border-accent/10 hover:border-accent/30 ${!source.active ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {source.favicon && (
                          <img 
                            src={source.favicon} 
                            alt={`${source.name} icon`}
                            className="h-8 w-8 rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        {source.supported ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                        <div>
                          <h3 className="font-semibold">{source.name}</h3>
                          <p className="text-sm text-muted-foreground">{source.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {!source.supported && (
                          <span className="text-xs text-red-400">Не поддерживается</span>
                        )}
                        {source.supported && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {source.active ? 'Активен' : 'Выключен'}
                            </span>
                            <Switch
                              checked={source.active}
                              onCheckedChange={() => handleToggleActive(source.id)}
                            />
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSource(source.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sources;
