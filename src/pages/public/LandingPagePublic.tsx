import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, CheckCircle } from "lucide-react";
import PageHead from "@/components/PageHead";

function BookingForm({ page }: { page: any }) {
  const [step, setStep] = useState<"date" | "form" | "success">("date");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(page.booking_config?.duration_options?.[0] || 30);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  const loadSlots = async (date: string) => {
    setLoadingSlots(true);
    setSelectedDate(date);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/landing-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "" },
        body: JSON.stringify({ action: "get_availability", payload: { landing_page_id: page.id, date } }),
      });
      const data = await res.json();
      setSlots(data.slots || []);
    } catch { setSlots([]); }
    setLoadingSlots(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/landing-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "" },
        body: JSON.stringify({
          action: "create_booking",
          payload: {
            landing_page_id: page.id,
            prospect_name: form.name,
            prospect_email: form.email,
            prospect_phone: form.phone || null,
            prospect_company: form.company || null,
            prospect_message: form.message || null,
            booked_date: selectedDate,
            booked_time: selectedTime,
            duration_minutes: selectedDuration,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingResult(data);
        setStep("success");
      }
    } finally { setSubmitting(false); }
  };

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];

  if (step === "success" && bookingResult) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">RDV confirmé !</h3>
        <p className="text-muted-foreground mb-4">📅 {selectedDate} à {selectedTime} ({selectedDuration}min)</p>
        {bookingResult.jitsi_room_url && (
          <a href={bookingResult.jitsi_room_url} target="_blank" rel="noopener noreferrer">
            <Button className="w-full">🎥 Rejoindre la visio le jour J</Button>
          </a>
        )}
        <p className="text-xs text-muted-foreground mt-4">Un email de confirmation vous a été envoyé.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-md mx-auto" id="booking">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" /> {page.booking_config?.title || "Réserver un appel"}
      </h3>

      {step === "date" && (
        <div className="space-y-4">
          <div>
            <Label>Choisissez une date</Label>
            <Input type="date" min={today} max={maxDate} value={selectedDate} onChange={e => loadSlots(e.target.value)} className="mt-1" />
          </div>

          {page.booking_config?.duration_options?.length > 1 && (
            <div>
              <Label>Durée</Label>
              <div className="flex gap-2 mt-1">
                {(page.booking_config.duration_options as number[]).map((d: number) => (
                  <button key={d} onClick={() => setSelectedDuration(d)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedDuration === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                    {d} min
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDate && (
            <div>
              <Label>Choisissez un créneau</Label>
              {loadingSlots ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucun créneau disponible ce jour.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {slots.map(slot => (
                    <button key={slot} onClick={() => setSelectedTime(slot)} className={`px-3 py-2 rounded-lg text-sm transition-colors ${selectedTime === slot ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button className="w-full" disabled={!selectedDate || !selectedTime} onClick={() => setStep("form")}>
            Continuer →
          </Button>
        </div>
      )}

      {step === "form" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">📅 {selectedDate} à {selectedTime} ({selectedDuration}min)</p>
          <button onClick={() => setStep("date")} className="text-xs text-primary hover:underline">← Modifier le créneau</button>

          <div>
            <Label>Nom *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" required />
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" required />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label>Entreprise</Label>
            <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="mt-1" rows={3} placeholder="Décrivez brièvement votre besoin..." />
          </div>

          <Button className="w-full" disabled={!form.name || !form.email || submitting} onClick={handleSubmit}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirmer le RDV
          </Button>
        </div>
      )}
    </Card>
  );
}

function JitsiRoom({ page, roomName }: { page: any; roomName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [joined, setJoined] = useState(false);

  const joinRoom = () => {
    setJoined(true);
    const domain = page.jitsi_config?.domain || "meet.jit.si";
    const url = `https://${domain}/${roomName}`;
    window.open(url, "_blank");
  };

  return (
    <Card className="p-6 text-center max-w-md mx-auto">
      <p className="text-3xl mb-3">🎥</p>
      <h3 className="font-semibold mb-2">{page.jitsi_config?.subject || "Salle de visioconférence"}</h3>
      <p className="text-sm text-muted-foreground mb-4">Jitsi Meet — gratuit, sécurisé, sans inscription</p>
      {!joined ? (
        <Button onClick={joinRoom} className="w-full">🎥 Rejoindre la salle</Button>
      ) : (
        <p className="text-sm text-green-600">La salle s'est ouverte dans un nouvel onglet.</p>
      )}
    </Card>
  );
}

export default function LandingPagePublic() {
  const { slug } = useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const host = window.location.hostname;
    const isSubdomain =
      host.endsWith(".rapidomeet.io") &&
      host !== "app.rapidomeet.io" &&
      host !== "www.rapidomeet.io";
    const isCustomDomain =
      !host.includes("rapidomeet.io") && !host.includes("lovable.app") && !host.includes("localhost");

    const load = async () => {
      let query;

      if (slug) {
        query = supabase.from("landing_pages").select("*").eq("slug", slug).eq("status", "published").single();
      } else if (isSubdomain) {
        const sub = host.replace(".rapidomeet.io", "");
        query = supabase.from("landing_pages").select("*").eq("subdomain", sub).eq("status", "published").single();
      } else if (isCustomDomain) {
        query = supabase.from("landing_pages").select("*").eq("custom_domain", host).eq("status", "published").eq("domain_verified", true).single();
      }

      if (!query) { setLoading(false); return; }
      const { data } = await query;
      setPage(data);
      setLoading(false);
      if (data) {
        supabase.from("landing_pages").update({ view_count: (data.view_count || 0) + 1 } as any).eq("id", data.id).then(() => {});
      }
    };
    load();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  );

  if (!page) return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div>
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold mb-2">Page introuvable</h1>
        <p className="text-muted-foreground">Cette page n'existe pas ou n'est plus disponible.</p>
      </div>
    </div>
  );

  const primaryColor = page.primary_color || "#6366f1";

  return (
    <div className="min-h-screen bg-background">
      <PageHead title={page.seo_title || page.title} description={page.seo_description || page.description || ""} />

      {/* Hero */}
      <section className="py-20 px-4 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}15, transparent)` }}>
        {page.logo_url && <img src={page.logo_url} alt="" className="h-12 mx-auto mb-6" />}
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{page.title}</h1>
        {page.subtitle && <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">{page.subtitle}</p>}
        {page.description && <p className="text-muted-foreground max-w-xl mx-auto mb-8">{page.description}</p>}
        {page.has_booking_form && (
          <a href="#booking">
            <Button size="lg" style={{ backgroundColor: primaryColor }}>📅 Prendre rendez-vous</Button>
          </a>
        )}
      </section>

      {/* Custom content */}
      {page.content_html && (
        <section className="max-w-4xl mx-auto px-4 py-12">
          <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: page.content_html }} />
        </section>
      )}

      {/* Countdown */}
      {page.has_countdown && page.countdown_target && (
        <CountdownSection target={page.countdown_target} label={page.countdown_label} color={primaryColor} />
      )}

      {/* Booking form */}
      {page.has_booking_form && (
        <section className="py-16 px-4">
          <BookingForm page={page} />
        </section>
      )}

      {/* Video room */}
      {page.has_video_room && (
        <section className="py-12 px-4">
          <JitsiRoom page={page} roomName={`rapidomeet-${page.slug}`} />
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-muted-foreground border-t border-border/30">
        Propulsé par <a href="/" className="text-primary hover:underline">⚡ RapidoMeet</a>
      </footer>
    </div>
  );
}

function CountdownSection({ target, label, color }: { target: string; label?: string; color: string }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(target).getTime() - Date.now());
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <section className="py-12 px-4 text-center">
      {label && <p className="text-lg font-semibold mb-4">{label}</p>}
      <div className="flex justify-center gap-4">
        {[
          { v: timeLeft.d, l: "Jours" },
          { v: timeLeft.h, l: "Heures" },
          { v: timeLeft.m, l: "Min" },
          { v: timeLeft.s, l: "Sec" },
        ].map(t => (
          <div key={t.l} className="text-center">
            <div className="text-3xl font-bold rounded-xl px-4 py-3" style={{ backgroundColor: `${color}15`, color }}>{t.v}</div>
            <p className="text-xs text-muted-foreground mt-1">{t.l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
