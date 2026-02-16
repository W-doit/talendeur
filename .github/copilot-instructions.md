# Talendeur AI Coding Agent Instructions

## Project Overview
Talendeur is a talent-matching platform connecting job seekers with organizations through a Tinder-style swipe interface. Built with React + TypeScript + Vite, using Supabase for backend/auth/storage, shadcn/ui components, and TanStack Query for data fetching.

## Architecture & Key Patterns

### Frontend Structure
- **Context-based state**: `AuthContext` manages user auth/profiles, `MatchContext` handles swipe logic
- **Layout pattern**: All pages wrapped in `MainLayout` (includes `Navbar` + `Footer`)
- **Route protection**: Pages check `user` state in `useEffect` and redirect to login/profile as needed
- **Type safety**: Dual user types (`jobseeker` | `organization`) with discriminated unions in profile types

### Component Organization
```
components/
  ├── dashboard/     # Data visualization components (Recharts)
  ├── layout/        # MainLayout, Navbar, Footer
  ├── matching/      # MatchCard (swipe UI), MatchList, MatchDetail
  ├── profile/       # Multi-step forms for job seekers and organizations
  └── ui/            # shadcn/ui components (DO NOT edit directly)
```

### Supabase Integration
- **Client**: Import from `@/integrations/supabase/client` (never instantiate new clients)
- **Auth flow**: `AuthContext` handles session, token stored in `accessToken` state
- **Storage buckets**: `profile-pictures` and `cvs` - use helpers in `src/lib/supabase-storage.ts`
- **RLS policies**: All tables use Row Level Security - users can only access their own data
- **API calls**: Dashboard components use REST API directly with `Bearer ${accessToken}` for RLS bypass

### Database Schema Conventions
- Primary profile table: `public.profile` (shared by both user types)
- User type determines which related tables are populated
- All user-specific tables reference `user_id UUID` → `public.profile(user_id)`
- Use `gen_random_uuid()` for IDs, timestamps use `TIMESTAMP WITH TIME ZONE`

## Brand & Styling

### Color System (in tailwind.config.ts)
- **Primary brand**: `talendeur-primary` (#D1163E burnt orange)
- **Accents**: `talendeur-pink`, `talendeur-orange`, `talendeur-navy`
- **Gradients**: Use `from-talendeur-primary to-talendeur-orange` for CTAs/hero sections
- **Typography**: Raleway font family (weights: 300, 400, 600, 700, 800)

### UI Component Usage
- Import from `@/components/ui/*` (shadcn components)
- Buttons: Apply gradient backgrounds for primary actions
- Cards: Use `rounded-xl shadow-xl` with hover effects
- Forms: Combine `react-hook-form` + `zod` validation

## Development Workflows

### Running the App
```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint check
```

### Path Aliases
- `@/` → `src/` (configured in vite.config.ts and tsconfig)
- Always use alias imports: `import { supabase } from '@/integrations/supabase/client'`

### Environment Variables
Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Dashboard Setup
When adding dashboard features:
1. Check `database/DASHBOARD_SETUP_GUIDE.md` for schema patterns
2. New tables need RLS policies (see `database/esg-volunteering-schema.sql` examples)
3. Dashboard components fetch via REST API with access token for auth

## Critical Gotchas

1. **Never edit `src/components/ui/*`**: These are managed by shadcn CLI
2. **Supabase client singleton**: Always import existing client, don't create new instances
3. **User type checks**: Use `'skills' in profile` to discriminate JobSeeker vs Organization
4. **Profile flow**: Users must complete profile before accessing matching features
5. **PDF handling**: CV uploads require `application/pdf` type, 10MB max (enforced in `supabase-storage.ts`)
6. **Mock data**: `MatchContext` currently uses mock data - check before implementing real Supabase queries
7. **LinkedIn OAuth**: Integration exists but requires `VITE_LINKEDIN_CLIENT_ID` env var
8. **Data science files**: `data_science_NURIA/` contains Python analysis - separate from app

## Testing & Debugging

### Common Issues
- **Supabase errors**: Check console for RLS policy violations (403 errors)
- **Image loading**: Profile pics/logos stored in Supabase storage - verify bucket policies
- **Auth loops**: Ensure `loadUserProfile` in AuthContext completes before rendering routes
- **Type mismatches**: Profile types are complex unions - use type guards

### Database Queries
- Test queries in Supabase SQL Editor before implementing in code
- Use `select=*` syntax for REST API calls
- Auth header format: `Authorization: Bearer ${accessToken}`

## Code Conventions

### Import Order (observed pattern)
1. React imports
2. External libraries (UI, routing, etc.)
3. Context/hooks (`@/contexts`, `@/hooks`)
4. Components (`@/components`)
5. Lib utilities (`@/lib`)
6. Types

### Naming
- Components: PascalCase (e.g., `MatchCard.tsx`)
- Contexts: Suffix with "Context" (e.g., `AuthContext.tsx`)
- Hooks: Prefix with "use" (e.g., `use-mobile.tsx`)
- Database tables: snake_case (e.g., `work_experience`)
- React component props: Suffix interfaces with "Props"

### State Management
- Use contexts for global state (auth, matching)
- TanStack Query for server state (not heavily used yet)
- Local state for UI interactions
- No Redux/Zustand - keep context-based

## Key Files Reference
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) - Auth flow, profile loading
- [src/contexts/MatchContext.tsx](src/contexts/MatchContext.tsx) - Swipe logic (currently mocked)
- [database/schema.sql](database/schema.sql) - Core database schema
- [tailwind.config.ts](tailwind.config.ts) - Brand colors, theme configuration
- [src/lib/supabase-storage.ts](src/lib/supabase-storage.ts) - File upload helpers
- [README.md](README.md) - Brand guidelines, project structure
