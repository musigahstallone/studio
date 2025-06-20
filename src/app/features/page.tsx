
"use client"; // Added 'use client' for Framer Motion

import { PublicPageShell } from '@/components/layout/PublicPageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Cpu, SlidersHorizontal, LandmarkIcon as LandmarkLucideIcon, Coins, ScanLine, TextSearch, Camera, FileUp, UserCog, Palette, ShieldAlert, Users, LineChart } from 'lucide-react'; // Renamed LandmarkIcon to LandmarkLucideIcon
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion'; // Import motion

// Helper icons (ensure these are used if Lucide alternatives are not preferred or if specific style is needed)
const Percent = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>;
const AlertTriangle = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>;
const DollarSign = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const Target = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
const Edit = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>;
const Landmark = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" x2="21" y1="22" y2="22"></line><line x1="6" x2="6" y1="18" y2="11"></line><line x1="10" x2="10" y1="18" y2="11"></line><line x1="14" x2="14" y1="18" y2="11"></line><line x1="18" x2="18" y1="18" y2="11"></line><polygon points="12 2 20 7 4 7"></polygon></svg>;
const Shuffle = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"></path><path d="m18 2 4 4-4 4"></path><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"></path><path d="M22 18h-5.9c-1.3 0-2.5-.6-3.3-1.7l-.5-.8"></path><path d="m18 22 4-4-4-4"></path></svg>;

const sectionAnimationProps = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: 0.7, ease: "easeOut" },
};

const detailedFeatures = [
  {
    id: 'ai-tracking',
    icon: Cpu,
    title: 'AI-Powered Expense Tracking',
    summary: 'Automate data entry and gain intelligent insights with our AI.',
    points: [
      { icon: TextSearch, title: 'Text-to-Transaction', description: 'Simply type descriptions like "Lunch at Cafe Mocha $12.50" or "Salary received 2000 EUR". Our AI parses the merchant, amount, date, category, transaction type, and generates a concise description.' },
      { icon: FileUp, title: 'Receipt & Document Upload', description: 'Upload an image of a receipt or financial document. The AI automatically extracts key details, saving you manual entry time.' },
      { icon: Camera, title: 'Camera Scanning', description: "Use your device's camera to instantly scan receipts and documents for AI-driven data extraction." },
      { icon: ScanLine, title: 'Automatic Categorization & Refinement', description: 'Benefit from AI-driven category suggestions and refined transaction descriptions for clarity in your expense list.' },
    ],
    image: { src: "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", alt: "AI processing a financial document", hint: "ai document finance" }
  },
  {
    id: 'budgets',
    icon: SlidersHorizontal,
    title: 'Comprehensive Budget Management',
    summary: 'Take control of your spending with flexible and insightful budgeting tools.',
    points: [
      { icon: Edit, title: 'Create & Manage Budgets', description: 'Easily set up budgets for various expense categories with specific spending limits.' },
      { icon: LineChart, title: 'Real-Time Tracking', description: 'Monitor your spending progress against your budgets in real-time with visual indicators like progress bars.' },
      { icon: AlertTriangle, title: 'Over-Budget Warnings', description: 'Opt-in to receive notifications if a transaction is about to exceed a category’s budget limit, helping you stay on track.' },
    ],
    image: { src: "https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", alt: "Budget tracking interface with charts", hint: "budget chart graph" }
  },
  {
    id: 'savings-goals',
    icon: LandmarkLucideIcon, // Using the aliased Lucide icon
    title: 'Intelligent Savings Goals Management',
    summary: 'Achieve your financial dreams with smart savings goal features.',
    points: [
      { icon: Target, title: 'Set & Track Goals', description: 'Create savings goals with specific target amounts and define timelines using either a target date or a fixed duration.' },
      { icon: DollarSign, title: 'Flexible Contributions & Withdrawals', description: 'Contribute funds to your goals, automatically creating linked expense transactions. Withdraw funds with options for early withdrawal (configurable penalty rates) and penalty-free conditions.' },
      { icon: Percent, title: 'Sophisticated Penalty Calculation', description: 'Understand the implications of early withdrawals with transparent penalty and transaction cost calculations.' },
    ],
    image: { src: "https://images.pexels.com/photos/2068975/pexels-photo-2068975.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", alt: "Savings goal progress, piggy bank concept", hint: "savings piggybank money" }
  },
  {
    id: 'multi-currency',
    icon: Coins,
    title: 'Multi-Currency Support',
    summary: 'Manage your finances globally with ease.',
    points: [
      { icon: Landmark, title: 'Local Input & Display', description: 'Set your preferred currency (KES, USD, EUR) for entering transaction amounts and choose the currency for displaying all monetary values throughout the app.' },
      { icon: Shuffle, title: 'Automatic Conversion', description: 'Expenses are converted to a base storage currency (USD) for consistency, with on-the-fly conversion for display in your chosen currency.' },
    ],
    image: { src: "https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", alt: "Different currency symbols", hint: "currency exchange global" }
  },
];

export default function FeaturesPage() {
  const featuresToDisplay = detailedFeatures; // No longer filtering 'customization-admin' as it's removed

  return (
    <PublicPageShell>
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground font-headline">
            Powerful Features, Effortless Control
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover how SM Cash empowers you to manage your finances intelligently and achieve your goals with ease.
          </p>
        </motion.header>

        <div className="space-y-16 md:space-y-24">
          {featuresToDisplay.map((feature, index) => (
            <motion.section
              key={feature.id}
              id={feature.id}
              className="scroll-mt-20"
              {...sectionAnimationProps}
              transition={{ ...sectionAnimationProps.transition, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden shadow-xl border-border">
                <div className="grid md:grid-cols-2 items-center gap-0 md:gap-12">
                  <motion.div
                    className={cn(
                      "relative h-64 md:h-full min-h-[300px]",
                      index % 2 === 1 ? "md:order-2" : "md:order-1"
                    )}
                    initial={{ opacity: 0, x: index % 2 === 1 ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Image
                      src={feature.image.src}
                      alt={feature.image.alt}
                      layout="fill"
                      objectFit="cover"
                      className="opacity-90"
                      data-ai-hint={feature.image.hint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent md:hidden"></div>
                    <div
                      className={cn(
                        "absolute inset-0 hidden md:block",
                        index % 2 === 1
                          ? "bg-gradient-to-l from-background/30 to-transparent"
                          : "bg-gradient-to-r from-background/30 to-transparent"
                      )}
                    ></div>
                  </motion.div>

                  <motion.div
                    className={cn(
                      "p-6 md:p-10",
                      index % 2 === 1 ? "md:order-1" : "md:order-2"
                    )}
                    initial={{ opacity: 0, x: index % 2 === 1 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-lg mb-4">
                      <feature.icon className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3 font-headline">{feature.title}</h2>
                    <p className="text-md text-muted-foreground mb-6">{feature.summary}</p>
                    <ul className="space-y-4">
                      {feature.points.map((point, pIndex) => (
                        <motion.li 
                          key={point.title} 
                          className="flex items-start"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.5 }}
                          transition={{ duration: 0.4, delay: 0.3 + pIndex * 0.1 }}
                        >
                          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 mt-1">
                            <point.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{point.title}</h4>
                            <p className="text-sm text-muted-foreground">{point.description}</p>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </div>
              </Card>
            </motion.section>
          ))}
        </div>

        <motion.section
          {...sectionAnimationProps}
          className="mt-16 md:mt-24 text-center py-12 bg-muted/30 dark:bg-muted/10 rounded-lg"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 font-headline">
            Ready to Simplify Your Finances?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Take the first step towards financial clarity and control with SM Cash.
          </p>
          <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow text-lg px-8 py-6">
            <Link href="/login">
              Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.section>
      </div>
    </PublicPageShell>
  );
}
