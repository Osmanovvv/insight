import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, ExternalLink, Loader2 } from "lucide-react";
import { blogsApi } from "@/lib/api";
import type { Blog } from "@/lib/types";

const BlogPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  useEffect(() => {
    blogsApi.list(false)
      .then(setBlogs)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

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

          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-xl text-muted-foreground">Публикации ещё не добавлены</p>
              <p className="text-sm text-muted-foreground mt-2">Следите за обновлениями — мы готовим материалы для вас</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Card
                  key={blog.id}
                  className="p-6 hover:glow-card transition-all border-accent/10 hover:border-accent/30 cursor-pointer group flex flex-col"
                  onClick={() => setSelectedBlog(blog)}
                >
                  <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors line-clamp-2">
                    {blog.title}
                  </h3>

                  <p className="text-muted-foreground mb-4 line-clamp-4 flex-1 text-sm">
                    {blog.content}
                  </p>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-auto">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(blog.created_at)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Blog detail modal */}
      <Dialog open={!!selectedBlog} onOpenChange={(o) => !o && setSelectedBlog(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedBlog && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold leading-snug pr-6">
                  {selectedBlog.title}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedBlog.created_at)}
                </p>
              </DialogHeader>

              <div className="py-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {selectedBlog.content}
              </div>

              {selectedBlog.sources && selectedBlog.sources.length > 0 && (
                <div className="border-t border-border pt-4 mt-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Источники</p>
                  <ul className="space-y-1">
                    {selectedBlog.sources.map((src, i) => (
                      <li key={i}>
                        <a
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {src}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full border-accent/30"
                  onClick={() => setSelectedBlog(null)}
                >
                  Закрыть
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogPage;
