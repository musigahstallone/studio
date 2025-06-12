import {
  HelpCircle,
  Users,
  Cpu,
  Shield,
  CoinsIcon,
  SlidersHorizontal,
  LandmarkIcon,
  Palette,
  Coins,
  Edit,
  TextSearch,
  ScanLine,
} from "lucide-react";

export const featuresSummary = [
  {
    icon: Cpu,
    title: "AI-Powered Tracking",
    description:
      "Automate expense entry from text, receipts, or camera scans. Smart categorization and description refinement.",
    iconColor: "text-primary",
  },
  {
    icon: SlidersHorizontal,
    title: "Comprehensive Budgets",
    description:
      "Create, manage, and track budgets across categories with real-time progress and over-limit warnings.",
    iconColor: "text-accent",
  },
  {
    icon: LandmarkIcon,
    title: "Intelligent Savings Goals",
    description:
      "Set savings targets with flexible timelines, contribute funds, and manage withdrawals with smart penalty calculations.",
    iconColor: "text-green-600",
  },
  {
    icon: Coins,
    title: "Multi-Currency Support",
    description:
      "Input expenses in your local currency and view financials in your preferred display currency.",
    iconColor: "text-purple-600",
  },
];

export const howItWorksSteps = [
  {
    icon: Edit,
    title: "Sign Up & Set Up",
    description:
      "Create your free account in minutes. Customize your currency and theme preferences.",
  },
  {
    icon: TextSearch,
    title: "Add Transactions Effortlessly",
    description:
      "Use text input, upload receipts, or scan with your camera. Our AI handles the data entry.",
  },
  {
    icon: ScanLine,
    title: "Track & Achieve",
    description:
      "Monitor your spending against budgets, watch your savings grow, and gain insights into your financial habits.",
  },
];

export const faqData = [
  {
    id: "what-is",
    icon: HelpCircle,
    question: "What is SM Cash?",
    answer:
      "SM Cash is an intelligent financial management application designed to help you effortlessly track expenses, manage budgets, achieve savings goals, and gain insights into your financial habits using the power of Artificial Intelligence.",
  },
  {
    id: "ai-tracking",
    icon: Cpu,
    question: "How does the AI expense tracking work?",
    answer:
      'You can input transactions by typing free-form text (e.g., "Lunch at Cafe Mocha $12.50"), uploading receipt images, or scanning receipts directly with your device\'s camera. Our AI parses the details, suggests categories, refines descriptions, and helps automate your financial record-keeping.',
  },
  {
    id: "free-to-use",
    icon: Users,
    question: "Is SM Cash free to use?",
    answer:
      "Yes, SM Cash offers a comprehensive set of features for free. We are focused on providing a great core experience for all users.",
  },
  {
    id: "currencies",
    icon: CoinsIcon,
    question: "What currencies do you support?",
    answer:
      "SM Cash supports multiple currencies for input and display. You can set your preferred local input currency (e.g., KES, USD, EUR) and a separate display currency for viewing all your financial data. Transactions are stored in a base currency (USD) and converted on-the-fly for display.",
  },
  {
    id: "data-security",
    icon: Shield,
    question: "How secure is my financial data?",
    answer:
      "We take your data security very seriously. SM Cash utilizes Firebase, a secure platform by Google, for backend services including authentication and database storage. All data transmission is encrypted. For more detailed information, please review our Privacy Policy.",
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
    id: "theme-customization",
    icon: Palette,
    question: "Can I customize the app's appearance?",
    answer:
      "Yes, you can personalize your experience by choosing between Light, Dark, or System preference themes directly from the settings page. The app features a modern, responsive design suitable for both desktop and mobile devices.",
  },
  {
    id: "developer",
    icon: Users,
    question: "Who developed SM Cash?",
    answer:
      "SM Cash was developed by Stallone Musigah. You can find more information about the developer on the <a href='/contact' class='text-primary hover:underline'>Contact Us page</a>.",
  },
];
