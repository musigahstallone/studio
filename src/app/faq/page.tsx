
"use client"; // Added 'use client' for Framer Motion

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
import { motion } from 'framer-motion'; // Import motion

const headingAnimationProps = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const cardAnimationProps = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, delay: 0.2, ease: "easeOut" },
};

const accordionItemAnimationProps = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }, // Added exit for potential future use with AnimatePresence
  transition: { duration: 0.3, ease: "easeOut" },
};

export default function FAQPage() {
  return (
    <PublicPageShell>
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-3xl mx-auto">
          <motion.div {...headingAnimationProps}>
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
          </motion.div>

          <motion.div {...cardAnimationProps}>
            <Card className="shadow-xl border-border">
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    custom={index} // For potential stagger
                    initial="initial"
                    animate="animate"
                    variants={{
                      initial: { opacity: 0, y: 20 },
                      animate: (i) => ({
                        opacity: 1,
                        y: 0,
                        transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
                      }),
                    }}
                  >
                    <AccordionItem value={`item-${index + 1}`} className={index === faqData.length - 1 ? "border-b-0" : ""}>
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
                  </motion.div>
                ))}
              </Accordion>
            </Card>
          </motion.div>
        </div>
      </div>
    </PublicPageShell>
  );
}
