
import { PublicPageShell } from '@/components/layout/PublicPageShell';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { faqData } from '@/lib/randomData';
import { HelpCircle } from 'lucide-react';

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
              Find answers to common questions about SM Cash. If you can&apos;t find what you&apos;re looking for, feel free to <a href="/contact" className="text-primary hover:underline">contact us</a>.
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
                    <span dangerouslySetInnerHTML={{ __html: faq.answer }} />
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
