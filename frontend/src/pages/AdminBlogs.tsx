import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { blogsApi } from "@/lib/api";
import type { Blog } from "@/lib/types";
import {
  ArrowLeft, Plus, Trash2, Pencil, Eye, EyeOff, Loader2, X, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminBlogs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Blog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourcesInput, setSourcesInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadBlogs = useCallback(() => {
    setIsLoading(true);
    blogsApi.listAdmin()
      .then(setBlogs)
      .catch(() => toast({ title: "Ошибка загрузки", variant: "destructive" }))
      .finally(() => setIsLoading(false));
  }, [toast]);

  useEffect(() => { loadBlogs(); }, [loadBlogs]);

  const openAdd = () => {
    setTitle(""); setContent(""); setSourcesInput("");
    setEditTarget(null);
    setAddOpen(true);
  };

  const openEdit = (blog: Blog) => {
    setTitle(blog.title);
    setContent(blog.content);
    setSourcesInput((blog.sources || []).join("\n"));
    setEditTarget(blog);
    setAddOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({ title: "Заполните обязательные поля", variant: "destructive" });
      return;
    }
    const sources = sourcesInput.split("\n").map(s => s.trim()).filter(Boolean);
    setIsSaving(true);
    try {
      if (editTarget) {
        await blogsApi.update(editTarget.id, { title, content, sources });
        toast({ title: "Блог обновлён" });
      } else {
        await blogsApi.create({ title, content, sources });
        toast({ title: "Блог создан" });
      }
      setAddOpen(false);
      loadBlogs();
    } catch {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await blogsApi.delete(deleteTarget.id);
      toast({ title: "Блог удалён" });
      setDeleteTarget(null);
      loadBlogs();
    } catch {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleVisibility = async (blog: Blog) => {
    try {
      await blogsApi.toggleVisibility(blog.id, !blog.is_visible);
      toast({ title: blog.is_visible ? "Блог скрыт" : "Блог опубликован" });
      loadBlogs();
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("ru-RU"); } catch { return d; }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <div className="container mx-auto px-6 py-12">

          <div className="flex items-center gap-4 mb-8 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Блоги</h1>
              <p className="text-muted-foreground text-sm">Всего: {blogs.length}</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadBlogs} className="border-accent/30">
              <RefreshCw className="mr-2 h-4 w-4" />
              Обновить
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {blogs.map(blog => (
                <Card
                  key={blog.id}
                  className={`p-5 border-accent/10 transition-colors relative group flex flex-col ${
                    !blog.is_visible ? "opacity-60" : ""
                  }`}
                >
                  {/* Action icons on hover */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleVisibility(blog)}
                      className="p-1.5 rounded hover:bg-accent/10 transition-colors"
                      title={blog.is_visible ? "Скрыть от пользователей" : "Опубликовать"}
                    >
                      {blog.is_visible
                        ? <Eye className="h-4 w-4 text-accent" />
                        : <EyeOff className="h-4 w-4 text-muted-foreground" />
                      }
                    </button>
                    <button
                      onClick={() => openEdit(blog)}
                      className="p-1.5 rounded hover:bg-accent/10 transition-colors"
                      title="Редактировать"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(blog)}
                      className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>

                  <h3 className="font-bold text-base mb-2 line-clamp-2 pr-20">{blog.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{blog.content}</p>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{formatDate(blog.created_at)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      blog.is_visible
                        ? "bg-green-500/10 text-green-400"
                        : "bg-muted/30 text-muted-foreground"
                    }`}>
                      {blog.is_visible ? "Опубликован" : "Скрыт"}
                    </span>
                  </div>
                </Card>
              ))}

              {/* Add card */}
              <Card
                className="p-5 border-dashed border-accent/30 hover:border-accent/60 hover:bg-accent/5 transition-all cursor-pointer flex items-center justify-center min-h-[200px]"
                onClick={openAdd}
              >
                <div className="text-center">
                  <Plus className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="font-medium text-accent">Добавить блог</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit dialog */}
      <Dialog open={addOpen} onOpenChange={o => !o && setAddOpen(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Редактировать блог" : "Новый блог"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Заголовок <span className="text-red-400">*</span></Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Введите заголовок"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>Содержимое <span className="text-red-400">*</span></Label>
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Напишите содержимое блога..."
                rows={10}
                disabled={isSaving}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Источники (по одному на строку)</Label>
              <Textarea
                value={sourcesInput}
                onChange={e => setSourcesInput(e.target.value)}
                placeholder="https://example.com/article"
                rows={3}
                disabled={isSaving}
                className="resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="flex-1">
                Отмена
              </Button>
              <Button type="submit" className="flex-1 bg-accent text-accent-foreground" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editTarget ? "Сохранить" : "Создать")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить блог?</DialogTitle>
            <DialogDescription>
              Вы собираетесь удалить «<span className="font-semibold text-foreground">{deleteTarget?.title}</span>». Действие необратимо.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1">Отмена</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="flex-1">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Удалить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlogs;
