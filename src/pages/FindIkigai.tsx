import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  buildIkigaiFromResponses,
  IKIGAI_PILLARS,
  IKIGAI_QUESTIONS,
  loadIkigaiResult,
  saveIkigaiResult,
  type IkigaiPillar,
  type IkigaiResult,
} from '@/lib/ikigai';
import { ArrowLeft, ArrowRight, Compass, RefreshCw } from 'lucide-react';

const IkigaiDiagram: React.FC<{ result: IkigaiResult }> = ({ result }) => {
  const circles: Array<{
    id: IkigaiPillar;
    cx: number;
    cy: number;
    labelX: number;
    labelY: number;
  }> = [
    { id: 'love', cx: 220, cy: 200, labelX: 120, labelY: 95 },
    { id: 'goodAt', cx: 340, cy: 200, labelX: 400, labelY: 95 },
    { id: 'worldNeeds', cx: 220, cy: 320, labelX: 110, labelY: 420 },
    { id: 'paidFor', cx: 340, cy: 320, labelX: 410, labelY: 420 },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 560 520"
        className="w-full max-w-xl mx-auto h-auto"
        role="img"
        aria-label="Ikigai diagram with four overlapping circles"
      >
        <defs>
          {circles.map((c) => (
            <radialGradient key={`g-${c.id}`} id={`grad-${c.id}`} cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor={IKIGAI_PILLARS[c.id].color} stopOpacity="0.55" />
              <stop offset="100%" stopColor={IKIGAI_PILLARS[c.id].color} stopOpacity="0.22" />
            </radialGradient>
          ))}
        </defs>

        {circles.map((c) => (
          <g key={c.id}>
            <circle
              cx={c.cx}
              cy={c.cy}
              r={120}
              fill={`url(#grad-${c.id})`}
              stroke={IKIGAI_PILLARS[c.id].color}
              strokeWidth="2"
            />
            <text
              x={c.labelX}
              y={c.labelY}
              textAnchor="middle"
              className="fill-current"
              style={{ fill: IKIGAI_PILLARS[c.id].color, fontSize: 13, fontWeight: 700 }}
            >
              {IKIGAI_PILLARS[c.id].title}
            </text>
          </g>
        ))}

        {/* Intersection labels */}
        <text x={280} y={175} textAnchor="middle" style={{ fill: '#180D51', fontSize: 11, fontWeight: 600 }}>
          Passion
        </text>
        <text x={155} y={265} textAnchor="middle" style={{ fill: '#180D51', fontSize: 11, fontWeight: 600 }}>
          Mission
        </text>
        <text x={405} y={265} textAnchor="middle" style={{ fill: '#180D51', fontSize: 11, fontWeight: 600 }}>
          Profession
        </text>
        <text x={280} y={355} textAnchor="middle" style={{ fill: '#180D51', fontSize: 11, fontWeight: 600 }}>
          Vocation
        </text>

        <circle cx={280} cy={260} r={36} fill="#180D51" fillOpacity="0.9" />
        <text x={280} y={256} textAnchor="middle" style={{ fill: '#fff', fontSize: 11, fontWeight: 700 }}>
          IKIGAI
        </text>
        <text x={280} y={272} textAnchor="middle" style={{ fill: '#FFCFD2', fontSize: 9 }}>
          centre
        </text>
      </svg>

      <div className="grid sm:grid-cols-2 gap-3 mt-4 max-w-xl mx-auto text-sm">
        {(
          [
            ['Passion', 'What you love ∩ what you\'re good at', result.intersections.passion],
            ['Mission', 'What you love ∩ what the world needs', result.intersections.mission],
            ['Profession', 'What you\'re good at ∩ what pays', result.intersections.profession],
            ['Vocation', 'What the world needs ∩ what pays', result.intersections.vocation],
          ] as const
        ).map(([title, desc, items]) => (
          <div key={title} className="rounded-md border border-talendeur-navy/15 p-3 bg-white/70">
            <p className="font-semibold text-talendeur-navy">{title}</p>
            <p className="text-xs text-muted-foreground mb-2">{desc}</p>
            {items.length ? (
              <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">No clear overlap yet</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const FindIkigai: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [result, setResult] = useState<IkigaiResult | null>(null);
  const [phase, setPhase] = useState<'intro' | 'questions' | 'result'>('intro');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const saved = await loadIkigaiResult(user.id);
      if (cancelled) return;
      if (saved) {
        setResult(saved);
        if (saved.responses) setResponses(saved.responses);
        setPhase('result');
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const question = IKIGAI_QUESTIONS[step];
  const canContinue = (responses[question?.id] || '').trim().length >= 2;

  const finish = async () => {
    if (!user?.id) return;
    const built = buildIkigaiFromResponses(responses);
    setResult(built);
    setPhase('result');
    await saveIkigaiResult(user.id, built);
  };

  const restart = () => {
    setResponses({});
    setStep(0);
    setResult(null);
    setPhase('questions');
  };

  if (loading || !user || !hydrated) {
    return (
      <MainLayout>
        <div className="container max-w-3xl mx-auto py-12 px-4 text-center text-muted-foreground">
          Loading…
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-3xl mx-auto py-10 px-4 space-y-8">
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
            <Compass className="h-7 w-7" />
            Find your ikigai
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Ikigai is the overlap of what you love, what you&apos;re good at, what the world needs, and
            what you can be paid for. Answer a few questions — we&apos;ll map your circles.
          </p>
        </div>

        {phase === 'intro' && (
          <Card className="border-talendeur-navy/20">
            <CardHeader>
              <CardTitle className="text-talendeur-navy">How it works</CardTitle>
              <CardDescription>
                Eight short prompts across the four classic ikigai circles. Separate ideas with commas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {(Object.keys(IKIGAI_PILLARS) as IkigaiPillar[]).map((key) => (
                  <div
                    key={key}
                    className="rounded-md border p-3"
                    style={{ borderColor: IKIGAI_PILLARS[key].color }}
                  >
                    <p className="font-semibold" style={{ color: IKIGAI_PILLARS[key].color }}>
                      {IKIGAI_PILLARS[key].title}
                    </p>
                    <p className="text-xs text-muted-foreground">{IKIGAI_PILLARS[key].subtitle}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setPhase('questions')}
                  className="bg-talendeur-navy hover:bg-talendeur-navy/90 text-white"
                >
                  Start
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {result && (
                  <Button
                    variant="outline"
                    className="border-talendeur-navy text-talendeur-navy"
                    onClick={() => setPhase('result')}
                  >
                    View last result
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {phase === 'questions' && question && (
          <Card className="border-talendeur-navy/20">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-1"
                    style={{ color: IKIGAI_PILLARS[question.pillar].color }}
                  >
                    {IKIGAI_PILLARS[question.pillar].title}
                  </p>
                  <CardTitle className="text-xl text-talendeur-navy">{question.prompt}</CardTitle>
                  <CardDescription className="mt-2">{question.hint}</CardDescription>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {step + 1} / {IKIGAI_QUESTIONS.length}
                </span>
              </div>
              <Progress value={((step + 1) / IKIGAI_QUESTIONS.length) * 100} className="mt-4 h-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                rows={5}
                value={responses[question.id] || ''}
                placeholder={question.placeholder}
                onChange={(e) =>
                  setResponses((prev) => ({ ...prev, [question.id]: e.target.value }))
                }
              />
              <div className="flex flex-wrap justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={step === 0}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {step < IKIGAI_QUESTIONS.length - 1 ? (
                  <Button
                    type="button"
                    disabled={!canContinue}
                    className="bg-talendeur-navy hover:bg-talendeur-navy/90 text-white"
                    onClick={() => setStep((s) => s + 1)}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={!canContinue}
                    className="bg-talendeur-navy hover:bg-talendeur-navy/90 text-white"
                    onClick={finish}
                  >
                    See my ikigai
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {phase === 'result' && result && (
          <div className="space-y-6">
            <Card className="border-talendeur-navy/30">
              <CardHeader>
                <CardTitle className="text-talendeur-navy">Your ikigai map</CardTitle>
                <CardDescription>
                  Updated {new Date(result.generatedAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{result.summary}</p>
                {result.intersections.ikigai.length > 0 && (
                  <div className="rounded-md bg-talendeur-navy text-white p-4">
                    <p className="text-xs uppercase tracking-wide text-white/70 mb-1">Centre</p>
                    <p className="font-semibold text-lg">
                      {result.intersections.ikigai.slice(0, 4).join(' · ')}
                    </p>
                  </div>
                )}
                <IkigaiDiagram result={result} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-talendeur-navy">Your four circles</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                {(Object.keys(IKIGAI_PILLARS) as IkigaiPillar[]).map((pillar) => (
                  <div
                    key={pillar}
                    className="rounded-md border p-4"
                    style={{ borderColor: IKIGAI_PILLARS[pillar].color }}
                  >
                    <p className="font-semibold mb-2" style={{ color: IKIGAI_PILLARS[pillar].color }}>
                      {IKIGAI_PILLARS[pillar].title}
                    </p>
                    <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                      {result.answers[pillar].map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={restart}
                variant="outline"
                className="border-talendeur-navy text-talendeur-navy"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retake questionnaire
              </Button>
              <Button asChild className="bg-talendeur-navy hover:bg-talendeur-navy/90 text-white">
                <Link to="/profilerecommendations">Use this in profile recommendations</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default FindIkigai;
