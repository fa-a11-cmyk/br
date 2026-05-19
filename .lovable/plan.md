

# Plan : Exécuter toutes les tâches d'audit réalisables en vibecoding

## Portée

15 tâches identifiées dans l'audit, regroupées en 6 lots. Aucune ne nécessite de secrets manquants ou de configuration manuelle.

---

## Lot 1 — Migrer `analyze-transcript` vers Lovable AI Gateway (deja fait)

L'Edge Function utilise déjà `ai.gateway.lovable.dev` avec `LOVABLE_API_KEY`. **Aucune action requise** — cette tâche est terminée.

---

## Lot 2 — Responsive mobile (navbar landing + sidebar app)

**Fichiers modifiés** : `src/components/landing/Navbar.tsx`, `src/components/app/AppSidebar.tsx`

- Navbar : corriger le menu mobile pour viewport 384px (padding, taille du logo, z-index, scroll du mega-menu)
- Sidebar : réduire les paddings sur mobile, s'assurer que les sous-menus collapsibles fonctionnent sur petits écrans
- Tester les breakpoints `sm:` existants et ajuster

---

## Lot 3 — Dashboard & Analytics avec données réelles

**Fichiers modifiés** : `src/pages/app/Dashboard.tsx`, `src/pages/app/Analytics.tsx`

- Dashboard : les KPI cards utilisent déjà `useMeetings()` — vérifier que les données mock restantes (pourcentages hardcodés) sont remplacées par des calculs réels
- Analytics : filtrer par période sélectionnée (7j/30j/90j) au lieu de tout charger — ajouter un filtre `created_at >= date` dans `fetchMeetings()`
- Billing : remplacer les valeurs hardcodées "38 Mo / 500 Mo" et "3 / 5" par des requêtes réelles ou des données du plan

---

## Lot 4 — Onboarding wizard fonctionnel

**Fichiers modifiés** : `src/pages/app/Onboarding.tsx`, `src/hooks/useOnboarding.ts`

- Câbler chaque étape à une action réelle :
  - Étape "Connecter une intégration" → naviguer vers `/app/integrations`
  - Étape "Première réunion" → naviguer vers `/app/nouvelle-reunion`
  - Étape "Configurer la charte" → naviguer vers `/app/configuration`
- Ajouter auto-complétion des étapes quand l'utilisateur réalise l'action (via `completeStep`)

---

## Lot 5 — Stripe checkout câblage complet

**Fichiers modifiés** : `src/pages/app/Billing.tsx`, `src/pages/public/Tarifs.tsx`

- La page Billing appelle déjà `create-checkout` Edge Function — vérifier que les `priceId` sont corrects
- Page Tarifs publique : ajouter des boutons "Choisir ce plan" qui redirigent vers `/app/billing?plan=starter` ou `/app/billing?plan=pro`
- Ajouter un état "Gratuit" explicite dans l'interface quand pas d'abonnement

---

## Lot 6 — Nettoyage & consolidation

### 6a. Supprimer l'usage de `useConnections` (ancien hook direct Supabase)
- `src/components/config/TabConnexions.tsx` utilise encore `useConnections` — migrer vers `useConnectionsApi`
- Supprimer ou marquer comme deprecated `src/hooks/useConnections.ts`

### 6b. Ajouter bouton "Tester la connexion" sur les intégrations
- `src/pages/app/Integrations.tsx` : ajouter un bouton "Tester" sur chaque carte connectée, appelant `testConnection()` de `useConnectionsApi`

### 6c. Session polling avec barre de progression
- `src/pages/app/NouvelleReunion.tsx` : après upload, afficher une barre de progression avec les étapes (Upload → Transcription → Analyse → Actions prêtes) en mappant le `status` retourné par le polling

### 6d. SEO meta tags
- `src/components/PageHead.tsx` : ajouter les balises Open Graph (`og:title`, `og:description`, `og:image`) dynamiquement par page
- Pages publiques clés (Index, Tarifs, Fonctionnalites) : passer des props title/description

### 6e. Blog dynamique
- `src/pages/public/Blog.tsx` : remplacer le contenu statique par une requête `supabase.from("blog_articles").select("*")` si la table existe

---

## Résumé des fichiers impactés

| Fichier | Lot |
|---|---|
| `src/components/landing/Navbar.tsx` | 2 |
| `src/components/app/AppSidebar.tsx` | 2 |
| `src/pages/app/Dashboard.tsx` | 3 |
| `src/pages/app/Analytics.tsx` | 3 |
| `src/pages/app/Billing.tsx` | 3, 5 |
| `src/pages/app/Onboarding.tsx` | 4 |
| `src/hooks/useOnboarding.ts` | 4 |
| `src/pages/public/Tarifs.tsx` | 5 |
| `src/components/config/TabConnexions.tsx` | 6a |
| `src/hooks/useConnections.ts` | 6a |
| `src/pages/app/Integrations.tsx` | 6b |
| `src/pages/app/NouvelleReunion.tsx` | 6c |
| `src/components/PageHead.tsx` | 6d |
| `src/pages/public/Blog.tsx` | 6e |

## Estimation

~14 fichiers modifiés, aucun nouveau package requis, aucun secret manquant.

