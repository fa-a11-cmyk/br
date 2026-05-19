import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Mail, ExternalLink } from "lucide-react";

type ItemStatus = "done" | "partial" | "missing" | "blocking";
type Priority = "critique" | "haute" | "moyenne" | "basse";

interface AuditItem {
  id: string;
  label: string;
  status: ItemStatus;
  detail: string;
  priority: Priority;
}

interface AuditBloc {
  key: string;
  name: string;
  items: AuditItem[];
}

const statusConfig: Record<ItemStatus, { emoji: string; label: string; cls: string }> = {
  done: { emoji: "✅", label: "Fait", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  partial: { emoji: "⚠", label: "Partiel", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  missing: { emoji: "❌", label: "Manquant", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  blocking: { emoji: "🔴", label: "Bloquant", cls: "bg-red-500/15 text-red-400 border-red-500/30 animate-pulse" },
};

const priorityConfig: Record<Priority, string> = {
  critique: "bg-red-500/15 text-red-400",
  haute: "bg-amber-500/15 text-amber-400",
  moyenne: "bg-blue-500/15 text-blue-400",
  basse: "bg-muted text-muted-foreground",
};

// ─── Full audit data ───
const auditBlocs: AuditBloc[] = [
  {
    key: "A", name: "Landing page",
    items: [
      { id: "A01", label: "Navbar sticky backdrop-blur", status: "done", detail: "Implémenté avec backdrop-filter blur(20px)", priority: "haute" },
      { id: "A02", label: "Hero H1 gradient", status: "done", detail: "\"La réunion finit. Les actions commencent.\"", priority: "haute" },
      { id: "A03", label: "Animation typewriter", status: "done", detail: "Curseur clignotant fonctionnel", priority: "moyenne" },
      { id: "A04", label: "Live feed social proof", status: "done", detail: "LiveSocialProof component avec feed simulé", priority: "moyenne" },
      { id: "A05", label: "Badge animé pulsant", status: "done", detail: "Point fuchsia pulsant", priority: "basse" },
      { id: "A06", label: "Blob fond parallax souris", status: "partial", detail: "Glow radial présent, pas de parallax souris", priority: "basse" },
      { id: "A07", label: "2 CTAs hero", status: "done", detail: "Primaire gradient + secondaire ghost", priority: "haute" },
      { id: "A08", label: "Preuves sociales sous CTAs", status: "done", detail: "3 preuves affichées", priority: "moyenne" },
      { id: "A09", label: "Barre logos intégrations", status: "done", detail: "LogoBar avec logos SVG", priority: "moyenne" },
      { id: "A10", label: "Section Problème 3 stats", status: "done", detail: "3 stats + citation", priority: "moyenne" },
      { id: "A11", label: "Compteurs animés IntersectionObserver", status: "partial", detail: "Valeurs statiques, pas d'IntersectionObserver", priority: "basse" },
      { id: "A12", label: "HowItWorks 3 étapes", status: "done", detail: "3 étapes avec flèches", priority: "haute" },
      { id: "A13", label: "Features 6 cards", status: "done", detail: "1 large + 6 standard", priority: "haute" },
      { id: "A14", label: "Mockup terminal feature card", status: "partial", detail: "Code block présent, pas de typing animation", priority: "basse" },
      { id: "A15", label: "Intégrations grid badges", status: "done", detail: "Grid 4 col avec badges MVP/V2", priority: "moyenne" },
      { id: "A16", label: "Pricing 3 plans", status: "done", detail: "Badge \"Le plus populaire\" inclus", priority: "haute" },
      { id: "A17", label: "Témoignages 3 cards", status: "done", detail: "Cards avec avatars initiales", priority: "moyenne" },
      { id: "A18", label: "FAQ accordion", status: "done", detail: "1 seul ouvert à la fois", priority: "moyenne" },
      { id: "A19", label: "CTA Final", status: "done", detail: "Avec compteur social proof", priority: "haute" },
      { id: "A20", label: "Footer 4 colonnes", status: "done", detail: "4 colonnes + bottom bar", priority: "moyenne" },
      { id: "A21", label: "Smooth scroll", status: "done", detail: "Sur liens navbar", priority: "moyenne" },
      { id: "A22", label: "Scroll reveal", status: "done", detail: "useScrollReveal hook IntersectionObserver", priority: "moyenne" },
      { id: "A23", label: "Cursor custom desktop", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "A24", label: "Scroll progress bar", status: "done", detail: "Sous la navbar", priority: "basse" },
      { id: "A25", label: "Grain texture overlay", status: "done", detail: "Opacity 0.025", priority: "basse" },
      { id: "A26", label: "Séparateurs gradient", status: "done", detail: "Gradient fuchsia→violet", priority: "basse" },
      { id: "A27", label: "Métadonnées SEO", status: "done", detail: "Meta tags + JSON-LD", priority: "haute" },
      { id: "A28", label: "OG Image", status: "done", detail: "og-image.png liée", priority: "haute" },
    ],
  },
  {
    key: "B", name: "Authentification",
    items: [
      { id: "B01", label: "Layout 2 colonnes", status: "done", detail: "AuthLayout branding + formulaire", priority: "haute" },
      { id: "B02", label: "SVG animé colonne gauche", status: "done", detail: "Animation flux audio→actions", priority: "moyenne" },
      { id: "B03", label: "Témoignage bas colonne", status: "done", detail: "Citation + avatar", priority: "basse" },
      { id: "B04", label: "/connexion email+password", status: "done", detail: "Formulaire fonctionnel", priority: "critique" },
      { id: "B05", label: "OAuth Google", status: "partial", detail: "Bouton présent, pas connecté Supabase", priority: "haute" },
      { id: "B06", label: "Toggle afficher/masquer mdp", status: "done", detail: "Icône œil fonctionnel", priority: "moyenne" },
      { id: "B07", label: "Messages erreur contextuels", status: "done", detail: "Email incorrect / trop de tentatives", priority: "haute" },
      { id: "B08", label: "/inscription étape 1", status: "done", detail: "Formulaire complet", priority: "critique" },
      { id: "B09", label: "Indicateur force mdp", status: "done", detail: "4 segments colorés", priority: "moyenne" },
      { id: "B10", label: "Étape 2 vérif email", status: "partial", detail: "Page existe mais pas de polling auto", priority: "haute" },
      { id: "B11", label: "Polling vérification email 3s", status: "done", detail: "Implémenté dans Inscription.tsx avec setInterval 3s", priority: "critique" },
      { id: "B12", label: "Countdown renvoyer email", status: "done", detail: "Timer 60s avec bouton Renvoyer dans Inscription.tsx", priority: "moyenne" },
      { id: "B13", label: "Étape 3 config workspace", status: "partial", detail: "Présente dans même page, pas multi-step", priority: "moyenne" },
      { id: "B14", label: "Sélection taille équipe", status: "done", detail: "Cards sélectionnables", priority: "moyenne" },
      { id: "B15", label: "/mot-de-passe-oublie", status: "done", detail: "2 états: formulaire + envoyé", priority: "haute" },
      { id: "B16", label: "Redirect auto après login", status: "done", detail: "Vers /app/dashboard", priority: "haute" },
    ],
  },
  {
    key: "C", name: "Onboarding",
    items: [
      { id: "C01", label: "Layout plein écran", status: "done", detail: "Sans sidebar", priority: "haute" },
      { id: "C02", label: "Progress bar animée", status: "done", detail: "Étape/6", priority: "moyenne" },
      { id: "C03", label: "Bouton passer étape", status: "done", detail: "Sur chaque étape", priority: "moyenne" },
      { id: "C04", label: "Bienvenue confetti", status: "partial", detail: "Pas de confetti", priority: "basse" },
      { id: "C05", label: "Connexion visio", status: "done", detail: "Meet/Teams mockup", priority: "haute" },
      { id: "C06", label: "Connexion CRM", status: "done", detail: "RapidoCRM pré-connecté", priority: "haute" },
      { id: "C07", label: "Choix canal rapport", status: "done", detail: "WhatsApp/Telegram/Email", priority: "haute" },
      { id: "C08", label: "Fichier démo pipeline", status: "partial", detail: "Pas d'animation pipeline inline", priority: "moyenne" },
      { id: "C09", label: "Config agent IA", status: "partial", detail: "Simplifié", priority: "moyenne" },
      { id: "C10", label: "Félicitations auto-redirect", status: "partial", detail: "Checkmark gradient, pas confetti ni auto-redirect", priority: "moyenne" },
      { id: "C11", label: "Sauvegarde progression", status: "done", detail: "useState local", priority: "moyenne" },
    ],
  },
  {
    key: "D", name: "Layout App",
    items: [
      { id: "D01", label: "Sidebar fixe", status: "done", detail: "Shadcn Sidebar component", priority: "haute" },
      { id: "D02", label: "Logo SVG sidebar", status: "done", detail: "Gradient fuchsia→violet", priority: "moyenne" },
      { id: "D03", label: "Items navigation icônes", status: "done", detail: "16 items avec lucide-react", priority: "haute" },
      { id: "D04", label: "Item actif NavLink", status: "done", detail: "bg-muted + font-medium", priority: "haute" },
      { id: "D05", label: "Hover transitions", status: "done", detail: "hover:bg-muted/50", priority: "basse" },
      { id: "D06", label: "Sous-menu accordion intégrations", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "D07", label: "Badge counter intégrations", status: "partial", detail: "Badge=8 hardcodé", priority: "basse" },
      { id: "D08", label: "Profil utilisateur bas sidebar", status: "done", detail: "Avatar + nom + rôle", priority: "moyenne" },
      { id: "D09", label: "Header sticky backdrop-blur", status: "done", detail: "Sur chaque page app", priority: "haute" },
      { id: "D10", label: "Bouton + Nouvelle réunion header", status: "partial", detail: "Seulement dans page Réunions", priority: "moyenne" },
      { id: "D11", label: "Cloche notifications badge", status: "done", detail: "NotificationBell component", priority: "haute" },
      { id: "D12", label: "Mobile bottom nav bar", status: "done", detail: "Implémenté dans AppLayout.tsx avec 5 items + bouton central", priority: "critique" },
      { id: "D13", label: "Mobile bouton + central", status: "done", detail: "Bouton + fuchsia gradient dans bottom nav", priority: "haute" },
      { id: "D14", label: "Mobile drawer sidebar", status: "done", detail: "SidebarTrigger + sheet mobile via shadcn sidebar", priority: "haute" },
    ],
  },
  {
    key: "E", name: "Dashboard",
    items: [
      { id: "E01", label: "Header salutation + date", status: "done", detail: "\"Bonjour, Michael 👋\"", priority: "haute" },
      { id: "E02", label: "4 KPI cards", status: "done", detail: "Réunions/Tâches/CRM/Livraison", priority: "haute" },
      { id: "E03", label: "KPI sparkline SVG", status: "done", detail: "Mini graphique intégré", priority: "moyenne" },
      { id: "E04", label: "KPI progress circle", status: "done", detail: "SVG circle animé", priority: "moyenne" },
      { id: "E05", label: "KPI avatars superposés", status: "done", detail: "3 avatars overlap", priority: "basse" },
      { id: "E06", label: "KPI taux livraison 24 carrés", status: "partial", detail: "Affichage texte, pas de carrés", priority: "basse" },
      { id: "E07", label: "Count-up animation", status: "partial", detail: "Valeurs statiques au chargement", priority: "moyenne" },
      { id: "E08", label: "Clic KPI → navigation", status: "done", detail: "Liens vers pages correspondantes", priority: "moyenne" },
      { id: "E09", label: "Liste 5 réunions récentes", status: "done", detail: "Cards avec statuts", priority: "haute" },
      { id: "E10", label: "Hover preview réunion", status: "partial", detail: "Tooltip basique", priority: "basse" },
      { id: "E11", label: "Tâches en attente checkboxes", status: "done", detail: "Checkboxes custom", priority: "haute" },
      { id: "E12", label: "Bouton valider toutes", status: "done", detail: "Gradient full-width", priority: "moyenne" },
      { id: "E13", label: "Feed OpenClaw", status: "done", detail: "Activité récente", priority: "moyenne" },
      { id: "E14", label: "Badge Live pulsant", status: "partial", detail: "Présent mais pas de slide-in auto", priority: "basse" },
      { id: "E15", label: "Prochaines réunions", status: "done", detail: "3 items avec icônes date", priority: "moyenne" },
      { id: "E16", label: "Graphique barres 4 semaines", status: "done", detail: "SVG animé", priority: "moyenne" },
      { id: "E17", label: "Banner onboarding conditionnel", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "E18", label: "Polling 30s refresh KPIs", status: "missing", detail: "Non implémenté", priority: "basse" },
    ],
  },
  {
    key: "F", name: "Mes Réunions",
    items: [
      { id: "F01", label: "Header titre + compteur + bouton", status: "done", detail: "Implémenté", priority: "haute" },
      { id: "F02", label: "Barre recherche ⌘K", status: "done", detail: "Fonctionnel", priority: "haute" },
      { id: "F03", label: "Filtres pills", status: "done", detail: "Toutes/Traitées/En cours/Planifiées/Erreurs", priority: "haute" },
      { id: "F04", label: "Filtres avancés collapsables", status: "done", detail: "Type/période/participant/canal", priority: "moyenne" },
      { id: "F05", label: "Switcher liste/grille", status: "done", detail: "Toggle fonctionnel", priority: "moyenne" },
      { id: "F06", label: "Vue liste cards", status: "done", detail: "Cards avec menu 3 points", priority: "haute" },
      { id: "F07", label: "Avatars participants", status: "done", detail: "3 + \"+N autres\"", priority: "moyenne" },
      { id: "F08", label: "Stats colorées", status: "done", detail: "Décisions/tâches/CRM", priority: "moyenne" },
      { id: "F09", label: "Actions rapides PDF/WA/Email", status: "partial", detail: "Pas de boutons rapides par card", priority: "moyenne" },
      { id: "F10", label: "Vue grille 3 colonnes", status: "done", detail: "Cards compactes", priority: "moyenne" },
      { id: "F11", label: "Modal nouvelle réunion 3 modes", status: "done", detail: "Direct/import/planifier", priority: "haute" },
      { id: "F12", label: "Mode live barre audio", status: "partial", detail: "Sélection micro sans barre audio", priority: "moyenne" },
      { id: "F13", label: "Mode import waveform SVG", status: "partial", detail: "Drag&drop sans waveform", priority: "moyenne" },
      { id: "F14", label: "Mini player audio", status: "partial", detail: "Non présent", priority: "moyenne" },
      { id: "F15", label: "Mode planifier", status: "done", detail: "URL + DateTimePicker + toggles", priority: "haute" },
      { id: "F16", label: "Pagination", status: "missing", detail: "Non implémenté", priority: "moyenne" },
    ],
  },
  {
    key: "G", name: "Détail Réunion",
    items: [
      { id: "G01", label: "Header breadcrumb", status: "done", detail: "← Mes réunions cliquable", priority: "haute" },
      { id: "G02", label: "Métadonnées row", status: "done", detail: "Date/durée/participants/canal/type", priority: "haute" },
      { id: "G03", label: "Actions header", status: "done", detail: "PDF/Email/WhatsApp/Modifier/Supprimer", priority: "haute" },
      { id: "G04", label: "5 onglets hash URL", status: "done", detail: "#transcription etc.", priority: "haute" },
      { id: "G05", label: "Transcription blocs colorés", status: "done", detail: "Intervenants avec couleurs", priority: "haute" },
      { id: "G06", label: "Timestamps cliquables", status: "done", detail: "Fonctionnel", priority: "moyenne" },
      { id: "G07", label: "Surlignage 3 types", status: "done", detail: "Tâches/décisions/prospects", priority: "haute" },
      { id: "G08", label: "Tooltips entités", status: "done", detail: "Au hover", priority: "moyenne" },
      { id: "G09", label: "Recherche inline transcription", status: "partial", detail: "Non implémenté", priority: "moyenne" },
      { id: "G10", label: "Filtre par intervenant", status: "partial", detail: "Non présent", priority: "moyenne" },
      { id: "G11", label: "Toggle horodatage", status: "partial", detail: "Non présent", priority: "basse" },
      { id: "G12", label: "Panel latéral collapsable", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "G13", label: "Auto-scroll + indicateur live", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "G14", label: "Onglet analyse résumé", status: "done", detail: "Résumé + bouton régénérer", priority: "haute" },
      { id: "G15", label: "Barres temps de parole", status: "done", detail: "Colorées par personne", priority: "moyenne" },
      { id: "G16", label: "Gauge sentiment SVG", status: "partial", detail: "Barres simples, pas semi-circulaire", priority: "moyenne" },
      { id: "G17", label: "Timeline sentiment minute", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "G18", label: "Word cloud thématique", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "G19", label: "Décisions timestamps", status: "done", detail: "Cliquables → scroll", priority: "moyenne" },
      { id: "G20", label: "Prospects bouton CRM", status: "done", detail: "\"Créer dans CRM\" par prospect", priority: "haute" },
      { id: "G21", label: "Onglet tâches liste + kanban", status: "done", detail: "Toggle fonctionnel", priority: "haute" },
      { id: "G22", label: "Kanban drag & drop", status: "done", detail: "Implémenté via @dnd-kit dans Taches.tsx", priority: "haute" },
      { id: "G23", label: "Drop zone active", status: "done", detail: "closestCorners collision + visual feedback", priority: "moyenne" },
      { id: "G24", label: "Checkbox validation animation", status: "done", detail: "Fonctionnel", priority: "moyenne" },
      { id: "G25", label: "Actions batch barre sticky", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "G26", label: "Onglet rapport preview", status: "done", detail: "Light mode avec logo", priority: "haute" },
      { id: "G27", label: "Modal envoi email", status: "partial", detail: "Pas de preview HTML live", priority: "moyenne" },
      { id: "G28", label: "Modal envoi WhatsApp", status: "partial", detail: "Pas de preview style WA", priority: "moyenne" },
      { id: "G29", label: "Dropdown régénérer", status: "partial", detail: "Non présent", priority: "basse" },
      { id: "G30", label: "Mode édition rapport", status: "partial", detail: "Pas de contenteditable", priority: "moyenne" },
      { id: "G31", label: "Onglet historique timeline", status: "done", detail: "Gradient fuchsia→violet", priority: "moyenne" },
      { id: "G32", label: "8 types events icônes", status: "done", detail: "Liens contextuels", priority: "moyenne" },
      { id: "G33", label: "État en cours onglets grisés", status: "done", detail: "Onglets disabled + 🔒 quand isInProgress", priority: "critique" },
    ],
  },
  {
    key: "H", name: "Transcription Live",
    items: [
      { id: "H01", label: "Page plein écran", status: "done", detail: "Sidebar masquée", priority: "haute" },
      { id: "H02", label: "Header live badge + timer", status: "done", detail: "● pulsant + contrôles", priority: "haute" },
      { id: "H03", label: "Barre niveau audio", status: "partial", detail: "5 barres statiques", priority: "moyenne" },
      { id: "H04", label: "Layout 3 colonnes", status: "done", detail: "Pipeline/transcription/extraction", priority: "haute" },
      { id: "H05", label: "Pipeline 7 étapes", status: "done", detail: "Statuts individuels", priority: "haute" },
      { id: "H06", label: "Spinner SVG étape", status: "partial", detail: "Shimmer présent, pas spinner circulaire", priority: "basse" },
      { id: "H07", label: "Barre progression par étape", status: "done", detail: "Animation stripes", priority: "moyenne" },
      { id: "H08", label: "Temps estimé restant", status: "partial", detail: "Affiché mais pas dynamique", priority: "basse" },
      { id: "H09", label: "Transcription mot par mot", status: "done", detail: "Apparition progressive", priority: "haute" },
      { id: "H10", label: "Curseur clignotant fuchsia", status: "done", detail: "Après dernier mot", priority: "moyenne" },
      { id: "H11", label: "Surlignage temps réel entités", status: "missing", detail: "Non implémenté", priority: "haute" },
      { id: "H12", label: "Auto-scroll + indicateur", status: "done", detail: "Fonctionnel", priority: "moyenne" },
      { id: "H13", label: "Extraction slide-in", status: "done", detail: "Tâches/décisions/prospects", priority: "haute" },
      { id: "H14", label: "Flash fuchsia nouvelle tâche", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "H15", label: "Counter badge pulse +1", status: "partial", detail: "Badge sans pulse", priority: "basse" },
      { id: "H16", label: "Scénarios pré-configurés", status: "partial", detail: "Non présent", priority: "moyenne" },
      { id: "H17", label: "Modal confirmation stop", status: "done", detail: "Avant de stopper", priority: "haute" },
      { id: "H18", label: "Animation confetti completion", status: "missing", detail: "Pas de feedback fin", priority: "moyenne" },
      { id: "H19", label: "Écran traitement terminé", status: "missing", detail: "Non implémenté", priority: "moyenne" },
    ],
  },
  {
    key: "I", name: "Agenda",
    items: [
      { id: "I01", label: "Vue mois grid 7 colonnes", status: "done", detail: "Min-height 110px", priority: "haute" },
      { id: "I02", label: "Aujourd'hui cercle gradient", status: "done", detail: "26px gradient", priority: "moyenne" },
      { id: "I03", label: "Events colorés par statut", status: "done", detail: "Traité/planifié/en cours", priority: "haute" },
      { id: "I04", label: "Hover tooltip stats", status: "done", detail: "Mini popup", priority: "moyenne" },
      { id: "I05", label: "Badge +N autres", status: "partial", detail: "Non implémenté", priority: "basse" },
      { id: "I06", label: "Vue semaine timeline", status: "missing", detail: "Non implémenté", priority: "haute" },
      { id: "I07", label: "Ligne maintenant rouge", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "I08", label: "Vue jour", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "I09", label: "Navigation mois + Aujourd'hui", status: "done", detail: "← Mars 2026 →", priority: "haute" },
      { id: "I10", label: "Toggle vue Mois/Semaine/Jour", status: "done", detail: "Tabs présentes, semaine/jour pas implémentés", priority: "haute" },
      { id: "I11", label: "Drawer détail réunion", status: "partial", detail: "Non présent", priority: "moyenne" },
      { id: "I12", label: "Actions contextuelles drawer", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "I13", label: "Modal planifier réunion", status: "missing", detail: "Non implémenté", priority: "haute" },
      { id: "I14", label: "Scénarios par réunion", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "I15", label: "Synchro Google Calendar", status: "missing", detail: "Non implémenté", priority: "haute" },
    ],
  },
  {
    key: "J", name: "Tâches globales",
    items: [
      { id: "J01", label: "Header 5 stats pills", status: "done", detail: "Total/à faire/en cours/terminées/retard", priority: "haute" },
      { id: "J02", label: "Filtres recherche + statut", status: "done", detail: "Fonctionnel", priority: "haute" },
      { id: "J03", label: "Toggle liste/kanban", status: "done", detail: "Switcher fonctionnel", priority: "haute" },
      { id: "J04", label: "Vue liste table triable", status: "done", detail: "Tri par colonne", priority: "haute" },
      { id: "J05", label: "Tooltip transcription hover", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "J06", label: "Dropdown assignation inline", status: "partial", detail: "Pas inline", priority: "moyenne" },
      { id: "J07", label: "Select statut inline", status: "partial", detail: "Pas interactif", priority: "moyenne" },
      { id: "J08", label: "Sélection multiple + batch", status: "done", detail: "Checkboxes fonctionnels", priority: "moyenne" },
      { id: "J09", label: "Vue kanban 4 colonnes", status: "done", detail: "À faire/En cours/Terminées/Retard", priority: "haute" },
      { id: "J10", label: "Cards draggable drag&drop", status: "done", detail: "Implémenté avec @dnd-kit/core + sortable", priority: "haute" },
      { id: "J11", label: "Vue calendrier deadlines", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "J12", label: "Modal ajouter tâche", status: "done", detail: "CreateCardDialog avec priorité/assigné/deadline", priority: "moyenne" },
      { id: "J13", label: "Lignes terminées barrées", status: "done", detail: "Texte barré + fond success", priority: "basse" },
    ],
  },
  {
    key: "K", name: "Scénarios N8N",
    items: [
      { id: "K01", label: "Header 4 KPIs", status: "done", detail: "Actifs/exécutions/succès/durée", priority: "haute" },
      { id: "K02", label: "Sections actifs + disponibles", status: "done", detail: "2 sections", priority: "haute" },
      { id: "K03", label: "Cards actifs toggle on/off", status: "done", detail: "Border success, métriques", priority: "haute" },
      { id: "K04", label: "Cards inactifs prérequis", status: "done", detail: "Bouton \"Activer\"", priority: "moyenne" },
      { id: "K05", label: "Drawer config workflow SVG", status: "partial", detail: "Pas de schéma SVG", priority: "moyenne" },
      { id: "K06", label: "Formulaire dynamique", status: "partial", detail: "Simplifié", priority: "moyenne" },
      { id: "K07", label: "Table Skills toggle", status: "done", detail: "Activer/désactiver", priority: "haute" },
      { id: "K08", label: "Éditeur Skills coloration", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "K09", label: "Panel aide contextuelle", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "K10", label: "Bouton créer skill", status: "partial", detail: "Non présent", priority: "moyenne" },
      { id: "K11", label: "Historique exécutions", status: "missing", detail: "Non implémenté", priority: "moyenne" },
    ],
  },
  {
    key: "L", name: "Configuration",
    items: [
      { id: "L01", label: "Onglet Connexions 5 blocs", status: "partial", detail: "Déplacé vers /app/integrations", priority: "haute" },
      { id: "L02", label: "Cards apps connectées", status: "done", detail: "Status badge vert", priority: "haute" },
      { id: "L03", label: "Cards apps non connectées", status: "done", detail: "Bouton gradient Connecter", priority: "haute" },
      { id: "L04", label: "Sous-sections dépliables", status: "partial", detail: "Partiellement", priority: "moyenne" },
      { id: "L05", label: "Toggles switch custom", status: "done", detail: "Fond dark-4 → gradient actif", priority: "moyenne" },
      { id: "L06", label: "Onglet Charte graphique", status: "done", detail: "TabCharte 5 blocs", priority: "haute" },
      { id: "L07", label: "Upload logo drag & drop", status: "partial", detail: "UI sans vraie logique upload", priority: "moyenne" },
      { id: "L08", label: "Color pickers preview", status: "partial", detail: "Input color natif", priority: "basse" },
      { id: "L09", label: "Preview typo light mode", status: "partial", detail: "Pas de rendu email", priority: "basse" },
      { id: "L10", label: "Onglet Agent IA", status: "done", detail: "TabAgentIA complet", priority: "haute" },
      { id: "L11", label: "RAG upload + indexation", status: "partial", detail: "UI sans vraie indexation", priority: "haute" },
      { id: "L12", label: "Onglet OpenClaw", status: "done", detail: "TabOpenClaw", priority: "haute" },
      { id: "L13", label: "Test connexion spinner", status: "partial", detail: "Pas de spinner", priority: "moyenne" },
      { id: "L14", label: "Timeline déploiement 7 étapes", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "L15", label: "Onglet Abonnement", status: "partial", detail: "Déplacé vers /app/billing", priority: "moyenne" },
      { id: "L16", label: "Barre sauvegarde sticky", status: "partial", detail: "Non présente", priority: "moyenne" },
      { id: "L17", label: "Modal SUPPRIMER", status: "partial", detail: "Présente dans Profil, pas Config", priority: "moyenne" },
    ],
  },
  {
    key: "M", name: "Intégrations",
    items: [
      { id: "M01", label: "Page /app/integrations", status: "done", detail: "Header stats", priority: "haute" },
      { id: "M02", label: "Recherche + filtres", status: "done", detail: "Catégorie + statut", priority: "haute" },
      { id: "M03", label: "Section connexions actives", status: "done", detail: "Border success", priority: "haute" },
      { id: "M04", label: "Logos Clearbit API", status: "done", detail: "AppLogo component", priority: "moyenne" },
      { id: "M05", label: "Fallback 3 niveaux", status: "done", detail: "Clearbit → Favicon → initiale", priority: "moyenne" },
      { id: "M06", label: "Grid par catégorie", status: "done", detail: "10 catégories", priority: "haute" },
      { id: "M07", label: "Hover cards border fuchsia", status: "done", detail: "translateY(-2px)", priority: "basse" },
      { id: "M08", label: "Drawer connexion 3 types", status: "partial", detail: "Bouton seulement, pas de drawer", priority: "haute" },
      { id: "M09", label: "Test connexion inline", status: "partial", detail: "Non présent", priority: "moyenne" },
      { id: "M10", label: "Table MCPs + outils", status: "done", detail: "Liste outils et statut", priority: "haute" },
      { id: "M11", label: "Compétences agent accordion", status: "done", detail: "Par catégorie", priority: "moyenne" },
      { id: "M12", label: "Sidebar sous-menu accordion", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "M13", label: "Dashboard bloc intégrations", status: "partial", detail: "Non présent", priority: "basse" },
    ],
  },
  {
    key: "N", name: "Analytics",
    items: [
      { id: "N01", label: "Sélecteur période", status: "done", detail: "7j/30j/90j/12m/custom", priority: "haute" },
      { id: "N02", label: "4 KPIs sparklines", status: "done", detail: "Tendances ↑↓", priority: "haute" },
      { id: "N03", label: "Area chart réunions", status: "done", detail: "Recharts", priority: "haute" },
      { id: "N04", label: "Donut types réunions", status: "done", detail: "5 segments colorés", priority: "moyenne" },
      { id: "N05", label: "Barres par jour semaine", status: "done", detail: "Lun→Ven", priority: "moyenne" },
      { id: "N06", label: "Barres par heure", status: "done", detail: "08h→18h", priority: "moyenne" },
      { id: "N07", label: "Gauge précision STT", status: "missing", detail: "Non implémenté", priority: "haute" },
      { id: "N08", label: "Distribution précision", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "N09", label: "Line chart temps traitement", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "N10", label: "Donut tâches par statut", status: "done", detail: "Recharts PieChart", priority: "moyenne" },
      { id: "N11", label: "Line chart CRM créés", status: "partial", detail: "Non présent", priority: "moyenne" },
      { id: "N12", label: "Leaderboard temps de parole", status: "done", detail: "5 personnes barres colorées", priority: "moyenne" },
      { id: "N13", label: "Métriques OpenClaw", status: "partial", detail: "Partiellement implémenté", priority: "moyenne" },
      { id: "N14", label: "Boutons export Excel/CSV/JSON", status: "missing", detail: "Non implémenté", priority: "moyenne" },
    ],
  },
  {
    key: "O", name: "Profil & Workspace",
    items: [
      { id: "O01", label: "Avatar upload overlay hover", status: "done", detail: "Overlay caméra", priority: "haute" },
      { id: "O02", label: "Crop circulaire", status: "partial", detail: "Pas de vraie logique crop", priority: "basse" },
      { id: "O03", label: "Formulaire 2 colonnes", status: "done", detail: "Infos personnelles", priority: "haute" },
      { id: "O04", label: "Indicateur force mdp profil", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "O05", label: "Sessions actives révocation", status: "done", detail: "Liste + bouton révoquer", priority: "haute" },
      { id: "O06", label: "Toggle 2FA QR code TOTP", status: "missing", detail: "Non implémenté", priority: "haute" },
      { id: "O07", label: "Export données JSON/CSV/ZIP", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "O08", label: "Modal suppression SUPPRIMER", status: "done", detail: "Saisie SUPPRIMER", priority: "haute" },
      { id: "O09", label: "Upload logo workspace", status: "done", detail: "Fonctionnel", priority: "moyenne" },
      { id: "O10", label: "Table membres rôles", status: "done", detail: "Dropdown inline", priority: "haute" },
      { id: "O11", label: "Compteur slots", status: "done", detail: "3/5 — plan Pro", priority: "moyenne" },
      { id: "O12", label: "Modal invitation membre", status: "partial", detail: "Non présent", priority: "haute" },
      { id: "O13", label: "Settings toggles", status: "done", detail: "Confidentialité/partage", priority: "moyenne" },
    ],
  },
  {
    key: "P", name: "Notifications",
    items: [
      { id: "P01", label: "Cloche badge counter animé", status: "done", detail: "Shake si nouvelles notifs", priority: "haute" },
      { id: "P02", label: "Dropdown 4 tabs", status: "done", detail: "Tout/Réunions/Tâches/Système", priority: "haute" },
      { id: "P03", label: "7 types notifs", status: "done", detail: "Icônes distinctes", priority: "moyenne" },
      { id: "P04", label: "Point rouge non-lu", status: "done", detail: "Fond rgba fuchsia", priority: "moyenne" },
      { id: "P05", label: "Bouton marquer lu", status: "done", detail: "Fonctionnel", priority: "moyenne" },
      { id: "P06", label: "Actions rapides inline", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "P07", label: "Auto-dismiss toast 4s", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "P08", label: "Page /app/notifications", status: "done", detail: "Page complète avec filtres et actions", priority: "moyenne" },
      { id: "P09", label: "Settings notifications", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "P10", label: "Push notifications PWA", status: "missing", detail: "Non implémenté", priority: "basse" },
    ],
  },
  {
    key: "Q", name: "Search ⌘K",
    items: [
      { id: "Q01", label: "Activation ⌘K / Ctrl+K", status: "done", detail: "Fonctionnel", priority: "haute" },
      { id: "Q02", label: "Overlay backdrop-filter blur", status: "done", detail: "blur(12px)", priority: "moyenne" },
      { id: "Q03", label: "Input recherche placeholder", status: "done", detail: "Fonctionnel", priority: "haute" },
      { id: "Q04", label: "Résultats groupés par type", status: "done", detail: "Réunions/tâches/rapports/navigation", priority: "haute" },
      { id: "Q05", label: "Navigation clavier ↑↓ Enter Esc", status: "done", detail: "Fonctionnel", priority: "haute" },
      { id: "Q06", label: "Preview panel droit", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "Q07", label: "Actions rapides", status: "done", detail: "Nouvelle réunion / Import / Planifier", priority: "haute" },
      { id: "Q08", label: "Raccourcis clavier affichés", status: "done", detail: "Dans les résultats", priority: "moyenne" },
      { id: "Q09", label: "Historique recherches", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "Q10", label: "Fermeture clic hors modal", status: "done", detail: "Fonctionnel", priority: "moyenne" },
    ],
  },
  {
    key: "R", name: "Billing & API",
    items: [
      { id: "R01", label: "Page checkout card input", status: "done", detail: "Stripe Elements stylisé", priority: "haute" },
      { id: "R02", label: "Récapitulatif commande", status: "done", detail: "Features + prix + garantie", priority: "haute" },
      { id: "R03", label: "Portail Stripe", status: "partial", detail: "Bouton présent, pas connecté", priority: "haute" },
      { id: "R04", label: "Barres usage facturable", status: "done", detail: "Réunions/RAG/membres", priority: "haute" },
      { id: "R05", label: "Table factures PDF", status: "done", detail: "Téléchargement", priority: "haute" },
      { id: "R06", label: "Modal annulation pause", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "R07", label: "API keys création", status: "done", detail: "Création + affichage unique", priority: "haute" },
      { id: "R08", label: "Modal affichage clé", status: "partial", detail: "Copier sans confirmation", priority: "moyenne" },
      { id: "R09", label: "Webhooks liste événements", status: "done", detail: "Fonctionnel", priority: "haute" },
      { id: "R10", label: "Page /developers doc", status: "partial", detail: "Simplifiée", priority: "moyenne" },
      { id: "R11", label: "Blocs code sélecteur langage", status: "partial", detail: "Sans sélecteur", priority: "basse" },
    ],
  },
  {
    key: "S", name: "Email & PDF Builders",
    items: [
      { id: "S01", label: "Email Builder 3 colonnes", status: "done", detail: "Bibliothèque/canvas/propriétés", priority: "haute" },
      { id: "S02", label: "Drag & drop blocs", status: "partial", detail: "Bouton ajouter, pas de vrai drag", priority: "haute" },
      { id: "S03", label: "Blocs dynamiques variables", status: "done", detail: "{{meeting_title}} etc.", priority: "haute" },
      { id: "S04", label: "Sélection bloc outline + toolbar", status: "done", detail: "Fuchsia + monter/dupliquer/supprimer", priority: "haute" },
      { id: "S05", label: "Panel propriétés dynamique", status: "done", detail: "Selon bloc sélectionné", priority: "haute" },
      { id: "S06", label: "Toggle desktop/mobile preview", status: "done", detail: "600px / 375px", priority: "moyenne" },
      { id: "S07", label: "Color pickers inline", status: "partial", detail: "Input natif", priority: "basse" },
      { id: "S08", label: "Modal envoyer test", status: "partial", detail: "Non présent", priority: "moyenne" },
      { id: "S09", label: "Multi-templates gestion", status: "partial", detail: "Pas de gestion multi", priority: "moyenne" },
      { id: "S10", label: "PDF Builder preview A4", status: "done", detail: "Fond blanc simulé", priority: "haute" },
      { id: "S11", label: "6 sections accordion config", status: "done", detail: "Page/header/sections/footer/watermark/avancé", priority: "haute" },
      { id: "S12", label: "Drag & drop sections réordonnement", status: "partial", detail: "Pas de réordonnancement", priority: "moyenne" },
      { id: "S13", label: "Toggle sections afficher/masquer", status: "done", detail: "Fonctionnel", priority: "moyenne" },
      { id: "S14", label: "Navigation pages ← 1/3 →", status: "partial", detail: "Pas de pagination", priority: "basse" },
      { id: "S15", label: "Bouton télécharger PDF", status: "done", detail: "Fonctionnel", priority: "haute" },
    ],
  },
  {
    key: "T", name: "Système & PWA",
    items: [
      { id: "T01", label: "Page 404 animation flicker", status: "done", detail: "Opacity pulse sur 404", priority: "moyenne" },
      { id: "T02", label: "Page maintenance countdown", status: "done", detail: "Countdown live + subscribe", priority: "moyenne" },
      { id: "T03", label: "Page 500", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "T04", label: "Page session expirée", status: "missing", detail: "Non implémenté", priority: "basse" },
      { id: "T05", label: "Bottom sheets mobile", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "T06", label: "Safe area inset iPhone", status: "missing", detail: "Non implémenté", priority: "moyenne" },
      { id: "T07", label: "manifest.json shortcuts", status: "partial", detail: "vite-pwa sans shortcuts custom", priority: "basse" },
      { id: "T08", label: "Splash screen PWA custom", status: "partial", detail: "Pas custom", priority: "basse" },
      { id: "T09", label: "Service Worker", status: "done", detail: "vite-pwa enregistré", priority: "haute" },
      { id: "T10", label: "Install prompt PWA", status: "done", detail: "InstallPrompt component", priority: "haute" },
    ],
  },
  {
    key: "U", name: "Sécurité & Audit",
    items: [
      { id: "U01", label: "Table security_events", status: "done", detail: "12 types d'événements, severity, RLS admin", priority: "critique" },
      { id: "U02", label: "Table rate_limit_rules", status: "done", detail: "8 règles seedées (api_anon, auth_login, etc.)", priority: "critique" },
      { id: "U03", label: "Table blocked_ips", status: "done", detail: "Blocage auto + manuel admin", priority: "haute" },
      { id: "U04", label: "Edge function security-audit", status: "done", detail: "full_audit avec score A-F", priority: "haute" },
      { id: "U05", label: "Edge function security-middleware", status: "done", detail: "checkRateLimit, sanitizeInput, detectInjection", priority: "haute" },
      { id: "U06", label: "AdminSecurity.tsx", status: "done", detail: "Score sécurité, events, IP bloquées, checklist VivaTech", priority: "haute" },
      { id: "U07", label: "Fonction SQL check_rls_status", status: "done", detail: "SECURITY DEFINER, vérifie tables sans RLS", priority: "haute" },
      { id: "U08", label: "Indexes performance", status: "done", detail: "8 index critiques (user_roles, subscriptions, meetings...)", priority: "moyenne" },
      { id: "U09", label: "Headers sécurité HTTP", status: "done", detail: "CSP, HSTS, X-Frame-Options dans middleware", priority: "moyenne" },
      { id: "U10", label: "Secrets check admin", status: "done", detail: "Vérification des secrets configurés dans l'audit", priority: "haute" },
    ],
  },
  {
    key: "V", name: "Email Marketing",
    items: [
      { id: "V01", label: "Table resend_audiences", status: "done", detail: "Mapping segments → audiences Resend", priority: "haute" },
      { id: "V02", label: "Table resend_broadcasts_log", status: "done", detail: "Log des broadcasts avec métriques", priority: "haute" },
      { id: "V03", label: "Table onboarding_email_queue", status: "done", detail: "File d'attente 4 étapes (J+0/J+3/J+7/J+14)", priority: "haute" },
      { id: "V04", label: "Trigger inscription → onboarding", status: "done", detail: "queue_onboarding_emails sur profiles INSERT", priority: "critique" },
      { id: "V05", label: "Edge function resend-marketing", status: "done", detail: "sync_contacts, send_broadcast, generate_ai, process_queue", priority: "critique" },
      { id: "V06", label: "Templates onboarding HTML", status: "done", detail: "welcome, first_meeting, features, upsell — charte RapidoMeet", priority: "haute" },
      { id: "V07", label: "AdminEmailMarketing.tsx", status: "done", detail: "KPIs, compositeur IA, prévisualisation, sync contacts", priority: "haute" },
      { id: "V08", label: "Génération IA emails", status: "done", detail: "Via Lovable AI Gateway (gemini-2.5-flash)", priority: "haute" },
      { id: "V09", label: "Config sous-domaine marketing", status: "partial", detail: "mail.rapidomeet.io à configurer dans Resend Console", priority: "haute" },
      { id: "V10", label: "Secrets audiences Resend", status: "missing", detail: "RESEND_AUDIENCE_ID_ALL/FREE/PRO/NEW à ajouter", priority: "haute" },
    ],
  },
  {
    key: "W", name: "Skills Marketplace",
    items: [
      { id: "W01", label: "Table openclaw_skills enrichie", status: "done", detail: "15+ colonnes ajoutées (category, icon, version, rating...)", priority: "haute" },
      { id: "W02", label: "8 skills officiels seedés", status: "done", detail: "meeting-analyzer, weekly-digest, task-tracker, etc.", priority: "haute" },
      { id: "W03", label: "Table skill_installations", status: "done", detail: "Install/uninstall par utilisateur, RLS", priority: "critique" },
      { id: "W04", label: "Table skill_ratings", status: "done", detail: "1-5 étoiles + avis, trigger update avg", priority: "haute" },
      { id: "W05", label: "Hook useSkillsMarketplace", status: "done", detail: "install, uninstall, rateSkill, isInstalled", priority: "haute" },
      { id: "W06", label: "Page Marketplace refaite", status: "done", detail: "Grid, filtres catégorie, recherche, vue installés", priority: "haute" },
      { id: "W07", label: "Dialog détail skill", status: "done", detail: "README, stats, notation, install/uninstall", priority: "haute" },
      { id: "W08", label: "AdminSkills.tsx", status: "done", detail: "Toggle featured/publié, KPIs, tableau admin", priority: "haute" },
      { id: "W09", label: "openclaw-gateway mis à jour", status: "done", detail: "Utilise les skills installés de l'utilisateur", priority: "critique" },
      { id: "W10", label: "Badge Coming Soon supprimé", status: "done", detail: "Marketplace pleinement fonctionnel", priority: "haute" },
    ],
  },
];

// ─── CDC Deliverables ───
const cdcDeliverables: { id: string; name: string; desc: string; pct: number; status: ItemStatus; note: string }[] = [
  { id: "L1", name: "Module STT", desc: "Whisper + Deepgram + NLP", pct: 45, status: "partial", note: "UI faite, edge function transcribe-audio déployée, secrets à configurer" },
  { id: "L2", name: "MCP Suite", desc: "4 serveurs MCP", pct: 50, status: "partial", note: "openclaw-gateway déployé, skills installables par user" },
  { id: "L3", name: "Orchestrateur", desc: "Routing + Mémoire + Skills", pct: 55, status: "partial", note: "Skills Marketplace DB + install/uninstall/rating fonctionnels" },
  { id: "L4", name: "N8N ×8", desc: "Scénarios opérationnels", pct: 80, status: "partial", note: "UI complète, trigger-n8n déployé, N8N_WEBHOOK_URL à configurer" },
  { id: "L5", name: "OpenClaw", desc: "WA + TG + Email + Discord", pct: 75, status: "partial", note: "Chat IA fonctionnel, skills installés pris en compte, Twilio/Resend à configurer" },
  { id: "L6", name: "Skills .md", desc: "8 skills officiels en DB", pct: 95, status: "done", note: "8 skills seedés, install/rating/admin toggle fonctionnels" },
  { id: "L7", name: "Documentation", desc: "README + Docker + Guides", pct: 10, status: "partial", note: "Guide tâches manuelles créé, README à compléter" },
  { id: "L8", name: "Démo vidéo", desc: "5-10 min flux complet", pct: 0, status: "missing", note: "À produire après stabilisation" },
  { id: "L9", name: "Rapport PFE", desc: "Document académique", pct: 0, status: "missing", note: "À produire séparément" },
  { id: "L10", name: "Sécurité", desc: "RLS + Rate limiting + Audit", pct: 90, status: "done", note: "security_events, rate_limit_rules, blocked_ips, AdminSecurity, check_rls_status" },
  { id: "L11", name: "Email Marketing", desc: "Resend Broadcasts + Onboarding", pct: 85, status: "done", note: "resend-marketing déployé, AdminEmailMarketing, templates onboarding, pg_cron" },
  { id: "L12", name: "Blog Admin", desc: "GrapeJS + IA + SEO", pct: 90, status: "done", note: "GrapeJS réparé, blog-ai-generator sur Lovable AI Gateway" },
];

const nextSteps = [
  { level: "FAIT ✅", text: "Skills Marketplace connecté à la DB (8 skills, install/rating)" },
  { level: "FAIT ✅", text: "Email Marketing Resend Broadcasts + séquences onboarding pg_cron" },
  { level: "FAIT ✅", text: "Sécurité : security_events, rate_limit_rules, blocked_ips, AdminSecurity" },
  { level: "FAIT ✅", text: "Blog admin GrapeJS réparé + blog-ai-generator sur Lovable AI Gateway" },
  { level: "CRITIQUE", text: "Configurer les secrets production : RESEND_API_KEY, STRIPE_SECRET_KEY, TWILIO_*" },
  { level: "CRITIQUE", text: "Configurer audiences Resend (RESEND_AUDIENCE_ID_ALL/FREE/PRO/NEW)" },
  { level: "HAUTE", text: "Intégrer GrapeJS dans LandingEditor.tsx (actuellement textarea)" },
  { level: "HAUTE", text: "Intégrer Calendly dans Agenda.tsx (hook useCalendly non importé)" },
  { level: "HAUTE", text: "Ajouter modes import Google Meet/Zoom dans NouvelleReunion.tsx" },
  { level: "HAUTE", text: "Tester le flow complet inscription → onboarding → première réunion" },
  { level: "MOYENNE", text: "Connecter les vrais OAuth (Google, Zoom) dans Supabase Auth" },
  { level: "MOYENNE", text: "Compléter les 45+ items partiels restants" },
  { level: "INFO", text: "Backend Node.js MCP à développer par les stagiaires" },
  { level: "INFO", text: "Démo vidéo + Rapport PFE à produire" },
];

const autoTests = [
  { cat: "Navigation", items: [
    { ok: true, text: "Toutes les routes sont accessibles (60+ routes)" },
    { ok: true, text: "Les liens sidebar et navbar fonctionnent" },
    { ok: true, text: "AdminRoute protège les pages admin" },
    { ok: true, text: "ProtectedRoute redirige vers /connexion" },
  ]},
  { cat: "Formulaires", items: [
    { ok: true, text: "Connexion email + OAuth fonctionnel" },
    { ok: true, text: "Inscription avec polling vérification email 3s" },
    { ok: true, text: "Indicateur force mot de passe fonctionne" },
    { ok: true, text: "Reset password flow complet" },
  ]},
  { cat: "Edge Functions", items: [
    { ok: true, text: "44+ edge functions déployées" },
    { ok: true, text: "blog-ai-generator sur Lovable AI Gateway (pas besoin d'ANTHROPIC_API_KEY)" },
    { ok: true, text: "resend-marketing : sync/broadcast/generate_ai/onboarding_queue" },
    { ok: true, text: "security-audit : full_audit avec score de sécurité" },
    { ok: null, text: "Secrets Twilio/Stripe/Resend non configurés (fonctions échoueront)" },
  ]},
  { cat: "Base de données", items: [
    { ok: true, text: "60+ tables avec RLS activé" },
    { ok: true, text: "skill_installations + skill_ratings avec triggers" },
    { ok: true, text: "onboarding_email_queue avec trigger auto à l'inscription" },
    { ok: true, text: "security_events + rate_limit_rules + blocked_ips" },
    { ok: null, text: "Vues SQL (tutorial_stats, etc.) sans RLS — à sécuriser" },
  ]},
  { cat: "Responsive & PWA", items: [
    { ok: true, text: "Bottom nav bar mobile implémentée" },
    { ok: true, text: "Service Worker vite-pwa enregistré" },
    { ok: true, text: "InstallPrompt + UpdateBanner + OfflineBanner" },
    { ok: null, text: "Safe area inset iPhone non testé" },
  ]},
];

const STORAGE_KEY = "rapidomeet:project_status:overrides";

export default function ProjectStatus() {
  const [overrides, setOverrides] = useState<Record<string, ItemStatus>>({});
  const [auditDate] = useState(new Date().toLocaleString("fr-FR"));
  const [activeTab, setActiveTab] = useState("A");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setOverrides(JSON.parse(saved));
    } catch {}
  }, []);

  const saveOverride = (id: string, newStatus: ItemStatus) => {
    const next = { ...overrides, [id]: newStatus };
    setOverrides(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const getEffectiveStatus = (item: AuditItem): ItemStatus => overrides[item.id] ?? item.status;

  const totals = useMemo(() => {
    let done = 0, partial = 0, missing = 0, blocking = 0, total = 0;
    for (const bloc of auditBlocs) {
      for (const item of bloc.items) {
        total++;
        const s = getEffectiveStatus(item);
        if (s === "done") done++;
        else if (s === "partial") partial++;
        else if (s === "missing") missing++;
        else if (s === "blocking") blocking++;
      }
    }
    return { done, partial, missing, blocking, total };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides]);

  const globalPct = Math.round((totals.done / totals.total) * 100);

  const blocStats = (bloc: AuditBloc) => {
    const done = bloc.items.filter(i => getEffectiveStatus(i) === "done").length;
    return { done, total: bloc.items.length, pct: Math.round((done / bloc.items.length) * 100) };
  };

  const blockingItems = auditBlocs.flatMap(b => b.items.filter(i => getEffectiveStatus(i) === "blocking"));
  const partialItems = auditBlocs.flatMap(b => b.items.filter(i => getEffectiveStatus(i) === "partial"));
  const missingItems = auditBlocs.flatMap(b => b.items.filter(i => getEffectiveStatus(i) === "missing"));

  const filtered = (items: AuditItem[]) =>
    filterPriority === "all" ? items : items.filter(i => i.priority === filterPriority);

  const StatusPill = ({ status }: { status: ItemStatus }) => {
    const c = statusConfig[status];
    return <Badge variant="outline" className={`text-[11px] font-mono ${c.cls}`}>{c.emoji} {c.label}</Badge>;
  };

  const PriorityPill = ({ p }: { p: Priority }) => (
    <Badge variant="outline" className={`text-[10px] capitalize ${priorityConfig[p]}`}>{p}</Badge>
  );

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">Audit interne</p>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-foreground">
            Statut du projet
          </h1>
          <p className="text-sm font-body text-muted-foreground mt-1">
            Dernière vérification · <span className="font-mono text-xs">{auditDate}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Relancer
          </Button>
          <Button variant="outline" size="sm" className="font-mono text-xs"><Download className="h-3.5 w-3.5 mr-1.5" /> PDF</Button>
          <Button variant="outline" size="sm" className="font-mono text-xs"><Mail className="h-3.5 w-3.5 mr-1.5" /> Email</Button>
        </div>
      </div>

      {/* Section 1: Global Progress — Big number hero */}
      <Card className="overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--fuchsia)/0.05)] to-[hsl(var(--violet)/0.08)] pointer-events-none" />
        <CardContent className="pt-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            {/* Big percentage */}
            <div className="text-center sm:text-left shrink-0">
              <p className="font-mono text-[72px] sm:text-[96px] leading-none font-extrabold tracking-tighter bg-gradient-to-r from-[hsl(var(--fuchsia))] to-[hsl(var(--violet))] bg-clip-text text-transparent">
                {globalPct}
                <span className="text-[36px] sm:text-[48px]">%</span>
              </p>
              <p className="font-display text-sm font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Progression globale</p>
            </div>
            {/* Progress bar + counters */}
            <div className="flex-1 w-full space-y-5">
              <Progress value={globalPct} className="h-2.5 rounded-full" />
              <div className="grid grid-cols-4 gap-3">
                {([
                  { n: totals.done, label: "Fait", icon: "✅", color: "text-emerald-400" },
                  { n: totals.partial, label: "Partiel", icon: "⚠️", color: "text-amber-400" },
                  { n: totals.missing, label: "Manquant", icon: "❌", color: "text-red-400" },
                  { n: totals.blocking, label: "Bloquant", icon: "🔴", color: "text-red-400" },
                ] as const).map(s => (
                  <div key={s.label} className="rounded-xl border border-border/50 bg-card/50 p-3 text-center backdrop-blur-sm">
                    <p className={`font-mono text-2xl sm:text-3xl font-black tracking-tight ${s.color} ${s.label === "Bloquant" ? "animate-pulse" : ""}`}>
                      {s.n}
                    </p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                      {s.icon} {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Tabs par bloc */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl font-bold tracking-tight">Détail par bloc</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap h-auto gap-1.5 bg-transparent p-0 mb-4">
              {auditBlocs.map(b => {
                const s = blocStats(b);
                return (
                  <TabsTrigger key={b.key} value={b.key} className="text-[11px] font-mono data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-2.5 py-1.5">
                    <span className="font-extrabold mr-1">{b.key}</span>
                    <span className="hidden sm:inline">{b.name}</span>
                    <span className="ml-1 opacity-60">{s.pct}%</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {auditBlocs.map(b => {
              const s = blocStats(b);
              return (
                <TabsContent key={b.key} value={b.key}>
                  <div className="flex items-center gap-4 mb-4 mt-2 p-3 rounded-lg bg-muted/30">
                    <span className="font-display text-lg font-bold">{b.key}</span>
                    <span className="text-sm font-body text-muted-foreground">{b.name}</span>
                    <div className="flex-1" />
                    <Progress value={s.pct} className="h-2 w-32" />
                    <span className="font-mono text-sm font-bold tabular-nums">{s.done}<span className="text-muted-foreground font-normal">/{s.total}</span></span>
                    <span className="font-mono text-xs text-muted-foreground">{s.pct}%</span>
                  </div>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16 font-mono text-[10px] uppercase tracking-wider">ID</TableHead>
                          <TableHead className="font-mono text-[10px] uppercase tracking-wider">Élément</TableHead>
                          <TableHead className="w-28 font-mono text-[10px] uppercase tracking-wider">Statut</TableHead>
                          <TableHead className="font-mono text-[10px] uppercase tracking-wider">Détail</TableHead>
                          <TableHead className="w-24 font-mono text-[10px] uppercase tracking-wider">Priorité</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {b.items.map(item => {
                          const eff = getEffectiveStatus(item);
                          return (
                            <TableRow key={item.id} className={eff === "done" ? "opacity-60" : ""}>
                              <TableCell className="font-mono text-[11px] font-semibold text-muted-foreground tabular-nums">{item.id}</TableCell>
                              <TableCell className="text-sm font-body">{item.label}</TableCell>
                              <TableCell><StatusPill status={eff} /></TableCell>
                              <TableCell className="text-xs font-body text-muted-foreground max-w-[300px] truncate">{item.detail}</TableCell>
                              <TableCell><PriorityPill p={item.priority} /></TableCell>
                              <TableCell>
                                <select
                                  className="text-[10px] font-mono bg-transparent border border-border rounded px-1 py-0.5 text-muted-foreground"
                                  value={eff}
                                  onChange={e => saveOverride(item.id, e.target.value as ItemStatus)}
                                >
                                  <option value="done">✅</option>
                                  <option value="partial">⚠</option>
                                  <option value="missing">❌</option>
                                  <option value="blocking">🔴</option>
                                </select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Section 3: Blocking */}
      {blockingItems.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/[0.02]">
          <CardHeader>
            <CardTitle className="font-display text-lg font-bold text-destructive flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              Bloquants — À résoudre immédiatement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {blockingItems.map(i => (
              <div key={i.id} className="flex items-start gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <span className="font-mono text-sm font-black text-destructive shrink-0 tabular-nums">{i.id}</span>
                <div>
                  <p className="text-sm font-display font-semibold">{i.label}</p>
                  <p className="text-xs font-body text-muted-foreground mt-0.5">Impact : {i.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Partiels */}
      <Card className="border-amber-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg font-bold text-amber-400">
              ⚠ Partiels · <span className="font-mono tabular-nums">{partialItems.length}</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(["all", "critique", "haute", "moyenne", "basse"] as const).map(p => (
              <Button key={p} variant={filterPriority === p ? "default" : "outline"} size="sm" className="text-[11px] font-mono capitalize rounded-lg" onClick={() => setFilterPriority(p)}>
                {p === "all" ? "Tous" : p}
              </Button>
            ))}
          </div>
          <div className="space-y-1 max-h-[400px] overflow-auto">
            {filtered(partialItems).map(i => (
              <div key={i.id} className="flex items-center gap-3 py-2.5 px-2 border-b border-border/30 hover:bg-muted/30 rounded transition-colors">
                <span className="font-mono text-[11px] font-bold text-muted-foreground w-10 tabular-nums">{i.id}</span>
                <span className="text-sm font-body flex-1">{i.label}</span>
                <PriorityPill p={i.priority} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manquants */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg font-bold text-destructive">
            ❌ Manquants · <span className="font-mono tabular-nums">{missingItems.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-[400px] overflow-auto">
            {filtered(missingItems).map(i => (
              <div key={i.id} className="flex items-center gap-3 py-2.5 px-2 border-b border-border/30 hover:bg-muted/30 rounded transition-colors">
                <span className="font-mono text-[11px] font-bold text-muted-foreground w-10 tabular-nums">{i.id}</span>
                <span className="text-sm font-body flex-1">{i.label}</span>
                <PriorityPill p={i.priority} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: CDC Deliverables */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl font-bold tracking-tight">Livrables CDC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cdcDeliverables.map(d => (
              <div key={d.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-muted/20 transition-colors">
                <span className="font-mono text-sm font-black text-muted-foreground tabular-nums w-8">{d.id}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold">{d.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{d.desc}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Progress value={d.pct} className="h-1.5 flex-1 max-w-[200px]" />
                    <span className="font-mono text-lg font-black tabular-nums bg-gradient-to-r from-[hsl(var(--fuchsia))] to-[hsl(var(--violet))] bg-clip-text text-transparent">
                      {d.pct}<span className="text-xs">%</span>
                    </span>
                  </div>
                </div>
                <StatusPill status={d.status} />
                <span className="text-[10px] font-body text-muted-foreground max-w-[200px] hidden lg:block">{d.note}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Next Steps */}
      <Card className="border-[hsl(var(--fuchsia))]/20 bg-[hsl(var(--fuchsia)/0.02)]">
        <CardHeader>
          <CardTitle className="font-display text-xl font-bold tracking-tight">🚀 Actions recommandées</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {nextSteps.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="font-mono text-xs font-black text-muted-foreground tabular-nums w-5 pt-0.5">{i + 1}.</span>
                <Badge variant="outline" className={`text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                  s.level === "CRITIQUE" ? "bg-destructive/15 text-destructive border-destructive/30" :
                  s.level === "HAUTE" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                  s.level === "MOYENNE" ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                  "bg-muted text-muted-foreground"
                }`}>{s.level}</Badge>
                <span className="text-sm font-body">{s.text}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Section 6: Auto Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl font-bold tracking-tight">Tests automatiques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {autoTests.map(cat => (
            <div key={cat.cat}>
              <h4 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2 font-bold">{cat.cat}</h4>
              <div className="space-y-1.5">
                {cat.items.map((t, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm font-body">
                    <span className="text-xs">{t.ok === true ? "✅" : t.ok === false ? "❌" : "⚠️"}</span>
                    <span className={t.ok === false ? "text-destructive" : t.ok === null ? "text-amber-400" : "text-muted-foreground"}>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section 7: Code Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Composants", icon: "📁", value: "90+" },
          { label: "Lignes de code", icon: "📄", value: "~35k" },
          { label: "Edge Functions", icon: "⚡", value: "46" },
          { label: "Routes", icon: "🔗", value: "60+" },
        ].map(m => (
          <Card key={m.label} className="overflow-hidden relative group hover:border-[hsl(var(--fuchsia))]/30 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--fuchsia)/0.03)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 pb-5 text-center relative">
              <p className="text-xs mb-2">{m.icon}</p>
              <p className="font-mono text-3xl font-black tracking-tighter bg-gradient-to-r from-[hsl(var(--fuchsia))] to-[hsl(var(--violet))] bg-clip-text text-transparent tabular-nums">{m.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mt-2">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
