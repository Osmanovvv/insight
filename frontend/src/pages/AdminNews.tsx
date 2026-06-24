import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analysisApi } from "@/lib/api";
import { tokenStorage } from "@/lib/apiClient";
import type { Analysis } from "@/lib/types";
import {
  ArrowLeft, Trash2, Pencil, Loader2, RefreshCw,
  TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateMSK } from "@/lib/utils";

const PAGE_SIZE = 20;

interface AdminInsight {
  id: number;
  newsId?: number;
  title: string;
  source: string;
  sentiment: "positive" | "neutral" | "negative";
  impact: string;
  summary: string;
  date: string;
  hidden?: boolean;
}

const AdminNews = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<AdminInsight[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<AdminInsight | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminInsight | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [titleSearch, setTitleSearch] = useState("");
  const [titleSearchDebounced, setTitleSearchDebounced] = useState("");

  // Дебаунс поиска по заголовку (300 мс)
  useEffect(() => {
    const t = setTimeout(() => setTitleSearchDebounced(titleSearch), 300);
    return () => clearTimeout(t);
  }, [titleSearch]);

  // Edit fields
  const [editSentiment, setEditSentiment] = useState<string>("neutral");
  const [editImpact, setEditImpact] = useState<string>("medium");
  const [editSummary, setEditSummary] = useState("");

  const mapData = (data: Analysis[]): AdminInsight[] =>
    data.map(item => ({
      id: item.id,
      newsId: item.news_id,
      title: item.news?.title || "Без заголовка",
      source: item.news?.source || "Неизвестно",
      sentiment: item.sentiment || "neutral",
      impact: item.impact || "medium",
      summary: item.summary || "",
      date: item.created_at,
    }));

  const loadPage = useCallback(async (p: number, search?: string) => {
    const q = search ?? titleSearchDebounced;
    setIsLoading(true);
    try {
      const listParams: Parameters<typeof analysisApi.list>[0] = { skip: p * PAGE_SIZE, limit: PAGE_SIZE };
      const countParams: Parameters<typeof analysisApi.count>[0] = {};
      if (q?.trim()) {
        listParams.title_search = q.trim();
        countParams.title_search = q.trim();
      }
      const [data, countData] = await Promise.all([
        analysisApi.list(listParams),
        analysisApi.count(countParams).catch(() => null),
      ]);
      setItems(mapData(data));
      setTotal(countData?.total ?? data.length);
      setPage(p);
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [titleSearchDebounced, toast]);

  useEffect(() => { loadPage(0); }, [loadPage, titleSearchDebounced]);

  const openEdit = (item: AdminInsight) => {
    setEditTarget(item);
    setEditSentiment(item.sentiment);
    setEditImpact(item.impact);
    setEditSummary(item.summary);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setIsSaving(true);
    try {
      const token = tokenStorage.getAccess();
      const res = await fetch(`/api/v1/analysis/${editTarget.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sentiment: editSentiment, impact: editImpact, summary: editSummary }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Инсайт обновлён" });
      setEditTarget(null);
      loadPage(page);
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
      const token = tokenStorage.getAccess();
      const res = await fetch(`/api/v1/analysis/${deleteTarget.id}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      toast({ title: "Инсайт удалён" });
      setDeleteTarget(null);
      loadPage(page);
    } catch {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const sentimentIcon = (s: string) => {
    if (s === "positive") return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (s === "negative") return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-yellow-400" />;
  };

  const sentimentLabel = (s: string) => ({ positive: "Позитив", negative: "Негатив", neutral: "Нейтрально" }[s] || s);
  const impactLabel = (i: string) => ({ high: "Высокое", medium: "Среднее", low: "Низкое" }[i] || i);

  const formatDate = (d: string) => formatDateMSK(d);

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
              <h1 className="text-3xl font-bold">Инсайты</h1>
              <p className="text-muted-foreground text-sm">Всего: {total}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadPage(page, titleSearch)} className="border-accent/30">
              <RefreshCw className="mr-2 h-4 w-4" />
              Обновить
            </Button>
          </div>

          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по заголовку новости..."
              value={titleSearch}
              onChange={(e) => setTitleSearch(e.target.value)}
              className="pl-10 border-accent/20"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : items.length === 0 ? (
            <Card className="p-12 text-center border-accent/10">
              <p className="text-muted-foreground">Инсайты не найдены</p>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {items.map(item => (
                  <Card key={item.id} className="p-4 border-accent/10 hover:border-accent/30 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {sentimentIcon(item.sentiment)}
                          <span className="text-xs text-muted-foreground">{sentimentLabel(item.sentiment)}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                            {impactLabel(item.impact)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">{formatDate(item.date)}</span>
                        </div>
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded hover:bg-accent/10 transition-colors"
                          title="Редактировать"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadPage(page - 1, titleSearch)}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadPage(page + 1, titleSearch)}
                    disabled={page + 1 >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={o => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать инсайт</DialogTitle>
            <DialogDescription className="line-clamp-2">{editTarget?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Тональность</Label>
              <Select value={editSentiment} onValueChange={setEditSentiment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Позитив</SelectItem>
                  <SelectItem value="neutral">Нейтрально</SelectItem>
                  <SelectItem value="negative">Негатив</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Влияние на рынок</Label>
              <Select value={editImpact} onValueChange={setEditImpact}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Высокое</SelectItem>
                  <SelectItem value="medium">Среднее</SelectItem>
                  <SelectItem value="low">Низкое</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Краткое описание</Label>
              <Input
                value={editSummary}
                onChange={e => setEditSummary(e.target.value)}
                placeholder="Краткий анализ..."
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setEditTarget(null)} className="flex-1">Отмена</Button>
              <Button
                className="flex-1 bg-accent text-accent-foreground"
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить инсайт?</DialogTitle>
            <DialogDescription className="line-clamp-2">
              {deleteTarget?.title}
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

export default AdminNews;
