import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, type JobSeekerProfile } from '@/contexts/AuthContext';
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
  getProfileCompletion,
  markMatchesExplored,
  PROFILE_READY_THRESHOLD,
  type ProfileCompletion,
} from '@/lib/profile-completion';
import {
  listSavedJobMatches,
  saveJobMatch,
  unsaveJobMatch,
  type SavedJobMatch,
} from '@/lib/saved-job-matches';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  ExternalLink,
  MapPin,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { trackFeatureClick } from '@/lib/product-analytics';

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

type ViewMode = 'search' | 'saved';

const Matches: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Core
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [locationReady, setLocationReady] = useState(false);

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
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion | null>(null);

  const [view, setView] = useState<ViewMode>('search');
  const [savedMatches, setSavedMatches] = useState<SavedJobMatch[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savingJobIds, setSavingJobIds] = useState<Set<string>>(new Set());

  const savedIds = React.useMemo(
    () => new Set(savedMatches.map((j) => j.id)),
    [savedMatches]
  );

  useEffect(() => {
    if (!loading && !user) navigate('/login');
    else if (!loading && user && !user.profile) navigate('/profile');
  }, [user, loading, navigate]);

  useEffect(() => {
    void trackFeatureClick('matches_page');
  }, []);

  // Default Matches location from country of residence (once)
  useEffect(() => {
    if (!user?.profile || user.userType !== 'jobseeker' || locationReady) return;
    const country = ((user.profile as JobSeekerProfile).countryOfResidence || '').trim();
    if (country) {
      setLocation((prev) => (prev.trim() ? prev : country));
    }
    setLocationReady(true);
  }, [user?.profile, user?.userType, locationReady]);

  useEffect(() => {
    if (!user?.id || user.userType !== 'jobseeker') return;
    const cached = loadJobMatchesCache(user.id);
    if (cached) {
      setResult(cached);
      markMatchesExplored(user.id);
    }
  }, [user?.id, user?.userType]);

  useEffect(() => {
    if (!user?.id || user.userType !== 'jobseeker' || !user.profile) return;
    let cancelled = false;
    (async () => {
      try {
        const completion = await getProfileCompletion(user.id, user.profile as JobSeekerProfile);
        if (!cancelled) setProfileCompletion(completion);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.userType, user?.profile]);

  const refreshSaved = React.useCallback(async () => {
    if (!user?.id) return;
    setLoadingSaved(true);
    try {
      const rows = await listSavedJobMatches(user.id);
      setSavedMatches(rows);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Could not load saved matches',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSaved(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (!user?.id || user.userType !== 'jobseeker') return;
    refreshSaved();
  }, [user?.id, user?.userType, refreshSaved]);

  const profileCountry = (
    (user?.profile as JobSeekerProfile | null)?.countryOfResidence || ''
  ).trim();

  const effectiveSearchLocation = (): string | undefined => {
    const typed = location.trim();
    if (typed) return typed;
    return profileCountry || undefined;
  };

  const buildOptions = (): JobMatchesOptions => ({
    keywords: keywords.trim() || undefined,
    location: effectiveSearchLocation(),
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
      if (cached) {
        setResult(cached);
        markMatchesExplored(user.id);
        toast({
          title: 'Showing cached results',
          description: `From ${new Date(cached.generated_at).toLocaleString()}. Change filters or refresh for new results.`,
        });
        return;
      }
    }

    setLoadingMatches(true);
    try {
      const data = await fetchJobMatches(user.id, opts);
      setResult(data);
      markMatchesExplored(user.id);
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

  const handleToggleSave = async (job: JobMatch) => {
    if (!user?.id) return;
    const isSaved = savedIds.has(job.id);
    setSavingJobIds((prev) => new Set(prev).add(job.id));
    try {
      if (isSaved) {
        await unsaveJobMatch(user.id, job.id);
        setSavedMatches((prev) => prev.filter((j) => j.id !== job.id));
        toast({ title: 'Removed from saved matches' });
      } else {
        const saved = await saveJobMatch(user.id, job);
        setSavedMatches((prev) => [saved, ...prev.filter((j) => j.id !== job.id)]);
        toast({ title: 'Saved for later' });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: isSaved ? 'Could not remove' : 'Could not save',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingJobIds((prev) => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  };

  const renderJobCard = (job: JobMatch, opts?: { showSavedAt?: string }) => {
    const isSaved = savedIds.has(job.id);
    const busy = savingJobIds.has(job.id);
    return (
      <Card key={job.id} className="border-talendeur-navy/15">
        <CardContent className="pt-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-talendeur-navy">{job.title}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {job.company && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {job.company}
                  </span>
                )}
                {job.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location}
                  </span>
                )}
              </div>
              {opts?.showSavedAt && (
                <p className="text-xs text-muted-foreground">
                  Saved {new Date(opts.showSavedAt).toLocaleString()}
                </p>
              )}
            </div>
            {typeof job.score === 'number' && job.score > 0 && (
              <div
                className={`shrink-0 self-start rounded-md border px-3 py-1 text-sm font-bold ${scoreClass(job.score)}`}
              >
                {job.score}% match
              </div>
            )}
          </div>
          {job.why_fit && <p className="text-sm text-gray-700">{job.why_fit}</p>}
          {job.gaps?.length > 0 && (
            <ul className="text-sm text-amber-900/90 list-disc pl-5 space-y-1">
              {job.gaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
          )}
          <div className="pt-1 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => handleToggleSave(job)}
              className={
                isSaved
                  ? 'border-talendeur-navy bg-talendeur-navy/5 text-talendeur-navy hover:bg-talendeur-navy hover:text-white'
                  : 'border-talendeur-navy text-talendeur-navy hover:bg-talendeur-navy hover:text-white'
              }
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="mr-1.5 h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="mr-1.5 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
            <Button asChild size="sm" className="bg-talendeur-navy hover:bg-talendeur-navy/90 text-white">
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                Open role
                <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
              <CardDescription>Job matching is available for individual (job seeker) profiles.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="border-talendeur-navy text-talendeur-navy">
                <Link to="/profile">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to profile
                </Link>
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
        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="bg-white/70 text-talendeur-navy hover:bg-talendeur-navy hover:text-white border-talendeur-navy transition-colors"
          >
            <Link to="/profile">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to profile
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === 'saved' ? 'default' : 'outline'}
            onClick={() => {
              setView('saved');
              refreshSaved();
            }}
            className={
              view === 'saved'
                ? 'bg-talendeur-navy text-white hover:bg-talendeur-navy/90'
                : 'bg-white/70 text-talendeur-navy hover:bg-talendeur-navy hover:text-white border-talendeur-navy transition-colors'
            }
          >
            <BookmarkCheck className="h-4 w-4 mr-1.5" />
            Saved matches
            {savedMatches.length > 0 ? ` (${savedMatches.length})` : ''}
          </Button>
          {view === 'saved' && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setView('search')}
              className="bg-white/70 text-talendeur-navy hover:bg-talendeur-navy hover:text-white border-talendeur-navy transition-colors"
            >
              <Briefcase className="h-4 w-4 mr-1.5" />
              Find matches
            </Button>
          )}
        </div>

        <h1 className="text-3xl font-bold text-talendeur-navy flex items-center gap-2">
          {view === 'saved' ? (
            <>
              <BookmarkCheck className="h-7 w-7" />
              Saved matches
            </>
          ) : (
            <>
              <Briefcase className="h-7 w-7" />
              Job matches
            </>
          )}
        </h1>

        {view === 'saved' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Roles you have saved for later. Open a listing anytime, or remove it from this list.
            </p>
            {loadingSaved ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">Loading saved matches…</CardContent>
              </Card>
            ) : savedMatches.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center space-y-4">
                  <p className="text-muted-foreground">You have not saved any roles yet.</p>
                  <Button
                    type="button"
                    onClick={() => setView('search')}
                    className="bg-talendeur-navy hover:bg-talendeur-navy/90 text-white"
                  >
                    Find matches
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {savedMatches.map((job) => renderJobCard(job, { showSavedAt: job.savedAt }))}
              </div>
            )}
          </div>
        ) : (
          <>
            {profileCompletion && !profileCompletion.isReady && (
              <Card className="border-amber-200 bg-amber-50/70">
                <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-amber-900">
                    Your profile is {profileCompletion.percent}% complete. Fuller profiles usually get
                    better matches — aim for {PROFILE_READY_THRESHOLD}%+.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="bg-white text-talendeur-navy hover:bg-talendeur-navy hover:text-white border-talendeur-navy transition-colors shrink-0"
                  >
                    <Link to="/profile">Improve profile</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-talendeur-navy flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Find openings
                </CardTitle>
                <CardDescription>
                  All fields are optional. Your profile is always used as the base — these filters sharpen
                  the search.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    runSearch(false);
                  }}
                >
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
                        placeholder={
                          profileCountry
                            ? `e.g. Remote, London (defaults to ${profileCountry})`
                            : 'e.g. Remote, London, Berlin'
                        }
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                      {profileCountry && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Defaults to your country of residence ({profileCountry}). Change this for
                          Remote or another place.
                        </p>
                      )}
                    </div>
                  </div>

                  <hr className="border-muted" />

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

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      disabled={loadingMatches}
                      className="bg-talendeur-navy hover:bg-talendeur-navy/90 text-white"
                    >
                      {loadingMatches ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Finding matches…
                        </>
                      ) : (
                        'Find matches'
                      )}
                    </Button>
                    {result && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={loadingMatches}
                        onClick={() => runSearch(true)}
                        className="border-talendeur-navy text-talendeur-navy hover:bg-talendeur-navy hover:text-white"
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loadingMatches ? 'animate-spin' : ''}`} />
                        Refresh now
                      </Button>
                    )}
                  </div>
                  {result && (
                    <p className="text-xs text-muted-foreground">
                      Search results are reused for 12 hours when filters are unchanged. Use Refresh now for
                      a fresh search. Use Save on a role to keep it in Saved matches.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            {loadingMatches && (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Finding matches…
                </CardContent>
              </Card>
            )}

            {result && !loadingMatches && (
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
                      No openings matched your search yet. Try adjusting your keywords or location and
                      search again.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {result.matches.map((job: JobMatch) => renderJobCard(job))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Matches;
