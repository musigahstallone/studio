
import { PublicPageShell } from '@/components/layout/PublicPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import * as React from 'react';

const privacySections = [
  {
    number: "1.",
    title: "Introduction",
    content: [
      <p key="1p1">Welcome to PennyPincher AI ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.</p>
    ]
  },
  {
    number: "2.",
    title: "Information We Collect",
    content: [
      <p key="2p1">We may collect personal information that you provide to us directly, such as:</p>,
      <ul key="2ul1" className="list-disc space-y-1 pl-5 my-2">
        <li>Account Information: Name, email address, password.</li>
        <li>Financial Information: Transaction details (description, amount, date, category, merchant), budget information, savings goal details. Receipts or documents you upload.</li>
        <li>User Content: Text descriptions you provide for AI processing.</li>
      </ul>,
      <p key="2p2" className="mt-2">We also collect some information automatically:</p>,
      <ul key="2ul2" className="list-disc space-y-1 pl-5 my-2">
          <li>Usage Data: Information about how you interact with our app.</li>
          <li>Device Information: IP address, browser type, operating system. (Standard server logs)</li>
      </ul>
    ]
  },
  {
    number: "3.",
    title: "How We Use Your Information",
    content: [
      <p key="3p1">We use the information we collect to:</p>,
      <ul key="3ul1" className="list-disc space-y-1 pl-5 my-2">
        <li>Provide, operate, and maintain our application.</li>
        <li>Process your transactions and manage your financial data.</li>
        <li>Improve, personalize, and expand our application.</li>
        <li>Communicate with you, including for customer service and updates.</li>
        <li>For AI features, such as categorizing expenses and extracting data from receipts. Data processed by AI models is handled according to the terms of our AI service providers (e.g., Google Gemini).</li>
        <li>Prevent fraudulent activity and ensure security.</li>
      </ul>
    ]
  },
  {
    number: "4.",
    title: "Sharing Your Information",
    content: [
      <p key="4p1">We do not sell your personal information. We may share your information in the following situations:</p>,
      <ul key="4ul1" className="list-disc space-y-1 pl-5 my-2">
        <li>With Service Providers: We may share your information with third-party vendors and service providers that perform services for us or on our behalf (e.g., cloud hosting, AI model providers). These providers are obligated to protect your data.</li>
        <li>For Legal Reasons: If required by law or in response to valid requests by public authorities.</li>
      </ul>
    ]
  },
  {
    number: "5.",
    title: "Data Security",
    content: [
      <p key="5p1">We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.</p>
    ]
  },
  {
    number: "6.",
    title: "Your Data Rights",
    content: [
      <p key="6p1">Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. Please contact us to exercise these rights.</p>
    ]
  },
  {
    number: "7.",
    title: "Third-Party AI Services",
    content: [
      <p key="7p1">Our application utilizes generative AI models (e.g., Google Gemini via Genkit) to provide features like expense categorization and data extraction. When you use these features, relevant data (like text descriptions or receipt images) is sent to these AI services for processing. We configure these services with user data privacy in mind, but the processing is subject to the terms and privacy policies of the respective AI service providers. We do not store your raw receipt images long-term after processing unless explicitly stated for a feature; they are processed and then a URL might be stored if you choose to link it to a transaction.</p>
    ]
  },
  {
    number: "8.",
    title: "Changes to This Privacy Policy",
    content: [
      <p key="8p1">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
    ]
  },
  {
    number: "9.",
    title: "Contact Us",
    content: [
      <p key="9p1">If you have any questions about this Privacy Policy, please contact us via the <Link href="/contact" className="text-primary hover:underline">Contact Us page</Link>.</p>
    ]
  }
];


export default function PrivacyPolicyPage() {
  return (
    <PublicPageShell>
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-4 md:px-8 md:py-6">
            <p className="text-muted-foreground text-center mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-8">
              {privacySections.map((section) => (
                <div key={section.number} className="space-y-0">

                  {/* == SMALL SCREEN LAYOUT (stacked: Number+Title then Content) == */}
                  <div className="md:hidden mb-6">
                    <div className="flex items-baseline space-x-2 mb-2">
                      <span className="text-lg font-bold text-primary font-mono">
                        {section.number}
                      </span>
                      <h2 className="text-base font-semibold text-foreground">
                        {section.title}
                      </h2>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {section.content.map((el, idx) => React.cloneElement(el, { key: `content-sm-${section.number}-${idx}` }))}
                    </div>
                  </div>

                  {/* == LARGE SCREEN (md and up) LAYOUT (offset Number, then Title & Content) == */}
                  <div className="hidden md:flex md:items-start md:space-x-4 mb-6">
                    <span className="mt-px text-xl font-bold text-primary font-mono shrink-0 w-10 text-right pr-2">
                      {section.number}
                    </span>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-foreground !mt-0 !mb-2">
                        {section.title}
                      </h2>
                      <div className="prose prose-base dark:prose-invert max-w-none">
                        {section.content.map((el, idx) => React.cloneElement(el, { key: `content-lg-${section.number}-${idx}` }))}
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
