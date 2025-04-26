# Talendeur - Job Matching Web Application

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

Create a `.env` file in the root directory with the following variables (to be updated once Supabase is integrated):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

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
- **Backend**: Supabase (to be implemented)
- **Authentication**: Currently mocked, to be replaced with Supabase Auth
- **Database**: Supabase PostgreSQL (to be implemented)
- **Storage**: Supabase Storage (to be implemented for CV uploads)

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
  const weightedScore =
    (profile.skills.soft * weights.soft) +
    (profile.skills.hard * weights.hard) +
    (profile.skills.feedback * weights.feedback) +
    (profile.skills.learning * weights.learning);

  // Apply organization's preference adjustments
  const adjustedScore = applyPreferenceAdjustments(weightedScore, criteria);

  // Normalize to 0-100 scale
  return Math.min(Math.max(adjustedScore, 0), 100);
}

// Apply organization-specific preferences
function applyPreferenceAdjustments(score: number, criteria: SkillCriteria): number {
  let adjustedScore = score;

  // Boost score if interests match organization needs
  const interestMatchBonus = calculateInterestMatchBonus(criteria.interests);
  adjustedScore += interestMatchBonus;

  // Apply industry-specific adjustments
  if (criteria.industryFocus) {
    adjustedScore = applyIndustryAdjustments(adjustedScore, criteria.industryFocus);
  }

  return adjustedScore;
}
```

## Next Steps

### 1. Supabase Database Integration
- Create database tables for:
  - `profiles`: Store user profile information
  - `organizations`: Store organization information
  - `matches`: Track match status between users and organizations
  - `skills`: Store skill ratings and evaluation data

Here's a sample SQL schema to implement:

```sql
-- Users profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_pic TEXT,
  cv_url TEXT,
  bio TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('jobseeker', 'organization'))
);

-- Job seeker specific info
CREATE TABLE public.jobseeker_details (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id),
  interests TEXT[],
  soft_skills INTEGER CHECK (soft_skills >= 0 AND soft_skills <= 100),
  hard_skills INTEGER CHECK (hard_skills >= 0 AND hard_skills <= 100),
  feedback_score INTEGER CHECK (feedback_score >= 0 AND feedback_score <= 100),
  learning_score INTEGER CHECK (learning_score >= 0 AND learning_score <= 100)
);

-- Organization specific info
CREATE TABLE public.organization_details (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id),
  logo TEXT,
  website TEXT,
  about TEXT,
  needs TEXT[]
);

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jobseeker_id UUID REFERENCES public.profiles(id),
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

## Known Issues

- TypeScript error in `src/contexts/MatchContext.tsx` file.

```
src/contexts/MatchContext.tsx(304,25): error TS2345: Argument of type '(prev: JobSeekerProfile[] | OrganizationProfile[]) => (JobSeekerProfile | OrganizationProfile)[]' is not assignable to parameter of type 'SetStateAction<JobSeekerProfile[] | OrganizationProfile[]>'.
  Type '(prev: JobSeekerProfile[] | OrganizationProfile[]) => (JobSeekerProfile | OrganizationProfile)[]' is not assignable to type '(prevState: JobSeekerProfile[] | OrganizationProfile[]) => JobSeekerProfile[] | OrganizationProfile[]'.
    Type '(JobSeekerProfile | OrganizationProfile)[]' is not assignable to type 'JobSeekerProfile[] | OrganizationProfile[]'.
      Type '(JobSeekerProfile | OrganizationProfile)[]' is not assignable to type 'JobSeekerProfile[]'.
        Type 'JobSeekerProfile | OrganizationProfile' is not assignable to type 'JobSeekerProfile'.
          Type 'OrganizationProfile' is missing the following properties from type 'JobSeekerProfile': profilePic, cv, interests, skills, bio
```
