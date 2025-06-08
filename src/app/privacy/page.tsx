
import { PublicPageShell } from '@/components/layout/PublicPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link'; 

export default function PrivacyPolicyPage() {
  return (
    <PublicPageShell>
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none mx-auto">
            <p className="text-muted-foreground text-center mb-6">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2>1. Introduction</h2>
            <p>Welcome to PennyPincher AI ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.</p>

            <h2>2. Information We Collect</h2>
            <p>We may collect personal information that you provide to us directly, such as:</p>
            <ul>
              <li>Account Information: Name, email address, password.</li>
              <li>Financial Information: Transaction details (description, amount, date, category, merchant), budget information, savings goal details. Receipts or documents you upload.</li>
              <li>User Content: Text descriptions you provide for AI processing.</li>
            </ul>
            <p>We also collect some information automatically:</p>
            <ul>
                <li>Usage Data: Information about how you interact with our app.</li>
                <li>Device Information: IP address, browser type, operating system. (Standard server logs)</li>
            </ul>


            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, operate, and maintain our application.</li>
              <li>Process your transactions and manage your financial data.</li>
              <li>Improve, personalize, and expand our application.</li>
              <li>Communicate with you, including for customer service and updates.</li>
              <li>For AI features, such as categorizing expenses and extracting data from receipts. Data processed by AI models is handled according to the terms of our AI service providers (e.g., Google Gemini).</li>
              <li>Prevent fraudulent activity and ensure security.</li>
            </ul>

            <h2>4. Sharing Your Information</h2>
            <p>We do not sell your personal information. We may share your information in the following situations:</p>
            <ul>
              <li>With Service Providers: We may share your information with third-party vendors and service providers that perform services for us or on our behalf (e.g., cloud hosting, AI model providers). These providers are obligated to protect your data.</li>
              <li>For Legal Reasons: If required by law or in response to valid requests by public authorities.</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.</p>

            <h2>6. Your Data Rights</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. Please contact us to exercise these rights.</p>

            <h2>7. Third-Party AI Services</h2>
            <p>Our application utilizes generative AI models (e.g., Google Gemini via Genkit) to provide features like expense categorization and data extraction. When you use these features, relevant data (like text descriptions or receipt images) is sent to these AI services for processing. We configure these services with user data privacy in mind, but the processing is subject to the terms and privacy policies of the respective AI service providers. We do not store your raw receipt images long-term after processing unless explicitly stated for a feature; they are processed and then a URL might be stored if you choose to link it to a transaction.</p>

            <h2>8. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

            <h2>9. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us via the <Link href="/contact" className="text-primary hover:underline">Contact Us page</Link>.</p>
            
          </CardContent>
        </Card>
      </div>
    </PublicPageShell>
  );
}
