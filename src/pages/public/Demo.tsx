import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHead from "@/components/PageHead";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface DemoData {
  meeting: any;
  tasks: any[];
  decisions: any[];
  contacts: any[];
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  medium: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

const Demo = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());
  const [showSignup, setShowSignup] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const [animStep, setAnimStep] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: d, error } = await supabase.functions.invoke("get-demo-data");
        if (!error && d) setData(d);
      } catch {
        // fallback silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Animation steps
  useEffect(() => {
    if (!data) return;
    const t1 = setTimeout(() => setAnimStep(1), 800);
    const t2 = setTimeout(() => setAnimStep(2), 2200);
    const t3 = setTimeout(() => setAnimStep(3), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [data]);

  const handleSignup = async () => {
    if (!signupEmail || !signupPassword) return;
    setSigningUp(true);
    try {
      const { error } = await supabase.auth.signUp({ email: signupEmail, password: signupPassword });
      if (error) throw error;
      toast({ title: "Compte créé ✓", description: "Vérifiez votre email pour confirmer votre inscription." });
      setShowSignup(false);
      navigate("/connexion");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSigningUp(false);
    }
  };

  const toggleTask = (id: string) => {
    setCheckedTasks(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div className="bg-background min-h-screen">
      <PageHead title="Démo interactive — RapidoMeet" description="Découvrez RapidoMeet en action avec de vraies données. Aucun compte requis." path="/demo" />
      <Navbar />

      <section className="pt-[120px] pb-16 px-5 md:px-[60px]">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-sm">🎭</span>
              <span className="font-mono text-xs text-primary">Mode Démonstration</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-5xl text-foreground tracking-tight mb-3">
              Voyez RapidoMeet <span className="text-primary">en action</span>
            </h1>
            <p className="font-body text-base text-muted-foreground max-w-xl mx-auto">
              Données réelles d'une réunion commerciale analysée par notre IA. Aucun compte requis.
            </p>
          </div>

          {/* Animation pipeline */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 mb-10">
            {[
              { step: 1, icon: "🎙", label: "Transcription", sub: "45 min d'audio" },
              { step: 2, icon: "🧠", label: "Analyse NLP", sub: "Tâches + Décisions" },
              { step: 3, icon: "📊", label: "Rapport", sub: "Prêt en 1m42s" },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-3">
                <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-500 ${
                  animStep >= s.step
                    ? "bg-primary/10 border-primary/30 scale-105"
                    : "bg-muted/20 border-border/30 opacity-50"
                }`}>
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <p className="font-display font-bold text-sm text-foreground">{s.label}</p>
                    <p className="font-body text-[11px] text-muted-foreground">{s.sub}</p>
                  </div>
                  {animStep >= s.step && <span className="text-[hsl(var(--success))]">✓</span>}
                </div>
                {s.step < 3 && <span className="hidden md:block text-muted-foreground">→</span>}
              </div>
            ))}
          </div>

          {/* Main content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
              {/* Left — Tabs */}
              <div>
                <Tabs defaultValue="resume" className="w-full">
                  <TabsList className="w-full justify-start mb-4">
                    <TabsTrigger value="resume">Résumé</TabsTrigger>
                    <TabsTrigger value="taches">Tâches ({data.tasks.length})</TabsTrigger>
                    <TabsTrigger value="decisions">Décisions ({data.decisions.length})</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts ({data.contacts.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="resume">
                    <Card className="p-6">
                      <h3 className="font-display font-bold text-lg text-foreground mb-1">{data.meeting.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline">{data.meeting.meeting_type}</Badge>
                        <Badge variant="outline">{Math.round(data.meeting.duration_seconds / 60)} min</Badge>
                        <Badge variant="outline">{data.meeting.language?.toUpperCase()}</Badge>
                      </div>
                      <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">
                        {data.meeting.summary}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-body text-xs text-muted-foreground">Sentiment</span>
                        <Progress value={data.meeting.sentiment_score} className="flex-1 h-2" />
                        <span className="font-mono text-sm text-[hsl(var(--success))] font-bold">
                          {data.meeting.sentiment_score}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="text-center p-3 rounded-xl bg-muted/20">
                          <p className="font-display font-extrabold text-2xl text-foreground">{data.tasks.length}</p>
                          <p className="font-body text-xs text-muted-foreground">Tâches</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-muted/20">
                          <p className="font-display font-extrabold text-2xl text-foreground">{data.decisions.length}</p>
                          <p className="font-body text-xs text-muted-foreground">Décisions</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-muted/20">
                          <p className="font-display font-extrabold text-2xl text-foreground">{data.contacts.length}</p>
                          <p className="font-body text-xs text-muted-foreground">Contacts</p>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="taches">
                    <Card className="p-4 space-y-2">
                      {data.tasks.map((t) => (
                        <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                          checkedTasks.has(t.id) ? "bg-success-d/30 opacity-60" : "bg-muted/10 hover:bg-muted/20"
                        }`}>
                          <button
                            onClick={() => toggleTask(t.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                              checkedTasks.has(t.id) ? "bg-[hsl(var(--success))] border-[hsl(var(--success))]" : "border-border"
                            }`}
                          >
                            {checkedTasks.has(t.id) && <span className="text-white text-xs">✓</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`font-body text-sm ${checkedTasks.has(t.id) ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {t.title}
                            </p>
                            {t.assignee && <p className="font-body text-xs text-muted-foreground">👤 {t.assignee}</p>}
                          </div>
                          <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[t.priority] || ""}`}>
                            {t.priority}
                          </Badge>
                        </div>
                      ))}
                      <p className="text-center font-body text-xs text-muted-foreground pt-2">
                        ✨ Ces tâches ont été extraites automatiquement de la transcription
                      </p>
                    </Card>
                  </TabsContent>

                  <TabsContent value="decisions">
                    <Card className="p-4 space-y-3">
                      {data.decisions.map((d, i) => (
                        <div key={d.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/10">
                          <span className="text-lg shrink-0">🎯</span>
                          <p className="font-body text-sm text-foreground">{d.content}</p>
                        </div>
                      ))}
                    </Card>
                  </TabsContent>

                  <TabsContent value="contacts">
                    <Card className="p-4 space-y-3">
                      {data.contacts.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/10">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-display font-bold text-sm text-primary">
                              {c.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-display font-medium text-sm text-foreground">{c.name}</p>
                              <p className="font-body text-xs text-muted-foreground">{c.company}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={c.score} className="w-16 h-1.5" />
                            <span className="font-mono text-xs text-foreground">{c.score}%</span>
                          </div>
                        </div>
                      ))}
                      <p className="text-center font-body text-xs text-muted-foreground pt-2">
                        👥 Alimentez votre CRM automatiquement
                      </p>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right — CTA sidebar */}
              <div className="space-y-4">
                <Card className="p-6 border-primary/20 bg-primary/5">
                  <h3 className="font-display font-bold text-base text-foreground mb-2">
                    🚀 Essayez avec vos réunions
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mb-4">
                    3 réunions gratuites, sans carte bancaire. Résultats en moins de 3 minutes.
                  </p>
                  <button
                    onClick={() => setShowSignup(true)}
                    className="w-full bg-gradient-primary text-white font-display font-bold text-sm py-3 rounded-xl shadow-fuchsia hover:-translate-y-0.5 transition-transform"
                  >
                    Créer mon compte gratuit →
                  </button>
                  <p className="font-body text-xs text-muted-foreground text-center mt-3">
                    Déjà un compte ?{" "}
                    <button onClick={() => navigate("/connexion")} className="text-primary hover:underline">
                      Se connecter
                    </button>
                  </p>
                </Card>

                <Card className="p-5">
                  <h4 className="font-display font-bold text-sm text-foreground mb-3">📅 Préférez une démo live ?</h4>
                  <p className="font-body text-xs text-muted-foreground mb-3">
                    30 minutes avec Michael, fondateur de RapidoMeet.
                  </p>
                  <a
                    href="https://calendly.com/sncf-braindcode/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-card border border-border/30 text-foreground font-display font-bold text-xs py-2.5 rounded-xl hover:bg-muted/20 transition-colors"
                  >
                    Réserver un créneau →
                  </a>
                </Card>

                <Card className="p-5">
                  <h4 className="font-display font-bold text-sm text-foreground mb-2">Ce que vous obtenez</h4>
                  <div className="space-y-2">
                    {[
                      "Transcription FR/EN automatique",
                      "Extraction tâches & décisions",
                      "Détection contacts CRM",
                      "Distribution multi-canal",
                      "Scénarios d'automatisation",
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <span className="text-[hsl(var(--success))] text-xs">✓</span>
                        <span className="font-body text-xs text-muted-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Impossible de charger la démo.</p>
          )}
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t border-border/30 lg:hidden z-40">
        <button
          onClick={() => setShowSignup(true)}
          className="w-full bg-gradient-primary text-white font-display font-bold text-sm py-3 rounded-xl"
        >
          Essayer gratuitement — 3 réunions offertes →
        </button>
      </div>

      {/* Signup dialog */}
      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Créer un compte</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Email" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
            <Input placeholder="Mot de passe (8 car. min)" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
            <Button onClick={handleSignup} disabled={signingUp || !signupEmail || signupPassword.length < 8} className="w-full">
              {signingUp ? "Création..." : "Créer mon compte →"}
            </Button>
            <p className="text-center font-body text-xs text-muted-foreground">
              Déjà un compte ?{" "}
              <button onClick={() => { setShowSignup(false); navigate("/connexion"); }} className="text-primary hover:underline">
                Se connecter
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Demo;
