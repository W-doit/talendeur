
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';

const Home: React.FC = () => {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-talendeur-orange via-talendeur-orange to-talendeur-primary py-12 sm:py-16 md:py-20 px-4 text-white overflow-x-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-12">
            <div className="w-full md:flex-1 order-2 md:order-1 min-w-0 mt-2 md:mt-0">
              <div className="relative pt-4 pl-4 sm:pt-6 sm:pl-6">
                <div
                  className="hidden sm:block absolute inset-0 sm:-translate-x-3 sm:-translate-y-3 md:-translate-x-6 md:-translate-y-6 bg-talendeur-orange/80 rounded-xl"
                  aria-hidden
                />
                <img
                  src="/colab.png"
                  alt="Team collaborating"
                  className="relative z-10 w-full max-w-full h-auto rounded-xl shadow-xl"
                />
              </div>
            </div>
            <div className="w-full md:flex-1 text-center md:text-right order-1 md:order-2 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 sm:mb-6 leading-[1.25] sm:leading-[1.2] break-words tracking-normal">
                Stop searching. Start becoming.
              </h1>
              <p className="text-base sm:text-lg md:text-xl mb-8 text-white/95 leading-7 sm:leading-8 break-words">
                Talendeur helps you see yourself in a whole new light. Uncover talents you didn&apos;t know you had, get pointed toward opportunities that fit who you&apos;re growing into, and keep leveling up as you go.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-end w-full mb-2">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white/10"
                  >
                    Get started
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white/10"
                  >
                    Log in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-white dark:bg-talendeur-dark overflow-x-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-[1.25]">
              How Talendeur works
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-2 font-medium leading-7">
              Your uniqueness, unlocked.
            </p>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-7">
              Talendeur digs into what makes you you — your skills, your strengths, your story — and puts it front and center. Three steps in, you&apos;re already standing out.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
            <div className="bg-muted/30 rounded-xl p-5 sm:p-6 flex flex-col h-full text-left min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-talendeur-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shrink-0">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-center">Create profile</h3>
              <p className="text-talendeur-navy font-semibold mb-3 leading-snug">
                Build a profile that actually sounds like you.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                Skip the blank page — upload your CV or LinkedIn and you&apos;re in. Drop a short video and let your strengths do the talking. Then watch it come alive: ikigai maps what drives you, your word cloud shows what you&apos;re about. Complete it, and let the right people find you.
              </p>
            </div>

            <div className="bg-muted/30 rounded-xl p-5 sm:p-6 flex flex-col h-full text-left min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-talendeur-orange rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shrink-0">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-center">Share profile</h3>
              <p className="text-talendeur-navy font-semibold mb-3 leading-snug">
                One click. Everywhere.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                Share your Talendeur profile straight to LinkedIn and beyond. Your snapshot preview does the talking — skills, strengths, story — so you&apos;re already standing out before the conversation even starts.
              </p>
            </div>

            <div className="bg-muted/30 rounded-xl p-5 sm:p-6 flex flex-col h-full text-left min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-talendeur-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shrink-0">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-center leading-snug">
                Discover and get discovered
              </h3>
              <p className="text-talendeur-navy font-semibold mb-3 leading-snug">
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
      <section className="bg-gradient-to-br from-talendeur-orange via-talendeur-orange to-talendeur-primary py-12 sm:py-16 md:py-20 px-4 text-white overflow-x-hidden">
        <div className="container mx-auto max-w-7xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 leading-[1.25] break-words">
            Ready to find your perfect match?
          </h2>
          <p className="text-base sm:text-xl mb-6 sm:mb-8 text-white/95 max-w-2xl mx-auto leading-7 sm:leading-8">
            Join Talendeur today and revolutionise the way you connect in the professional world.
          </p>
          <Link to="/register" className="inline-block w-full sm:w-auto max-w-xs mx-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full bg-transparent border-white text-white hover:bg-white/10"
            >
              Get started now
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
};

export default Home;
