
import { PublicPageShell } from '@/components/layout/PublicPageShell';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HelpCircle, Users, Cpu, Shield, CoinsIcon, SlidersHorizontal, LandmarkIcon } from 'lucide-react';

const faqData = [
  {
    id: "what-is",
    icon: HelpCircle,
    question: "What is PennyPincher AI?",
    answer:
      "PennyPincher AI is an intelligent financial management application designed to help you effortlessly track expenses, manage budgets, achieve savings goals, and gain insights into your financial habits using the power of Artificial Intelligence.",
  },
  {
    id: "ai-tracking",
    icon: Cpu,
    question: "How does the AI expense tracking work?",
    answer:
      "You can input transactions by typing free-form text (e.g., \"Lunch at Cafe Mocha $12.50\"), uploading receipt images, or scanning receipts directly with your device's camera. Our AI parses the details, suggests categories, refines descriptions, and helps automate your financial record-keeping.",
  },
  {
    id: "free-to-use",
    icon: Users,
    question: "Is PennyPincher AI free to use?",
    answer:
      "Yes, PennyPincher AI offers a comprehensive set of features for free. We are focused on providing a great core experience for all users. (Future premium features or tiers may be considered, but the current application is free).",
  },
  {
    id: "currencies",
    icon: CoinsIcon,
    question: "What currencies do you support?",
    answer:
      "PennyPincher AI supports multiple currencies for input and display. You can set your preferred local input currency (e.g., KES, USD, EUR) and a separate display currency for viewing all your financial data. Transactions are stored in a base currency (USD) and converted on-the-fly for display.",
  },
  {
    id: "data-security",
    icon: Shield,
    question: "How secure is my financial data?",
    answer:
      "We take your data security very seriously. PennyPincher AI utilizes Firebase, a secure platform by Google, for backend services including authentication and database storage. All data transmission is encrypted. For more detailed information, please review our Privacy Policy.",
  },
  {
    id: "budgets",
    icon: SlidersHorizontal,
    question: "Can I set budgets for different categories?",
    answer:
      "Absolutely! You can create detailed budgets for various expense categories (e.g., Food & Drink, Transportation). The app allows you to track your spending against these budgets in real-time with visual progress indicators and optional warnings if you're nearing or exceeding your limits.",
  },
  {
    id: "savings-goals",
    icon: LandmarkIcon,
    question: "How do Savings Goals work?",
    answer:
      "You can create personalized savings goals with specific target amounts and timelines (either a target date or a duration). Contribute funds towards your goals (which automatically creates linked expense transactions for tracking) and withdraw funds when needed, with options for early withdrawal penalties where applicable. The app helps you visualize your progress towards achieving your financial objectives.",
  },
  {
    id: "developer",
    icon: Users, // Re-using Users icon
    question: "Who developed PennyPincher AI?",
    answer:
      "PennyPincher AI was developed by Stallone Musigah. You can find more information about the developer on the Contact Us page."
  }
];

export default function FAQPage() {
  return (
    <PublicPageShell>
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <CardHeader className="text-center px-0 pb-10">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-4 mx-auto w-16 h-16">
                <HelpCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl md:text-4xl font-headline">
              Frequently Asked Questions
            </CardTitle>
            <CardDescription className="text-md md:text-lg text-muted-foreground mt-3">
              Find answers to common questions about PennyPincher AI. If you can&apos;t find what you&apos;re looking for, feel free to <a href="/contact" className="text-primary hover:underline">contact us</a>.
            </CardDescription>
          </CardHeader>

          <Card className="shadow-xl border-border">
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, index) => (
                <AccordionItem value={`item-${index + 1}`} key={faq.id} className={index === faqData.length - 1 ? "border-b-0" : ""}>
                  <AccordionTrigger className="text-left hover:no-underline px-6 py-4 text-base md:text-lg font-medium hover:bg-muted/50 transition-colors rounded-t-md">
                    <div className="flex items-center">
                       <faq.icon className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                       <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 pt-1 text-sm md:text-base text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </div>
    </PublicPageShell>
  );
}
