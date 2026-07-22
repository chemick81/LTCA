# LTCA — Le Trading Contrarien Academy

Plateforme SaaS de formation au trading (méthode **EPB** : Extension, Poussée, Blocage), formateur fictif **Marc**.
Reconstruction complète en remplacement de l'outil "LearnBuilder".

## Stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · shadcn-style UI (composants écrits à la main) · React Router v7 · TanStack Query · React Hook Form · Zod · Supabase JS v2 · Netlify · Lucide React · Framer Motion · `@dnd-kit/core`

## Prérequis

- Node.js ≥ 20
- Un projet Supabase (gratuit suffit pour démarrer)
- Un compte Netlify (pour le déploiement)

## Installation

```bash
npm install
cp .env.example .env
# renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env
npm run dev
```

## Base de données Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Dans l'éditeur SQL du dashboard Supabase, exécuter **dans l'ordre** :
   - `supabase/migrations/0001_init.sql` (schéma complet, triggers, RLS)
   - `supabase/migrations/0002_storage_buckets.sql` (buckets Storage + policies)
3. Récupérer `Project URL` et `anon public key` dans Project Settings → API, et les mettre dans `.env`
4. Le premier compte créé aura le rôle `STUDENT` par défaut. Pour le passer `ADMIN` :
   ```sql
   update profiles set role = 'ADMIN' where email = 'vous@exemple.com';
   ```

⚠️ **Les policies RLS livrées sont un premier jet pragmatique**, pas encore validées avec l'équipe produit
(voir section "Encore à trancher" dans le brief). Modèle actuel : les STUDENT lisent le contenu publié et
gèrent leurs propres données (progress/notes/feedback), les ADMIN ont un accès total en écriture. À auditer
avant mise en production réelle avec des données sensibles.

## Import du contenu existant (une fois)

```bash
# Nécessite SUPABASE_SERVICE_ROLE_KEY dans .env (clé service role, jamais côté client)
npm run import-course -- --input ./chemin/vers/export
```

Voir `scripts/import-course.ts` pour le détail. Les leçons 5 à 8 (sans `content_json`) sont importées
avec `published=false`, à compléter ensuite via l'Admin.

## Déploiement Netlify

1. Pousser le repo sur GitHub
2. Sur Netlify : **New site from Git** → sélectionner le repo
3. Build command et publish directory sont déjà configurés via `netlify.toml`
4. Ajouter les variables d'environnement dans Netlify (Site settings → Environment variables) :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Déployer

## Architecture

```
src/
  app/          # App.tsx, pages transverses (404)
  components/   # UI réutilisable (ui/ = primitives shadcn-style)
  features/     # Feature-first : auth, dashboard, academy, lesson, profile, admin, glossary, progress
  hooks/        # Hooks partagés (useAuth, etc.)
  layouts/      # MainLayout, Sidebar, Topbar
  lib/          # Client Supabase, utils (cn)
  providers/    # AuthProvider
  routes/       # router.tsx, gardes RequireAuth/RequireAdmin
  services/     # Services transverses (vide pour l'instant, réservé)
  stores/       # State global si besoin (vide pour l'instant, réservé)
  types/        # database.types.ts (schéma Supabase)
  utils/        # Helpers (sanitizeHtml)
```

Chaque feature suit la structure `pages/ services/ components/`.

## Lesson renderer

Le cœur du produit : `lesson_blocks.type` détermine le composant affiché via `BlockRenderer`
(`src/features/lesson/components/BlockRenderer.tsx`). **Jamais de page codée en dur pour une leçon.**

- **Tier 1 (complet)** : `content`, `video`, `quiz`, `feedback`, `flashcard`
- **Tier 2 (complet)** : `hotspot_image`, `drag_drop` (via `@dnd-kit/core`)
- **Tier 3 (V1 = lecture seule)** : `interactive_slideshow`, `ai_dialogue` — TODO documentés en V2 pour
  le moteur d'interactions/scoring et le branchement conditionnel

## Qualité

- `any` interdit (`noExplicitAny` en ESLint + TS strict)
- Composants < 250 lignes
- Logique métier dans les services/hooks, pas dans les composants
- Pas de CSS inline (Tailwind uniquement)
- HTML admin sanitisé côté client via DOMPurify avant injection (`utils/sanitizeHtml.ts`)

```bash
npm run lint
npm run build   # tsc -b && vite build
```

## Ce qui reste à faire après cette V1

- Admin : gestion des modules/leçons/blocs de contenu (l'Admin livré couvre le CRUD parcours + annonces
  uniquement — l'éditeur de blocs, plus complexe avec drag & drop de blocs, quiz builder etc., est la
  prochaine itération)
- Audit et durcissement des policies RLS
- Décider du modèle de rôles au-delà de ADMIN/STUDENT (étudiant gratuit vs premium ?)
- Décider de la reprise ou non des utilisateurs de l'ancien site
- Tests (aucun test automatisé livré en V1 — niveau de test non tranché dans le brief)
- Moteur d'interactions Tier 3 (`interactive_slideshow`, `ai_dialogue`) pour la V2
