import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchJobMatches,
  loadJobMatchesCache,
  type JobMatch,
  type JobMatchesResult,
  type JobMatchesOptions,
} from '@/lib/job-matches';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  ExternalLink,
  MapPin,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const scoreClass = (score: number) => {
  if (score >= 80) return 'text-green-700 bg-green-50 border-green-200';
  if (score >= 60) return 'text-talendeur-navy bg-talendeur-navy/5 border-talendeur-navy/20';
  return 'text-amber-800 bg-amber-50 border-amber-200';
};

const FieldLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
    {children}{' '}
    <span className="text-xs font-normal text-muted-foreground">(optional)</span>
  </label>
);

const Matches: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Core
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');

  // Extended filters
  const [roleTitle, setRoleTitle] = useState('');
  const [opportunityType, setOpportunityType] = useState('');
  const [intent, setIntent] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('');
  const [compensation, setCompensation] = useState('');
  const [skillRelationship, setSkillRelationship] = useState('');
  const [industry, setIndustry] = useState('');
  const [format, setFormat] = useState('');
  const [outcome, setOutcome] = useState('');
  const [level, setLevel] = useState('');

  const [result, setResult] = useState<JobMatchesResult | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
    else if (!loading && user && !user.profile) navigate('/profile');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user?.id || user.userType !== 'jobseeker') return;
    const cached = loadJobMatchesCache(user.id);
    if (cached) setResult(cached);
  }, [user?.id, user?.userType]);

  const buildOptions = (): JobMatchesOptions => ({
    keywords: keywords.trim() || undefined,
    location: location.trim() || undefined,
    roleTitle: roleTitle.trim() || undefined,
    opportunityType: opportunityType.trim() || undefined,
    intent: intent.trim() || undefined,
    timeCommitment: timeCommitment.trim() || undefined,
    compensation: compensation.trim() || undefined,
    skillRelationship: skillRelationship.trim() || undefined,
    industry: industry.trim() || undefined,
    format: format.trim() || undefined,
    outcome: outcome.trim() || undefined,
    level: level.trim() || undefined,
    limit: 12,
  });

  const runSearch = async (force = false) => {
    if (!user?.id) return;
    const opts = buildOptions();

    if (!force) {
      const cached = loadJobMatchesCache(user.id, opts);
      if (cached) { setResult(cached); return; }
    }

    setLoadingMatches(true);
    try {
      const data = await fetchJobMatches(user.id, opts);
      setResult(data);
      toast({
        title: data.matches.length ? 'Matches ready' : 'No openings found',
        description: data.matches.length
          ? data.matches.length === 1
            ? 'We found 1 opening for you.'
            : `We found ${data.matches.length} openings for you.`
          : data.summary,
      });
    } catch (err: any) {
      toast({
        title: 'Could not load matches',
        description: 'Something went wrong while searching. Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMatches(false);
    }
  };

  if (loading || !user || !user.profile) {
    return (
      <MainLayout>
        <div className="container max-w-4xl mx-auto py-12 px-4 text-center text-muted-foreground">Loading…</div>
      </MainLayout>
    );
  }

  if (user.userType !== 'jobseeker') {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto py-12 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-talendeur-navy">Job matches</CardTitle>
              <CardDescription>LinkedIn job matching is available for individual (job seeker) profiles.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="border-talendeur-navy text-talendeur-navy">
                <Link to="/profile"><ArrowLeft className="mr-2 h-4 w-4" />Back to profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto py-10 px-4 space-y-8">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="bg-white/70 text-talendeur-navy hover:bg-talendeur-navy hover:text-white border-talendeur-navy transition-colors">
            <Link to="/profile"><ArrowLeft className="h-4 w-4 mr-1" />Back to profile</Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-talendeur-navy flex items-center gap-2">
          <Briefcase className="h-7 w-7" />
          Job matches
        </h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-talendeur-navy flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Find openings
            </CardTitle>
            <CardDescription>
              All fields are optional. Your profile is always used as the base — these filters sharpen the search.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-6"
              onSubmit={(e) => { e.preventDefault(); runSearch(true); }}
            >
              {/* Section 1: core search */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="keywords">Keywords / Description</FieldLabel>
                  <Input
                    id="keywords"
                    placeholder="e.g. Product Manager, Python, board governance"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="location">Location</FieldLabel>
                  <Input
                    id="location"
                    placeholder="e.g. Remote, London, Berlin"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <hr className="border-muted" />

              {/* Section 2: opportunity profile */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Opportunity profile</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="roleTitle">Role / Title</FieldLabel>
                    <Input
                      id="roleTitle"
                      placeholder="e.g. Head of Reward, Data Analyst, Trustee"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="opportunityType">Opportunity type</FieldLabel>
                    <Input
                      id="opportunityType"
                      placeholder="e.g. Job, Fellowship, Volunteer, Board seat, Mentorship, Gig"
                      value={opportunityType}
                      onChange={(e) => setOpportunityType(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="industry">Domain / Industry</FieldLabel>
                    <Input
                      id="industry"
                      placeholder="e.g. FinTech, Healthcare, Climate, Non-profit"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="level">Level</FieldLabel>
                    <Input
                      id="level"
                      placeholder="e.g. Senior IC, Manager, Director+, Advisory / Board"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-muted" />

              {/* Section 3: preferences */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Your preferences</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="intent">Intent / Mode</FieldLabel>
                    <Input
                      id="intent"
                      placeholder="e.g. Employment, Experience-building, Giving back"
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="format">Format</FieldLabel>
                    <Input
                      id="format"
                      placeholder="e.g. Remote, Hybrid, On-site, Async"
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="timeCommitment">Time commitment</FieldLabel>
                    <Input
                      id="timeCommitment"
                      placeholder="e.g. Full-time, Part-time, Short-term (2–12 wks), One-off"
                      value={timeCommitment}
                      onChange={(e) => setTimeCommitment(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="compensation">Compensation</FieldLabel>
                    <Input
                      id="compensation"
                      placeholder="e.g. Paid – market rate, Unpaid – credentialed, Equity-only"
                      value={compensation}
                      onChange={(e) => setCompensation(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="skillRelationship">Skill relationship</FieldLabel>
                    <Input
                      id="skillRelationship"
                      placeholder="e.g. Core skill, Adjacent skill, Net-new / stretch"
                      value={skillRelationship}
                      onChange={(e) => setSkillRelationship(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="outcome">Outcome sought</FieldLabel>
                    <Input
                      id="outcome"
                      placeholder="e.g. Income, Portfolio artifact, Network, Reference, Full-time path"
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loadingMatches}
                className="bg-talendeur-navy hover:bg-talendeur-navy/90 text-white"
              >
                {loadingMatches ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Searching LinkedIn…</>
                ) : result ? (
                  <><RefreshCw className="mr-2 h-4 w-4" />Refresh matches</>
                ) : (
                  'Find matches'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-700">{result.summary}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated {new Date(result.generated_at).toLocaleString()}
              </p>
            </div>

            {result.matches.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No openings matched your search yet. Try adjusting your keywords or location and search again.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {result.matches.map((job: JobMatch) => (
                  <Card key={job.id} className="border-talendeur-navy/15">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-1">
                          <h2 className="text-lg font-semibold text-talendeur-navy">{job.title}</h2>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {job.company && (
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />{job.company}
                              </span>
                            )}
                            {job.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />{job.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`shrink-0 self-start rounded-md border px-3 py-1 text-sm font-bold ${scoreClass(job.score)}`}>
                          {job.score}% match
                        </div>
                      </div>
                      {job.why_fit && <p className="text-sm text-gray-700">{job.why_fit}</p>}
                      {job.gaps?.length > 0 && (
                        <ul className="text-sm text-amber-900/90 list-disc pl-5 space-y-1">
                          {job.gaps.map((gap) => <li key={gap}>{gap}</li>)}
                        </ul>
                      )}
                      <div className="pt-1">
                        <Button asChild size="sm" className="bg-talendeur-navy hover:bg-talendeur-navy/90 text-white">
                          <a href={job.url} target="_blank" rel="noopener noreferrer">
                            Open on LinkedIn<ExternalLink className="ml-2 h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Matches;
