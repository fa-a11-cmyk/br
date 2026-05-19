import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useReminders } from "@/hooks/useReminders";
import { useToast } from "@/hooks/use-toast";

export function ReminderConfig({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { testConfig } = useReminders();
  const { toast } = useToast();

  const update = (key: string, value: any) => onChange({ ...config, [key]: value });

  const CHANNELS = [
    { key: "sms_enabled", label: "SMS", icon: "📱", description: "~0.008€/SMS via Twilio" },
    { key: "whatsapp_enabled", label: "WhatsApp", icon: "💬", description: "Template approuvé Meta requis" },
    { key: "voice_enabled", label: "Appel vocal", icon: "📞", description: "Message vocal automatique (TTS)" },
    { key: "email_enabled", label: "Email", icon: "✉️", description: "Via Resend (gratuit)" },
  ];

  const REMINDERS = [
    { key: "reminder_24h", label: "J-1 (la veille)", icon: "📅" },
    { key: "reminder_1h", label: "H-1 (1 heure avant)", icon: "⏰" },
    { key: "reminder_15min", label: "15min avant", icon: "🔔" },
    { key: "followup_2h", label: "Suivi 2h après", icon: "🙏" },
    { key: "followup_24h", label: "Relance J+1", icon: "📩" },
    { key: "no_show_detection", label: "Absent détecté (15min après)", icon: "😔" },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h4 className="text-sm font-semibold">Canaux de notification</h4>
        <div className="space-y-3">
          {CHANNELS.map(ch => (
            <div key={ch.key} className="flex items-center justify-between">
              <div>
                <span className="text-sm">{ch.icon} {ch.label}</span>
                <p className="text-xs text-muted-foreground">{ch.description}</p>
              </div>
              <Switch checked={!!config?.[ch.key]} onCheckedChange={v => update(ch.key, v)} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h4 className="text-sm font-semibold">Séquence automatique</h4>
        <div className="space-y-3">
          {REMINDERS.map(rem => (
            <div key={rem.key} className="flex items-center justify-between">
              <span className="text-sm">{rem.icon} {rem.label}</span>
              <Switch checked={config?.[rem.key] !== false} onCheckedChange={v => update(rem.key, v)} />
            </div>
          ))}
        </div>
      </Card>

      {config?.no_show_detection && (
        <Card className="p-4">
          <Label className="text-xs">Délai détection absent (minutes)</Label>
          <Input type="number" value={config?.no_show_delay_minutes || 15} onChange={e => update("no_show_delay_minutes", parseInt(e.target.value))} className="text-xs mt-1 h-8" />
        </Card>
      )}

      <Card className="p-4 space-y-3">
        <h4 className="text-sm font-semibold">🧪 Tester Twilio</h4>
        <Input placeholder="+33612345678" value={testPhone} onChange={e => setTestPhone(e.target.value)} className="text-xs h-8" />
        <Button size="sm" variant="outline" className="w-full text-xs" onClick={async () => {
          setTesting(true);
          try {
            const res = await testConfig(testPhone || undefined);
            setTestResult(res);
            toast({ title: "Twilio connecté ✓" });
          } catch (e: any) {
            toast({ title: "Erreur Twilio", description: e.message, variant: "destructive" });
          }
          setTesting(false);
        }}>
          {testing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "🔌"} Tester la connexion
        </Button>
        {testResult && (
          <div className="p-2 bg-green-500/10 rounded-lg text-xs space-y-1">
            <p className="text-green-700">✅ Connecté : {testResult.account_name}</p>
            <p className="text-muted-foreground">📞 {testResult.phone_number}</p>
            {testResult.test_sms_sent && <p className="text-green-600">SMS de test envoyé !</p>}
          </div>
        )}
      </Card>

      <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block">
        Configurer Twilio Console →
      </a>
    </div>
  );
}
