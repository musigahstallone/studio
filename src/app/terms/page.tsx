
import { PublicPageShell } from '@/components/layout/PublicPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TermsOfServicePage() {
  const sections = [
    {
      number: "1.",
      title: "Acceptance of Terms",
      content: [
        <p key="1p1">By accessing and using SM Cash (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this Service.</p>
      ]
    },
    {
      number: "2.",
      title: "Description of Service",
      content: [
        <p key="2p1">SM Cash provides users with tools for personal expense tracking, budget management, savings goal management, and AI-powered financial data processing. The Service is provided "as-is" and we assume no responsibility for the timeliness, deletion, mis-delivery, or failure to store any user communications or personalization settings.</p>
      ]
    },
    {
      number: "3.",
      title: "User Responsibilities",
      content: [
        <ul key="3ul1" className="list-disc space-y-1">
          <li>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.</li>
          <li>You agree to accept responsibility for all activities that occur under your account or password.</li>
          <li>You agree not to use the Service for any unlawful purpose or in any way that might harm, damage, or disparage any other party.</li>
          <li>You are responsible for the accuracy of the data you input into the Service.</li>
        </ul>
      ]
    },
    {
      number: "4.",
      title: "AI Features",
      content: [
        <ul key="4ul1" className="list-disc space-y-1">
          <li>The Service utilizes artificial intelligence (AI) models for features such as transaction categorization and data extraction.</li>
          <li>While we strive for accuracy, AI-generated content may occasionally be incorrect or incomplete. You should review and verify any AI-generated data before relying on it for financial decisions.</li>
          <li>Your use of AI features is subject to the terms of our third-party AI service providers.</li>
        </ul>
      ]
    },
    {
      number: "5.",
      title: "Financial Disclaimer",
      content: [
        <p key="5p1">SM Cash is a tool for personal financial management and tracking. It is not intended to provide financial, investment, legal, or tax advice. You should consult with a qualified professional for such advice. We are not responsible for any financial decisions or actions taken based on the information provided by the Service.</p>
      ]
    },
    {
      number: "6.",
      title: "Intellectual Property",
      content: [
        <p key="6p1">The Service and its original content, features, and functionality are owned by SM Cash and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
      ]
    },
    {
      number: "7.",
      title: "Termination",
      content: [
        <p key="7p1">We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
      ]
    },
    {
      number: "8.",
      title: "Limitation of Liability",
      content: [
        <p key="8p1">In no event shall SM Cash, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
      ]
    },
    {
      number: "9.",
      title: "Changes to Terms",
      content: [
        <p key="9p1">We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms of Service on this page.</p>
      ]
    },
    {
      number: "10.",
      title: "Contact Us",
      content: [
        <p key="10p1">If you have any questions about these Terms, please contact us via the <Link href="/contact" className="text-primary hover:underline">Contact Us page</Link>.</p>
      ]
    }
  ];

  return (
    <PublicPageShell>
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-4 md:px-8 md:py-6">
            <p className="text-muted-foreground text-center mb-6">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="space-y-6"> {/* Manages spacing between sections */}
              {sections.map((section) => (
                <div key={section.number}> {/* Outer wrapper for each section */}

                  {/* == SMALL SCREEN LAYOUT (stacked: Number+Title then Content) == */}
                  <div className="md:hidden">
                    <div className="flex items-baseline space-x-2 mb-2"> {/* Number and Title on one line */}
                      <span className="text-lg font-bold text-primary font-mono">
                        {section.number}
                      </span>
                      <h2 className="text-base font-semibold text-foreground">
                        {section.title}
                      </h2>
                    </div>
                    {/* Content styled by prose */}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {section.content}
                    </div>
                  </div>

                  {/* == LARGE SCREEN (md and up) LAYOUT (offset Number, then Title & Content) == */}
                  <div className="hidden md:flex md:items-start md:space-x-4">
                    {/* Number offset */}
                    <span className="mt-px text-xl font-bold text-primary font-mono shrink-0 w-10 text-right pr-2">
                      {section.number}
                    </span>
                    {/* Title and Content in the main column */}
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-foreground mt-0 mb-2">
                        {section.title}
                      </h2>
                      <div className="prose prose-base dark:prose-invert max-w-none">
                        {section.content}
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </CardContent>
        </Card>
      </div>
    </PublicPageShell>
  );
}
