
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PublicPageShell } from '@/components/layout/PublicPageShell';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Cpu, SlidersHorizontal, LandmarkIcon, Coins, ScanLine, TextSearch, Edit } from 'lucide-react';
import Image from 'next/image';

const features = [
  {
    icon: Cpu,
    title: 'AI-Powered Tracking',
    description: 'Automate expense entry from text, receipts, or camera scans. Smart categorization and description refinement.',
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    icon: SlidersHorizontal,
    title: 'Comprehensive Budgets',
    description: 'Create, manage, and track budgets across categories with real-time progress and over-limit warnings.',
    bgColor: 'bg-accent/10',
    iconColor: 'text-accent',
  },
  {
    icon: LandmarkIcon,
    title: 'Intelligent Savings Goals',
    description: 'Set savings targets with flexible timelines, contribute funds, and manage withdrawals with smart penalty calculations.',
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-600',
  },
  {
    icon: Coins,
    title: 'Multi-Currency Support',
    description: 'Input expenses in your local currency (KES, USD, EUR) and view all financials in your preferred display currency.',
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-600',
  },
];

const howItWorksSteps = [
  {
    icon: Edit,
    title: 'Sign Up & Set Up',
    description: 'Create your free account in minutes. Customize your currency and theme preferences.',
  },
  {
    icon: TextSearch,
    title: 'Add Transactions Effortlessly',
    description: 'Use text input, upload receipts, or scan with your camera. Our AI handles the data entry.',
  },
  {
    icon: ScanLine, // Using ScanLine as a generic 'track' icon
    title: 'Track & Achieve',
    description: 'Monitor your spending against budgets, watch your savings grow, and gain insights into your financial habits.',
  },
];

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // If auth is still loading, or if user is defined (and redirect hasn't happened yet),
  // show a minimal loader or nothing to prevent flash of landing page content for authenticated users.
  if (authLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <PublicPageShell>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-background to-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 font-headline">
            PennyPincher AI: <span className="text-primary">Smart</span> Finance, <span className="text-primary">Simplified</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Effortlessly manage your expenses, budgets, and savings goals with the power of AI. Gain clarity and take control of your financial future today.
          </p>
          <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/login">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
           <div className="mt-12 relative aspect-video max-w-4xl mx-auto rounded-xl shadow-2xl overflow-hidden border border-border">
            <Image 
                src="https://placehold.co/1200x675.png" // Replace with actual app screenshot or illustration
                alt="PennyPincher AI Dashboard Preview" 
                layout="fill"
                objectFit="cover"
                priority
                data-ai-hint="dashboard finance app"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-headline">All-In-One Financial Hub</h2>
            <p className="text-md md:text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
              From intelligent expense tracking to sophisticated savings management, PennyPincher AI provides the tools you need.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${feature.bgColor} border-transparent`}>
                <CardHeader className="items-center text-center">
                  <div className={`p-3 rounded-full mb-3 ${feature.bgColor}`}>
                     <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
                  </div>
                  <CardTitle className={`text-xl font-semibold ${feature.iconColor}`}>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-muted/50">
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
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 font-headline">Ready to Transform Your Finances?</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands of users who are gaining financial clarity and achieving their goals with PennyPincher AI.
          </p>
          <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/login">
              Sign Up Now & Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicPageShell>
  );
}

    