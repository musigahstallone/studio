
import { PublicPageShell } from '@/components/layout/PublicPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <PublicPageShell>
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none mx-auto">
            <p className="text-muted-foreground text-center mb-6">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using PennyPincher AI (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this Service.</p>

            <h2>2. Description of Service</h2>
            <p>PennyPincher AI provides users with tools for personal expense tracking, budget management, savings goal management, and AI-powered financial data processing. The Service is provided "as-is" and we assume no responsibility for the timeliness, deletion, mis-delivery, or failure to store any user communications or personalization settings.</p>

            <h2>3. User Responsibilities</h2>
            <ul>
              <li>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.</li>
              <li>You agree to accept responsibility for all activities that occur under your account or password.</li>
              <li>You agree not to use the Service for any unlawful purpose or in any way that might harm, damage, or disparage any other party.</li>
              <li>You are responsible for the accuracy of the data you input into the Service.</li>
            </ul>
            
            <h2>4. AI Features</h2>
            <ul>
              <li>The Service utilizes artificial intelligence (AI) models for features such as transaction categorization and data extraction.</li>
              <li>While we strive for accuracy, AI-generated content may occasionally be incorrect or incomplete. You should review and verify any AI-generated data before relying on it for financial decisions.</li>
              <li>Your use of AI features is subject to the terms of our third-party AI service providers.</li>
            </ul>

            <h2>5. Financial Disclaimer</h2>
            <p>PennyPincher AI is a tool for personal financial management and tracking. It is not intended to provide financial, investment, legal, or tax advice. You should consult with a qualified professional for such advice. We are not responsible for any financial decisions or actions taken based on the information provided by the Service.</p>

            <h2>6. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are owned by PennyPincher AI and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>

            <h2>7. Termination</h2>
            <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

            <h2>8. Limitation of Liability</h2>
            <p>In no event shall PennyPincher AI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>

            <h2>9. Changes to Terms</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms of Service on this page.</p>

            <h2>10. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us via the <Link href="/contact" className="text-primary hover:underline">Contact Us page</Link>.</p>
            
            <p className="mt-8 text-center text-xs text-muted-foreground">This is a sample Terms of Service. For a real application, consult with a legal professional.</p>
          </CardContent>
        </Card>
      </div>
    </PublicPageShell>
  );
}

    