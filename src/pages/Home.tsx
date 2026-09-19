
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';

const Home: React.FC = () => {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-white via-talendeur-orange to-talendeur-primary py-20 px-4 text-white">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 order-2 md:order-1">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-full h-full bg-talendeur-orange rounded-xl"></div>
                <img 
                  src="/colab.png"
                  alt="Team collaborating" 
                  className="w-full rounded-xl shadow-xl relative z-10"
                />
              </div>
            </div>
            <div className="flex-1 text-center md:text-right order-1 md:order-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Stop searching. Start becoming.
              </h1>
              <p className="text-lg md:text-xl mb-8 text-white/90">
                Talendeur helps you see yourself in a whole new light. Uncover talents you didn&apos;t know you had, get pointed toward opportunities that fit who you&apos;re growing into, and keep leveling up as you go.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-end">
                <Link to="/register">
                  <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                    Get started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                    Log in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white dark:bg-talendeur-dark">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Talendeur works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
              Your uniqueness, unlocked.
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Talendeur digs into what makes you you — your skills, your strengths, your story — and puts it front and center. Three steps in, you&apos;re already standing out.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            <div className="bg-muted/30 rounded-xl p-6 flex flex-col h-full text-left">
              <div className="w-16 h-16 bg-talendeur-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shrink-0">1</div>
              <h3 className="text-xl font-bold mb-2 text-center">Create profile</h3>
              <p className="text-talendeur-navy font-semibold mb-3">
                Build a profile that actually sounds like you.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                Skip the blank page — upload your CV or LinkedIn and you&apos;re in. Drop a short video and let your strengths do the talking. Then watch it come alive: ikigai maps what drives you, your word cloud shows what you&apos;re about. Complete it, and let the right people find you.
              </p>
            </div>
            
            <div className="bg-muted/30 rounded-xl p-6 flex flex-col h-full text-left">
              <div className="w-16 h-16 bg-talendeur-orange rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shrink-0">2</div>
              <h3 className="text-xl font-bold mb-2 text-center">Share profile</h3>
              <p className="text-talendeur-navy font-semibold mb-3">
                One click. Everywhere.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                Share your Talendeur profile straight to LinkedIn and beyond. Your snapshot preview does the talking — skills, strengths, story — so you&apos;re already standing out before the conversation even starts.
              </p>
            </div>
            
            <div className="bg-muted/30 rounded-xl p-6 flex flex-col h-full text-left">
              <div className="w-16 h-16 bg-talendeur-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shrink-0">3</div>
              <h3 className="text-xl font-bold mb-2 text-center">Discover and get discovered</h3>
              <p className="text-talendeur-navy font-semibold mb-3">
                It goes both ways. And it never stops.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                Browse what&apos;s out there and raise your hand. Opportunities are raising theirs for you too. Along the way, learn, get mentored, and level up — so every match finds you a little more ready than the last.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-white via-talendeur-orange to-talendeur-primary py-20 px-4 text-white">
        <div className="container mx-auto max-w-7xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to find your perfect match?</h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join Talendeur today and revolutionise the way you connect in the professional world.
          </p>
          <Link to="/register">
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
              Get started now
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
};

export default Home;
