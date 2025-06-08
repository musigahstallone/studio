
import { PublicPageShell } from '@/components/layout/PublicPageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '@/components/contact/ContactForm';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactUsPage() {
  return (
    <PublicPageShell>
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <CardHeader className="text-center px-0 pb-8">
            <CardTitle className="text-3xl md:text-4xl font-headline">Get In Touch</CardTitle>
            <CardDescription className="text-md md:text-lg text-muted-foreground mt-2">
              We&apos;d love to hear from you! Whether you have a question about features, trials, pricing, or anything else, our team is ready to answer all your questions.
            </CardDescription>
          </CardHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Send us a Message</CardTitle>
                <CardDescription>Fill out the form and we&apos;ll get back to you shortly.</CardDescription>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>

            <div className="space-y-6 mt-4 md:mt-0">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Email Us</h4>
                      <a href="mailto:support@pennypincherai.example.com" className="text-muted-foreground hover:text-primary break-all">
                        support@pennypincherai.example.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Call Us (Placeholder)</h4>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    </div>
                  </div>
                   <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Our Office (Placeholder)</h4>
                      <p className="text-muted-foreground">123 Finance St, Moneyville, USA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
               <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Note on Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        We aim to respond to all inquiries within 24-48 business hours.
                        Please note that this contact form currently simulates sending a message. For urgent issues, refer to alternative contact methods if available.
                    </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}

    