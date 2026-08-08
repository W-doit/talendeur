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

const Matches: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [location, setLocation] = useState('');
  const [keywords, setKeywords] = useState('');
  const [result, setResult] = useState<JobMatchesResult | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (!loading && user && !user.profile) {
      navigate('/profile');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user?.id || user.userType !== 'jobseeker') return;
    const cached = loadJobMatchesCache(user.id);
    if (cached) setResult(cached);
  }, [user?.id, user?.userType]);

  const runSearch = async (force = false) => {
    if (!user?.id) return;

    if (!force) {
      const cached = loadJobMatchesCache(user.id, {
        location: location.trim() || undefined,
        keywords: keywords.trim() || undefined,
      });
      if (cached) {
        setResult(cached);
        return;
      }
    }

    setLoadingMatches(true);
    try {
      const data = await fetchJobMatches(user.id, {
        location: location.trim() || undefined,
        keywords: keywords.trim() || undefined,
        limit: 12,
      });
      setResult(data);
      toast({
        title: data.matches.length ? 'Matches ready' : 'No openings found',
        description: data.matches.length
          ? `Ranked ${data.matches.length} LinkedIn openings (${data.backend}).`
          : data.summary,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Could not load matches',
        description: err.message || 'Job matching failed',
        variant: 'destructive',
      });
    } finally {
      setLoadingMatches(false);
    }
  };

  if (loading || !user || !user.profile) {
    return (
      <MainLayout>
        <div className="container max-w-4xl mx-auto py-12 px-4 text-center text-muted-foreground">
          Loading…
        </div>
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
              <CardDescription>
                LinkedIn job matching is available for individual (job seeker) profiles.
              </CardDescription>
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
        <div className="flex items-center gap-3">
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
        </div>

        <div>
          <h1 className="text-3xl font-bold text-talendeur-navy flex items-center gap-2">
            <Briefcase className="h-7 w-7" />
            Job matches
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-talendeur-navy flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Find openings
            </CardTitle>
            <CardDescription>
              Leave keywords empty to search from your headline and recent roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(true);
              }}
            >
              <div className="sm:col-span-2">
                <label htmlFor="keywords" className="text-sm font-medium">
                  Keywords (optional)
                </label>
                <Input
                  id="keywords"
                  className="mt-1"
                  placeholder="e.g. Project Manager, Data Analyst"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location (optional)
                </label>
                <Input
                  id="location"
                  className="mt-1"
                  placeholder="e.g. Remote, Berlin, London"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={loadingMatches}
                  className="bg-talendeur-navy hover:bg-talendeur-navy/90 text-white"
                >
                  {loadingMatches ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Searching LinkedIn…
                    </>
                  ) : result ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh matches
                    </>
                  ) : (
                    'Find matches'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <p className="text-sm text-gray-700">{result.summary}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Queries: {result.queries.join(' · ') || '—'} · Backend: {result.backend} · Updated{' '}
                  {new Date(result.generated_at).toLocaleString()}
                </p>
              </div>
            </div>

            {result.matches.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No openings returned. Try different keywords/location, or configure LinkedIn MCP on the
                  CV parser host.
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
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {job.company}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.location}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`shrink-0 self-start rounded-md border px-3 py-1 text-sm font-bold ${scoreClass(
                            job.score
                          )}`}
                        >
                          {job.score}% match
                        </div>
                      </div>

                      {job.why_fit && <p className="text-sm text-gray-700">{job.why_fit}</p>}

                      {job.gaps?.length > 0 && (
                        <ul className="text-sm text-amber-900/90 list-disc pl-5 space-y-1">
                          {job.gaps.map((gap) => (
                            <li key={gap}>{gap}</li>
                          ))}
                        </ul>
                      )}

                      <div className="pt-1">
                        <Button
                          asChild
                          size="sm"
                          className="bg-talendeur-navy hover:bg-talendeur-navy/90 text-white"
                        >
                          <a href={job.url} target="_blank" rel="noopener noreferrer">
                            Open on LinkedIn
                            <ExternalLink className="ml-2 h-3.5 w-3.5" />
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
