
"use client"; // Added 'use client' for Framer Motion

import { PublicPageShell } from '@/components/layout/PublicPageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '@/components/contact/ContactForm';
import { Mail, Phone, Globe, User } from 'lucide-react';
import { motion } from 'framer-motion'; // Import motion

const headingAnimationProps = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const cardAnimationProps = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: delay + 0.2, ease: "easeOut" },
});

const noteAnimationProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: 0.6, ease: "easeOut" },
};

export default function ContactUsPage() {
  return (
    <PublicPageShell>
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <motion.div {...headingAnimationProps}>
            <CardHeader className="text-center px-0 pb-8">
              <CardTitle className="text-3xl md:text-4xl font-headline">Get In Touch</CardTitle>
              <CardDescription className="text-md md:text-lg text-muted-foreground mt-2">
                We&apos;d love to hear from you! Whether you have a question about features, trials, pricing, or anything else, our team is ready to answer all your questions.
              </CardDescription>
            </CardHeader>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
            <motion.div {...cardAnimationProps(0)}>
              <Card className="shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="text-xl">Send us a Message</CardTitle>
                  <CardDescription>Fill out the form for app-related inquiries.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactForm />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...cardAnimationProps(0.15)}>
              <Card className="shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="text-xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-1">App Support</h4>
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium">Email App Support</p>
                        <a href="mailto:support@smcash.org" className="text-muted-foreground hover:text-primary break-all">
                          support@smcash.org
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <h4 className="font-semibold mb-2">Developer Contact</h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <User className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
                        <div>
                          <p className="font-medium">Name</p>
                          <p className="text-muted-foreground">Stallone Musigah</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Mail className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
                        <div>
                          <p className="font-medium">Email Developer</p>
                          <a href="mailto:musigahstallone@gmail.com" className="text-muted-foreground hover:text-primary break-all">
                            musigahstallone@gmail.com
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
                        <div>
                          <p className="font-medium">Phone</p>
                          <p className="text-muted-foreground">+254 797 204141</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Globe className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
                        <div>
                          <p className="font-medium">Website</p>
                          <a href="https://musigahstallone.tech" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary break-all">
                            musigahstallone.tech
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div {...noteAnimationProps}>
            <div className="mt-12 pt-8 border-t border-border/50 text-center">
              <h4 className="text-lg font-semibold text-primary mb-2 font-headline">Note on Response Time</h4>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                We aim to respond to all inquiries within 24-48 business hours.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </PublicPageShell>
  );
}
