import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  analyzeProfileGaps,
  loadSavedGapAnalysis,
  saveGapAnalysis,
  type GapAnalysisResult,
} from '@/lib/profile-gap-analysis';
import {
  analyzeCareerForesight,
  loadExtendedProfileSnapshot,
  loadSavedCareerForesight,
  saveCareerForesight,
  type CareerForesightResult,
} from '@/lib/career-foresight';
import { ArrowLeft, Compass, Sparkles, Target, TrendingUp } from 'lucide-react';

const severityClass: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-slate-100 text-slate-700',
};

const effortClass = 'text-xs font-semibold uppercase tracking-wide text-talendeur-navy whitespace-nowrap';

const ProfileRecommendations: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('target-role');

  const [targetRole, setTargetRole] = useState('');
  const [targetOrganization, setTargetOrganization] = useState('');
  const [analyzingGap, setAnalyzingGap] = useState(false);
  const [gapResult, setGapResult] = useState<GapAnalysisResult | null>(null);

  const [industryPreference, setIndustryPreference] = useState('');
  const [openToCareerSwitch, setOpenToCareerSwitch] = useState(false);
  const [analyzingForesight, setAnalyzingForesight] = useState(false);
  const [foresightResult, setForesightResult] = useState<CareerForesightResult | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    const savedGap = loadSavedGapAnalysis(user.id);
    if (savedGap) {
      setGapResult(savedGap);
      setTargetRole(savedGap.targetRole);
      setTargetOrganization(savedGap.targetOrganization || '');
    }
    const savedForesight = loadSavedCareerForesight(user.id);
    if (savedForesight) {
      setForesightResult(savedForesight);
    }
  }, [user?.id]);

  const handleGapAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !targetRole.trim()) return;

    setAnalyzingGap(true);
    try {
      const snapshot = await loadExtendedProfileSnapshot(user.id);
      const analysis = await analyzeProfileGaps(
        snapshot,
        targetRole.trim(),
        targetOrganization.trim() || undefined
      );
      saveGapAnalysis(user.id, analysis);
      setGapResult(analysis);
      toast({
        title: 'Gap analysis ready',
        description:
          analysis.source === 'api'
            ? 'Generated with Talendeur AI.'
            : 'Generated from your profile data.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Analysis failed',
        description: err.message || 'Could not analyse your profile',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingGap(false);
    }
  };

  const handleForesightAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setAnalyzingForesight(true);
    try {
      const snapshot = await loadExtendedProfileSnapshot(user.id);
      const analysis = await analyzeCareerForesight(snapshot, {
        industryPreference: industryPreference.trim() || undefined,
        openToCareerSwitch,
      });
      saveCareerForesight(user.id, analysis);
      setForesightResult(analysis);
      toast({
        title: 'Stay-ahead guidance ready',
        description:
          analysis.source === 'api'
            ? 'Tailored with Talendeur AI for an AI-shaped job market.'
            : 'Generated from your profile data.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Analysis failed',
        description: err.message || 'Could not generate guidance',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingForesight(false);
    }
  };

  const renderUpskillTier = (
    title: string,
    steps: CareerForesightResult['upskillingRoadmap']['quickWins']
  ) => (
    <div className="space-y-3">
      <h4 className="font-semibold text-talendeur-navy">{title}</h4>
      {steps.map((step) => (
        <div
          key={step.action}
          className="rounded-md border border-talendeur-navy/20 bg-talendeur-navy/5 p-4 space-y-2"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
            <span className={effortClass}>{step.effort}</span>
            <p className="font-medium">{step.action}</p>
          </div>
          <p className="text-sm text-muted-foreground">{step.why}</p>
          <p className="text-xs text-talendeur-navy/80 italic">Profile signal: {step.profileSignal}</p>
        </div>
      ))}
    </div>
  );

  if (loading || !user) {
    return (
      <MainLayout>
        <div className="container max-w-4xl mx-auto py-12 px-4 text-center text-muted-foreground">
          Loading…
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
            <Sparkles className="h-7 w-7" />
            Profile recommendations
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Compare yourself to a target role, or get future-ready guidance on where to upskill as AI
            reshapes work.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="target-role" className="gap-2">
              <Target className="h-4 w-4" />
              Target role
            </TabsTrigger>
            <TabsTrigger value="stay-ahead" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Stay ahead
            </TabsTrigger>
          </TabsList>

          <TabsContent value="target-role" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-talendeur-navy">
                  <Target className="h-5 w-5" />
                  Target role gap analysis
                </CardTitle>
                <CardDescription>
                  Example: Project Manager at Google, Senior Data Analyst, Product Designer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGapAnalyze} className="space-y-4">
                  <div>
                    <label htmlFor="targetRole" className="text-sm font-medium">
                      Desired job / role
                    </label>
                    <Input
                      id="targetRole"
                      className="mt-1"
                      placeholder="e.g. Project Manager"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="targetOrg" className="text-sm font-medium">
                      Target organisation (optional)
                    </label>
                    <Input
                      id="targetOrg"
                      className="mt-1"
                      placeholder="e.g. Google"
                      value={targetOrganization}
                      onChange={(e) => setTargetOrganization(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={analyzingGap || !targetRole.trim()}
                    className="bg-talendeur-navy hover:bg-talendeur-navy/90 text-white"
                  >
                    {analyzingGap ? 'Analysing profile…' : gapResult ? 'Re-run analysis' : 'Analyse gaps'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {gapResult && (
              <div className="space-y-6">
                <Card className="border-talendeur-navy/30">
                  <CardHeader>
                    <CardTitle>Fit for {gapResult.targetRole}</CardTitle>
                    <CardDescription>
                      {gapResult.targetOrganization ? `Towards ${gapResult.targetOrganization} · ` : ''}
                      Updated {new Date(gapResult.generatedAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-end justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Match score</span>
                        <span className="text-3xl font-bold text-talendeur-navy">{gapResult.matchScore}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-talendeur-navy transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, gapResult.matchScore))}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-gray-700">{gapResult.summary}</p>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 list-disc pl-5 text-sm text-gray-700">
                        {gapResult.strengths.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Gaps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {gapResult.gaps.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No major gaps detected.</p>
                      ) : (
                        gapResult.gaps.map((gap) => (
                          <div key={`${gap.area}-${gap.title}`} className="rounded-md border p-3 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm">{gap.title}</p>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full capitalize ${severityClass[gap.severity]}`}
                              >
                                {gap.severity}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{gap.detail}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recommended next steps</CardTitle>
                    <CardDescription>Actionable ways to close the gap toward your target role</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {gapResult.recommendations.map((rec) => (
                      <div
                        key={rec.action}
                        className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-md border border-talendeur-navy/20 bg-talendeur-navy/5 p-4"
                      >
                        <span className={effortClass}>{rec.effort}</span>
                        <div>
                          <p className="font-medium">{rec.action}</p>
                          <p className="text-sm text-muted-foreground mt-1">{rec.why}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stay-ahead" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-talendeur-navy">
                  <Compass className="h-5 w-5" />
                  Stay ahead in an AI-shaped market
                </CardTitle>
                <CardDescription>
                  Reads your full profile — experience, skills, AI fluency, certifications — and suggests
                  strategic directions and upskilling to stay competitive. No target role required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForesightAnalyze} className="space-y-4">
                  <div>
                    <label htmlFor="industryPreference" className="text-sm font-medium">
                      Industry or sector interest (optional)
                    </label>
                    <Input
                      id="industryPreference"
                      className="mt-1"
                      placeholder="e.g. FinTech, Healthcare, Climate tech"
                      value={industryPreference}
                      onChange={(e) => setIndustryPreference(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="openToCareerSwitch"
                      checked={openToCareerSwitch}
                      onCheckedChange={(checked) => setOpenToCareerSwitch(checked === true)}
                    />
                    <Label htmlFor="openToCareerSwitch" className="text-sm font-normal cursor-pointer">
                      I&apos;m open to a meaningful career switch (not just a title change)
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    disabled={analyzingForesight}
                    className="bg-talendeur-navy hover:bg-talendeur-navy/90 text-white"
                  >
                    {analyzingForesight
                      ? 'Building your guidance…'
                      : foresightResult
                        ? 'Refresh guidance'
                        : 'Generate stay-ahead guidance'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {foresightResult && (
              <div className="space-y-6">
                <Card className="border-talendeur-navy/30">
                  <CardHeader>
                    <CardTitle>Your positioning</CardTitle>
                    <CardDescription>
                      Updated {new Date(foresightResult.generatedAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-end justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Future-ready score
                        </span>
                        <span className="text-3xl font-bold text-talendeur-navy">
                          {foresightResult.readinessScore}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-talendeur-navy transition-all"
                          style={{
                            width: `${Math.min(100, Math.max(0, foresightResult.readinessScore))}%`,
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{foresightResult.positioningThesis}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Strategic directions</CardTitle>
                    <CardDescription>Where your profile could go in the next 3–5 years</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {foresightResult.strategicDirections.map((dir) => (
                      <div key={dir.title} className="rounded-md border p-4 space-y-2">
                        <p className="font-semibold text-talendeur-navy">{dir.title}</p>
                        <p className="text-sm">
                          <span className="font-medium">Why now:</span> {dir.whyNow}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Fit:</span> {dir.fitToBackground}
                        </p>
                        <p className="text-sm text-amber-800 bg-amber-50 rounded px-2 py-1">
                          {dir.riskIfIgnored}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upskilling roadmap</CardTitle>
                    <CardDescription>Prioritised learning tied to your profile evidence</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {renderUpskillTier('Quick wins', foresightResult.upskillingRoadmap.quickWins)}
                    {renderUpskillTier(
                      '3–6 months',
                      foresightResult.upskillingRoadmap.threeToSixMonths
                    )}
                    {renderUpskillTier('12 months', foresightResult.upskillingRoadmap.twelveMonths)}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI leverage moves</CardTitle>
                    <CardDescription>How to use AI as an advantage in your role family</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {foresightResult.aiLeverageMoves.map((move) => (
                      <div key={move.action} className="rounded-md border p-4 space-y-1">
                        <p className="font-medium">{move.action}</p>
                        <p className="text-sm text-muted-foreground">{move.why}</p>
                        <p className="text-xs text-talendeur-navy/80 italic">
                          Profile signal: {move.profileSignal}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">What not to chase</CardTitle>
                    <CardDescription>Common traps for profiles like yours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 list-disc pl-5 text-sm text-gray-700">
                      {foresightResult.avoidChasing.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ProfileRecommendations;
