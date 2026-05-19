import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLandingPages } from "@/hooks/useLandingPages";
import { RemindersTimeline } from "@/components/config/RemindersTimeline";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ExternalLink, Edit, Rocket, Trash2, Loader2 } from "lucide-react";

function BookingsManager({ bookings }: { bookings: any[] }) {
  const { cancelBooking } = useLandingPages();
  const navigate = useNavigate();
  const [showReminders, setShowReminders] = useState<string | null>(null);

  const STATUS_STYLES: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600",
    confirmed: "bg-green-500/10 text-green-600",
    canceled: "bg-red-500/10 text-red-500",
    completed: "bg-blue-500/10 text-blue-600",
    no_show: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-3">
      {bookings.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Aucun RDV à venir.</p>
      ) : bookings.map(b => (
        <Card key={b.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{b.prospect_name}</span>
                <Badge className={`text-xs ${STATUS_STYLES[b.status] || ""}`}>{b.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">📅 {b.booked_date} à {b.booked_time} ({b.duration_minutes}min)</p>
              <p className="text-xs text-muted-foreground">✉️ {b.prospect_email}</p>
              {b.prospect_company && <p className="text-xs text-muted-foreground">🏢 {b.prospect_company}</p>}
              {b.prospect_message && <p className="text-xs text-muted-foreground italic">"{b.prospect_message}"</p>}
            </div>
            <div className="flex gap-2">
              {b.jitsi_room_url && (
                <a href={b.jitsi_room_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="text-xs h-7">🎥 Rejoindre</Button>
                </a>
              )}
              {b.rapidomeet_meeting_id && (
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => navigate(`/app/reunions/${b.rapidomeet_meeting_id}`)}>📊 Rapport</Button>
              )}
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowReminders(showReminders === b.id ? null : b.id)}>
                🔔 Rappels
              </Button>
              {["pending", "confirmed"].includes(b.status) && (
                <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive" onClick={() => { if (confirm("Annuler ce RDV ?")) cancelBooking(b.id); }}>Annuler</Button>
              )}
            </div>
          </div>
          {showReminders === b.id && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <RemindersTimeline bookingId={b.id} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

export default function LandingHub() {
  const { pages, bookings, loading, publishPage, deletePage } = useLandingPages();
  const navigate = useNavigate();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🚀 Landing Pages</h1>
          <p className="text-sm text-muted-foreground">Créez des pages de prise de RDV avec visioconférence intégrée</p>
        </div>
        <Button onClick={() => navigate("/app/landing/new")}>
          <Plus className="w-4 h-4 mr-1" /> Nouvelle page
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pages publiées", value: pages.filter(p => p.status === "published").length, icon: "🌐" },
          { label: "RDV à venir", value: bookings.filter(b => b.status === "confirmed").length, icon: "📅" },
          { label: "Total RDV", value: pages.reduce((s, p) => s + (p.booking_count || 0), 0), icon: "📊" },
        ].map(kpi => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{kpi.icon}</span>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">📄 Mes pages ({pages.length})</TabsTrigger>
          <TabsTrigger value="bookings">📅 RDV ({bookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          {pages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-5xl mb-4">🚀</p>
              <h2 className="text-xl font-bold mb-2">Aucune landing page</h2>
              <p className="text-muted-foreground mb-6">Créez votre première page de prise de RDV avec IA et visio.</p>
              <Button onClick={() => navigate("/app/landing/new")}>Créer ma première page</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map(page => (
                <Card key={page.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{page.title}</span>
                        <Badge variant="outline" className="text-xs">{page.status}</Badge>
                        {page.has_video_room && <Badge className="text-xs bg-blue-500/10 text-blue-600">🎥 Visio</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        /p/{page.slug} · 👁 {page.view_count} vues · 📅 {page.booking_count} RDV
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {page.status === "published" && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(`/p/${page.slug}`, "_blank")}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate(`/app/landing/edit/${page.id}`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {page.status !== "published" && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => publishPage(page.id)}>
                          <Rocket className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={async () => { if (confirm("Supprimer cette page ?")) await deletePage(page.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings">
          <BookingsManager bookings={bookings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
