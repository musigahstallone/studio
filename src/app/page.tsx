
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PublicPageShell } from '@/components/layout/PublicPageShell';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Cpu, SlidersHorizontal, LandmarkIcon, Coins, ScanLine, TextSearch, Edit, LogIn } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { featuresSummary, howItWorksSteps } from '@/lib/randomData';

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    } else if (!authLoading && !user) {
      const justLoggedOut = sessionStorage.getItem('justLoggedOut') === 'true';
      const loginPromptShown = sessionStorage.getItem('loginPromptShown') === 'true';

      if (justLoggedOut || !loginPromptShown) {
        toast({
          title: 'Welcome to SM Cash!',
          description: 'Ready to manage your finances? Log in or create an account to get started.',
          action: (
            <Button asChild variant="outline" size="sm" className="mt-2 sm:mt-0 ml-0 sm:ml-2">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login / Sign Up
              </Link>
            </Button>
          ),
          duration: 15000,
          className: "rounded-xl shadow-lg border-primary/20 bg-card",
        });
        if (!justLoggedOut) {
          sessionStorage.setItem('loginPromptShown', 'true');
        }
        if (justLoggedOut) {
          sessionStorage.removeItem('justLoggedOut');
        }
      }
    }
  }, [user, authLoading, router, toast]);


  if (authLoading || (!authLoading && user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PublicPageShell>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-background to-muted/30 dark:from-background dark:to-muted/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 font-headline">
            SM Cash: <span className="text-primary">Smart</span> Finance, <span className="text-primary">Simplified</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Effortlessly manage your expenses, budgets, and savings goals with the power of AI. Gain clarity and take control of your financial future today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/login">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/features">
                Learn More <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <div className="mt-16 relative aspect-[16/9] max-w-4xl mx-auto rounded-xl shadow-2xl overflow-hidden border border-border">
            <Image
              src="https://placehold.co/1200x675.png"
              alt="SM Cash Dashboard Preview"
              layout="fill"
              objectFit="cover"
              priority
              data-ai-hint="dashboard finance app"
            />
          </div>
        </div>
      </section>

      {/* Features Summary Section */}
      <section id="features-summary" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-headline">Key Features at a Glance</h2>
            <p className="text-md md:text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
              Discover how SM Cash can revolutionize your financial management.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuresSummary.map((feature) => (
              <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card border-border flex flex-col">
                <CardHeader className="items-center text-center">
                  <div className={`p-3 rounded-full mb-3 bg-primary/10 dark:bg-primary/20`}>
                    <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
                  </div>
                  <CardTitle className={`text-xl font-semibold text-foreground`}>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center flex-grow">
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button asChild variant="link" size="lg" className="text-primary text-lg">
              <Link href="/features">
                Explore All Features in Detail <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-muted/30 dark:bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-headline">Get Started in 3 Simple Steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <div key={step.title} className="text-center p-6 bg-card rounded-lg shadow-lg">
                <div className="mb-4 inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{index + 1}. {step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-2xl mx-auto p-8 md:p-12 shadow-2xl bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/5 dark:to-accent/5">
            <CardHeader className="p-0">
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary mb-4 font-headline">Ready to Transform Your Finances?</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Join thousands of users who are gaining financial clarity and achieving their goals with SM Cash.
              </p>
              <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow text-lg px-8 py-6">
                <Link href="/login">
                  Sign Up Now & Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicPageShell>
  );
}
