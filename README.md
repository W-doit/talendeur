# Talendeur - Job Matching Web Application

## Brand Guidelines

### Color Palette
Talendeur uses a modern, futuristic color system aligned with our brand identity:

- **Primary Brand Color**: `#D1163E` (Burnt Orange) - Main brand color for buttons, CTAs, and key elements
- **Accent Colors**:
  - Pink: `#E30F68` - Used in gradients and special accents
  - Orange: `#FF9F14` - Secondary accent and gradient endpoints
  - Navy: `#180D51` - Dark accent for contrast
- **Gradients**: Primary to Orange (`from-talendeur-primary to-talendeur-orange`)
- **Neutral Colors**:
  - Light: `#FAFAFA` - Background
  - Gray: `#E5E5E5` - Borders and dividers
  - Dark: `#0F0A1F` - Dark mode backgrounds

### Typography
- **Font Family**: Raleway (all weights: Light 300, Regular 400, Semi Bold 600, Bold 700, Extra Bold 800)
- **Headings**: Raleway Bold/Extra Bold
- **Body**: Raleway Regular
- **Buttons**: Raleway Semi Bold

### UI Components
- **Buttons**: Gradient background (primary to orange), rounded-lg, shadow-md, hover scale effect
- **Cards**: Clean white/dark backgrounds, rounded-xl, shadow with hover effect
- **Inputs**: Rounded-lg with 2px borders, focus ring in primary color
- **Brand Gradient**: Used in navbar, hero sections, and key CTAs

## Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/talendeur.git
cd talendeur
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:8080`

### Environment Setup

Create a `.env` file in the root directory with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CV_PARSER_API_URL=your_fastapi_cv_parser_url
```

## Key Features

### User Profiles
- **Job Seekers**: Skills, work experience, education, certifications, references, personality tests, CV upload
- **Organizations**: Company info, logo, website, brief description, multiple contact persons (with primary contact)
- **Dashboard Preview**: Generate shareable dashboard screenshots for social media (LinkedIn, etc.)
- **Public Profiles**: SEO-optimized with Open Graph meta tags

### CV Parsing
- Upload LinkedIn PDF or CV
- Automatic extraction via FastAPI microservice
- Auto-populates profile fields (work experience, education, certifications)
- Immediate file upload to Supabase storage

### Social Sharing
- LinkedIn share integration with pre-filled text and hashtags
- Dashboard screenshot generation (html2canvas)
- Open Graph images stored in Supabase
- Dynamic meta tags for better social previews

### Matching System
- Tinder-style swipe interface (currently "Coming Soon")
- Skills-based matching algorithm (in development)
- Match list and detail views

### Organization Contacts
- Multiple contact persons per organization
- Primary contact designation
- Email validation and mailto links
- Public visibility of all contacts

## Overview

Talendeur is a comprehensive web application designed to connect job seekers with organizations. It features a Tinder-like interface for matching, profile creation, and user authentication.

## Project Structure

```
Talendeur
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx (Page wrapper with navbar/footer)
│   │   │   ├── Navbar.tsx (Navigation)
│   │   │   └── Footer.tsx (Site footer)
│   │   ├── matching/
│   │   │   ├── MatchCard.tsx (Tinder-like card for swiping)
│   │   │   ├── MatchList.tsx (List of successful matches)
│   │   │   └── MatchDetail.tsx (Detailed view of a match)
│   │   ├── profile/
│   │   │   ├── JobSeekerProfileForm.tsx (Form for job seekers)
│   │   │   └── OrganizationProfileForm.tsx (Form for organizations)
│   │   └── ui/ (shadcn UI components)
│   ├── contexts/
│   │   ├── AuthContext.tsx (Authentication state)
│   │   └── MatchContext.tsx (Matching logic)
│   ├── pages/
│   │   ├── Home.tsx (Landing page)
│   │   ├── Login.tsx (Login page)
│   │   ├── Register.tsx (Registration page)
│   │   ├── Profile.tsx (User profile page)
│   │   ├── FindMatches.tsx (Swiping interface)
│   │   ├── Matches.tsx (Match results page)
│   │   └── NotFound.tsx (404 page)
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts (Supabase connection)
│   │       └── types.ts (Database types)
│   ├── App.tsx (Main app component with routing)
│   └── main.tsx (Entry point)
```

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **State Management**: Context API (AuthContext, MatchContext)
- **Routing**: React Router DOM
- **UI Components**: shadcn/ui (accessible UI components)
- **Styling**: Tailwind CSS
- **Data Fetching**: TanStack React Query
- **Icons**: Lucide React
- **Charts**: Recharts
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Authentication**: Supabase Auth with email/password
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage (CVs, profile pictures, logos, OG images)
- **CV Parsing**: FastAPI microservice (external)
- **Social Sharing**: Open Graph meta tags + dashboard screenshots

## Application Flow Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Landing   │──────▶│  Register/  │──────▶│   Profile   │
│    Page     │       │    Login    │       │    Setup    │
└─────────────┘       └─────────────┘       └──────┬──────┘
                                                  │
                                                  ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Match    │◀─────▶│    Find     │◀─────▶│   Profile   │
│    List     │       │   Matches   │       │    View     │
└─────────────┘       └─────────────┘       └─────────────┘
```

## Hardcoded Credentials (for testing)

### Job Seekers:
1. **Alex Morgan**
   - Email: alex@example.com
   - Password: any password works
   - Skills: Soft (85%), Hard (92%), Feedback (78%), Learning (90%)

2. **Jamie Rivera**
   - Email: jamie@example.com
   - Password: any password works
   - Skills: Soft (95%), Hard (83%), Feedback (90%), Learning (87%)

### Organizations:
1. **TechVision Inc.**
   - Email: hr@techvision.com
   - Password: any password works

2. **CreativeWorks Studio**
   - Email: talent@creativeworks.com
   - Password: any password works

## Skills Scoring Algorithm (Conceptual)

```typescript
// Skills scoring algorithm (to be implemented)
function calculateSkillScore(profile: JobSeekerProfile, criteria: SkillCriteria): number {
  // Base weights for different skill categories
  const weights = {
    soft: 0.25,
    hard: 0.35,
    feedback: 0.20,
    learning: 0.20
  };

  // Calculate weighted score
   Database Schema

See `database/schema.sql` for the complete schema. Key tables:
- `profile`: User profiles (job seekers & organizations)
- `organization_details`: Organization-specific data
- `organization_contacts`: Multiple contact persons per organization (one-to-many)
- `work_experience`, `education_history`, `certifications`: Job seeker data
- `jobseeker_skill_rating`: Skills and personality scores
- `matches`: Match relationships

Run migrations in `database/` folder:
- `organization-profile-migration.sql`: Adds organization contacts table and brief description
- `og-image-migration.sql`: Adds Open Graph image URL column
- `og-images-storage.sql`: Creates storage bucket for social media previewles(id),
  organization_id UUID REFERENCES public.profiles(id),
  jobseeker_approved BOOLEAN DEFAULT FALSE,
  organization_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(jobseeker_id, organization_id)
);
```

### 2. Supabase Authentication
- Replace mock authentication with Supabase Auth
- Set up email verification and password reset
- Create triggers to populate user profiles on signup

### 3. Storage Implementation
- Configure Supabase Storage for CV uploads
- Implement file upload components
- Add security policies for file access

### 4. Matching Algorithm Refinement
- Implement personalized matching algorithm
- Add filtering options based on skills and needs
- Create analytics for match quality

### 5. UI/UX Improvements
- Improve the swiping animation
- Add a guided onboarding process
- Create a dashboard with insights

### 6. Advanced Features
- Implement a messaging system between matches
- Add calendar integration for scheduling interviews
- Create notification system for new matches


