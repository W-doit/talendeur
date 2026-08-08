import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { KeyMetricsCards } from '@/components/dashboard/KeyMetricsCards';
import { SkillsRadarChart } from '@/components/dashboard/SkillsRadarChart';
import { Timeline } from '@/components/dashboard/Timeline';
import { CertificationsChart } from '@/components/dashboard/CertificationsChart';
import { ESGChart } from '@/components/dashboard/ESGChart';
import { InternationalExperienceMap } from '@/components/dashboard/InternationalExperienceMap';
import { BiographyWordCloud } from '@/components/dashboard/BiographyWordCloud';
import { AIProficiencyChart } from '@/components/dashboard/AIProficiencyChart';
import { PersonalityVisualization } from '@/components/dashboard/PersonalityVisualization';
import { ReferencesDisplay } from '@/components/dashboard/ReferencesDisplay';
import { LanguagesDisplay } from '@/components/dashboard/LanguagesDisplay';
import { VolunteeringDisplay } from '@/components/dashboard/VolunteeringDisplay';
import { CareerPreferencesDisplay } from '@/components/dashboard/CareerPreferencesDisplay';
import {
  normalizeDashboardLayout,
  sectionsForColumn,
  type DashboardSectionConfig,
  type DashboardSectionId,
} from '@/lib/dashboard-layout';

interface JobSeekerDashboardProps {
  layout?: DashboardSectionConfig[] | null;
  userId?: string;
  accessTokenOverride?: string | null;
  refreshTrigger?: number;
  videoUrl?: string;
  portfolioUrl?: string;
  interests?: string[];
  openToRelocation?: boolean;
  targetOrganizations?: string[];
  aiProficiencyData?: unknown;
  aiToolsData?: unknown;
  dashboardRef?: React.RefObject<HTMLDivElement | null>;
}

const getVideoEmbedUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace('www.', '');

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const videoId = parsedUrl.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (hostname === 'youtu.be') {
      const videoId = parsedUrl.pathname.replace('/', '').trim();
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (hostname === 'vimeo.com') {
      const videoId = parsedUrl.pathname.replace('/', '').trim();
      if (videoId) return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  } catch {
    return url;
  }
};

export const JobSeekerDashboard: React.FC<JobSeekerDashboardProps> = ({
  layout,
  userId,
  accessTokenOverride,
  refreshTrigger,
  videoUrl,
  portfolioUrl,
  interests = [],
  openToRelocation,
  targetOrganizations = [],
  aiProficiencyData,
  aiToolsData,
  dashboardRef,
}) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const normalized = normalizeDashboardLayout(layout);

  const sharedProps = {
    ...(userId ? { userId } : {}),
    ...(accessTokenOverride !== undefined ? { accessTokenOverride } : {}),
  };

  const renderSection = (id: DashboardSectionId): React.ReactNode => {
    switch (id) {
      case 'timeline':
        return <Timeline {...sharedProps} refreshTrigger={refreshTrigger} />;
      case 'certifications':
        return <CertificationsChart {...sharedProps} />;
      case 'key_metrics':
        return <KeyMetricsCards {...sharedProps} />;
      case 'languages':
        return <LanguagesDisplay {...sharedProps} />;
      case 'career_preferences':
        return (
          <CareerPreferencesDisplay
            openToRelocation={openToRelocation}
            targetOrganizations={targetOrganizations}
          />
        );
      case 'video':
        if (!videoUrl) return null;
        return (
          <Card>
            <Collapsible open={isVideoOpen} onOpenChange={setIsVideoOpen}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Video Profile</CardTitle>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/70 text-talendeur-primary hover:bg-talendeur-primary hover:text-white border-talendeur-primary transition-colors"
                    aria-label={isVideoOpen ? 'Collapse video profile' : 'Expand video profile'}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isVideoOpen ? 'rotate-180' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <div className="relative w-full overflow-hidden rounded-lg border border-gray-200">
                    <div className="aspect-video">
                      <iframe
                        src={getVideoEmbedUrl(videoUrl)}
                        title="Profile video"
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      case 'ai_proficiency':
        return <AIProficiencyChart data={aiProficiencyData} tools={aiToolsData as never} />;
      case 'portfolio':
        if (!portfolioUrl) return null;
        return (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-talendeur-primary hover:text-talendeur-orange transition-colors font-medium"
              >
                <ExternalLink size={18} />
                <span>Visit Portfolio</span>
              </a>
            </CardContent>
          </Card>
        );
      case 'word_cloud':
        return <BiographyWordCloud {...sharedProps} />;
      case 'skills_radar':
        return <SkillsRadarChart {...sharedProps} />;
      case 'personality':
        return <PersonalityVisualization {...sharedProps} />;
      case 'esg':
        return <ESGChart {...sharedProps} />;
      case 'volunteering':
        return <VolunteeringDisplay {...sharedProps} />;
      case 'map':
        return <InternationalExperienceMap {...sharedProps} />;
      case 'references':
        return <ReferencesDisplay {...sharedProps} />;
      case 'interests':
        if (!interests.length) return null;
        return (
          <Card>
            <CardHeader>
              <CardTitle>Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-talendeur-primary/10 text-talendeur-primary rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  const left = sectionsForColumn(normalized, 'left');
  const right = sectionsForColumn(normalized, 'right');
  const full = sectionsForColumn(normalized, 'full');

  return (
    <div className="flex flex-col gap-8">
      <div ref={dashboardRef as React.RefObject<HTMLDivElement>} className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 flex flex-col gap-8">
          {left.map((section) => (
            <React.Fragment key={section.id}>{renderSection(section.id)}</React.Fragment>
          ))}
        </div>
        <div className="w-full md:w-2/3 flex flex-col gap-8">
          {right.map((section) => (
            <React.Fragment key={section.id}>{renderSection(section.id)}</React.Fragment>
          ))}
        </div>
      </div>

      {full.map((section) => (
        <div key={section.id} className="w-full">
          {renderSection(section.id)}
        </div>
      ))}
    </div>
  );
};
