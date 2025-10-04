import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Сообщение отправлено! Мы свяжемся с вами в ближайшее время.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-32 pb-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-5xl font-bold">
              Свяжитесь <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">с нами</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Есть вопросы? Мы всегда рады помочь
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-6">Напишите нам</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Имя
                    </label>
                    <Input 
                      id="name"
                      placeholder="Ваше имя" 
                      className="bg-card border-accent/20 focus:border-accent"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input 
                      id="email"
                      type="email"
                      placeholder="your@email.com" 
                      className="bg-card border-accent/20 focus:border-accent"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">
                      Тема
                    </label>
                    <Input 
                      id="subject"
                      placeholder="Чем мы можем помочь?" 
                      className="bg-card border-accent/20 focus:border-accent"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Сообщение
                    </label>
                    <Textarea 
                      id="message"
                      placeholder="Расскажите подробнее..." 
                      className="bg-card border-accent/20 focus:border-accent min-h-[150px]"
                      required
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 glow-accent"
                  >
                    Отправить сообщение
                  </Button>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-6">Другие способы связи</h2>
                
                <div className="space-y-4">
                  <Card className="p-6 border-accent/10 hover:glow-card transition-all">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                        <Mail className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          Напишите нам на почту
                        </p>
                        <a href="mailto:hello@insight.ai" className="text-accent hover:underline">
                          hello@insight.ai
                        </a>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border-accent/10 hover:glow-card transition-all">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                        <Phone className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Телефон</h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          Позвоните нам в рабочее время
                        </p>
                        <a href="tel:+74951234567" className="text-accent hover:underline">
                          +7 (495) 123-45-67
                        </a>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border-accent/10 hover:glow-card transition-all">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Live Chat</h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          Онлайн-поддержка пн-пт 9:00-18:00
                        </p>
                        <button className="text-accent hover:underline">
                          Начать чат
                        </button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <Card className="p-6 gradient-primary/10 border-accent/20">
                <h3 className="font-semibold mb-2">Часы работы</h3>
                <p className="text-sm text-muted-foreground">
                  Понедельник - Пятница: 9:00 - 18:00 (МСК)<br />
                  Суббота - Воскресенье: Выходной
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
