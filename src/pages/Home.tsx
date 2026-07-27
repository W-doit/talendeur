
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
                Let perfect opportunities <span className="text-white drop-shadow-lg">discover you</span> with Talendeur
              </h1>
              <p className="text-lg md:text-xl mb-8 text-white/90">
                Talendeur connects organisations with individuals based their unique talent, skills and experience creating a place for fostering meaningful connections
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-end">
                <Link to="/register">
                  <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                    Sign In
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Talendeur Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Talendeur makes you stand out from crowd by highlighting your uniqueness based on your skills, competencies and experience. Get started with 3 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-muted/30 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-talendeur-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold mb-3">Create Your Profile</h3>
              <p className="text-muted-foreground">
                Create your profile with a easy click by uploading CV or your LinkedIn profile. Upload your 2 min video to describe your superpowers. Complete your profile to get discovered
              </p>
            </div>
            
            <div className="bg-muted/30 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-talendeur-orange rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold mb-3">Share Your Profile</h3>
              <p className="text-muted-foreground">
                Share your Talendeur profile with a simple click on LinkedIn and other social platforms. Your unique snapshot preview showcases your skills and experience, making you stand out when opportunities come knocking
              </p>
            </div>
            
            <div className="bg-muted/30 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-talendeur-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold mb-3">Discover and Get Discovered</h3>
              <p className="text-muted-foreground">
                Browse through potential opportunities and show interest, and also notice the organisations showing interest in your profile at the same time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how Talendeur has helped professionals and organisations find their perfect match.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-talendeur-dark rounded-xl p-8 shadow-md">
              <p className="text-lg mb-6 italic">
                "Talendeur completely changed my job search. Instead of sending out countless applications, I was able to connect with companies that truly valued my specific skill set."
              </p>
              <div className="flex items-center">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop" 
                  alt="Sarah T." 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-bold">Sarah T.</h4>
                  <p className="text-sm text-muted-foreground">UX Designer</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-talendeur-dark rounded-xl p-8 shadow-md">
              <p className="text-lg mb-6 italic">
                "As a fast-growing startup, finding the right talent was our biggest challenge. Talendeur helped us connect with professionals who were not just qualified, but also aligned with our mission."
              </p>
              <div className="flex items-center">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop" 
                  alt="Michael R." 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-bold">Michael R.</h4>
                  <p className="text-sm text-muted-foreground">CTO at TechInnovate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-white via-talendeur-orange to-talendeur-primary py-20 px-4 text-white">
        <div className="container mx-auto max-w-7xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Find Your Perfect Match?</h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join Talendeur today and revolutionize the way you connect in the professional world.
          </p>
          <Link to="/register">
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
};

export default Home;
