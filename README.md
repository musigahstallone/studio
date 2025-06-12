# SM Cash: Intelligent Expense & Budget Management

SM Cash is a modern, AI-powered web application designed to help users effortlessly track their expenses, manage budgets, achieve savings goals, and gain insights into their financial habits. It leverages cutting-edge AI to automate data entry from text and receipts, provides multi-currency support, features a customizable user interface, and includes a comprehensive admin panel for platform oversight.

## Table of Contents

- [Key Features](#key-features)
  - [AI-Powered Expense Tracking](#ai-powered-expense-tracking)
  - [Comprehensive Budget Management](#comprehensive-budget-management)
  - [Intelligent Savings Goals Management](#intelligent-savings-goals-management)
  - [Multi-Currency Support](#multi-currency-support)
  - [User Accounts & Authentication](#user-accounts--authentication)
  - [Admin Panel & Platform Oversight](#admin-panel--platform-oversight)
  - [Customizable User Interface](#customizable-user-interface)
- [Main Modules & Pages](#main-modules--pages)
  - [Public Pages](#public-pages)
  - [Authenticated User Pages](#authenticated-user-pages)
  - [Admin Pages](#admin-pages)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)

## Key Features

### AI-Powered Expense Tracking

Automate your financial record-keeping with intelligent data extraction and categorization.

- **Text-to-Transaction:** Simply type a description like "Lunch at Cafe Mocha $12.50" or "Salary received 2000 EUR". The AI parses the merchant, amount, date, category, transaction type, and generates a concise, refined description suitable for your transaction list.
- **Receipt & Document Scanning (Upload):** Upload an image of a receipt or financial document. The AI automatically extracts key details such as merchant, amount, date, and category, saving you manual entry time. Uploaded receipts are stored securely and linked to transactions.
- **Camera Scanning:** Use your device's camera to instantly scan receipts and documents. AI-driven data extraction processes the image in real-time.
- **Automatic Categorization:** The AI suggests appropriate categories for your transactions based on the input, minimizing manual selection.
- **AI-Refined Descriptions:** Get clear and consistent transaction descriptions, even from vague inputs, improving the readability of your expense list.

### Comprehensive Budget Management

Take full control of your spending with flexible and insightful budgeting tools.

- **Create & Manage Budgets:** Easily set up budgets for various expense categories (e.g., Food & Drink, Transportation, Utilities) with specific spending limits.
- **Real-Time Tracking:** Monitor your spending progress against your budgets in real-time.
- **Visual Indicators:** Progress bars and color-coding provide an at-a-glance view of your budget status (e.g., under, near, or over budget).
- **Over-Budget Warnings:** Opt-in to receive a warning toast notification if adding a transaction is projected to exceed a category’s budget limit, helping you make informed spending decisions.

### Intelligent Savings Goals Management

Define, track, and achieve your financial dreams with sophisticated savings goal features.

- **Create & Customize Goals:** Set up personalized savings goals with specific target amounts.
- **Flexible Timelines:** Define goal timelines using either a fixed target date or a duration in months from a start date.
- **Contributions:** Easily contribute funds towards your savings goals. These contributions automatically create linked expense transactions categorized under "Savings" for seamless tracking within your overall financial picture.
- **Withdrawals:** Withdraw funds from your savings goals when needed. The system supports:
  - **Full Withdrawal:** Withdraw the entire current amount in the goal.
  - **Early Withdrawal Logic:** Configure goals to allow or disallow early withdrawals. If allowed, set a percentage-based penalty rate (min 10%) that applies to the _target amount_ if funds are withdrawn before maturity.
  - **Maturity Conditions:** Define whether a goal is considered "mature" (for penalty-free withdrawal) based on reaching the target amount or the set maturity date/duration.
- **Penalty & Transaction Cost Calculation:**
  - The system transparently calculates potential early withdrawal penalties.
  - A small, tiered transaction cost is simulated for withdrawals, adding to platform revenue.
  - The net amount transferred to the user's income after deductions is clearly shown.
- **Progress Tracking:** Visualize your progress towards each goal with clear indicators showing current vs. target amounts and percentage achieved.
- **Status Management:** Goals automatically transition through statuses like 'active', 'matured', 'completed', 'withdrawnEarly', or 'cancelled'.
- **Transaction History:** (Implicit) Contributions and withdrawals are recorded as regular transactions, providing a full history.

### Multi-Currency Support

Manage your finances globally with ease, regardless of your primary currency.

- **Local Input Currency:** Set your preferred currency (KES, USD, EUR supported) for entering transaction amounts in forms.
- **Display Currency:** Choose the currency in which all monetary values (balances, transaction amounts, budget limits) are displayed throughout the application.
- **Automatic Conversion & Storage:** All transaction amounts are automatically converted to a base storage currency (USD) for consistency in the backend. Conversions are performed on-the-fly for display in your chosen currency.
- **Localized Formatting:** Monetary values are displayed with comma-separated thousands and appropriate decimal places according to the selected display currency's locale.

### User Accounts & Authentication

Secure and personalized access to your financial data.

- **Email & Password Authentication:** Secure user registration and login using Firebase Authentication.
- **Password Reset:** Functionality for users to reset forgotten passwords.
- **User Profiles:** User-specific data, including preferences and an `isAdmin` flag, is stored in Firestore.

### Admin Panel & Platform Oversight

A dedicated section for administrators to manage the platform and view aggregated data. (Requires `isAdmin` flag on user profile).

- **Role-Based Access:** The admin section is accessible only to users with administrative privileges.
- **Admin Dashboard (`/admin`):**
  - View platform-wide statistics: total number of transactions, total value of expenses, and total value of income across all users.
  - Quick links to user management.
  - _Note on Advanced Analytics:_ The dashboard includes a note that more complex analytics (e.g., per-user aggregates, real-time streaming) would ideally require backend Cloud Functions for scalability, which are not part of the current client-side focused implementation for these stats.
- **User Management (`/admin/users`):**
  - List all registered users on the platform.
  - View user details: name, email, join date, admin status.
  - See per-user transaction count and total amount spent (calculated client-side on load).
  - Pagination for navigating through the user list.
  - A performance note indicates that calculating user-specific aggregates client-side can be slow for large datasets and recommends server-side aggregation for production.

### Customizable User Interface

Tailor the app's appearance and functionality to your preferences.

- **Theme Support:** Choose between Light, Dark, or System preference themes. The selected theme is persisted in local storage.
- **Responsive Design:** Built with ShadCN UI and Tailwind CSS, ensuring a seamless and modern user experience on desktops, tablets, and mobile devices.
- **User-Friendly Forms:** Intuitive forms for data entry with clear validation messages.
- **Responsive Drawers/Sheets:** Forms for adding/editing expenses, budgets, and savings goals appear in responsive sheets (bottom sheet on mobile, side sheet on desktop) for a non-disruptive workflow.
- **Toast Notifications:** Get immediate feedback on actions like adding, updating, or deleting data, as well as for AI processing statuses and warnings.
- **(Font Customization Currently Disabled):** While the underlying structure for font themes exists, the UI for switching fonts is currently disabled, and the app defaults to system sans-serif fonts for a clean look.

## Main Modules & Pages

### Public Pages

Accessible to all visitors, authenticated or not.

- **Landing Page (`/`):**
  - Provides an overview of SM Cash, its key features, and how it works.
  - Includes calls to action for users to "Get Started" (leading to login/signup).
  - Features a responsive header and footer with navigation links.
- **Features Page (`/features`):**
  - Offers a detailed breakdown of each major feature of the application with illustrative points.
- **FAQ Page (`/faq`):**
  - Presents frequently asked questions and answers in an accordion format for easy browsing.
- **Contact Us Page (`/contact`):**
  - Provides a contact form for app-related inquiries (simulates sending a message).
  - Displays developer contact information.
- **Privacy Policy Page (`/privacy`):**
  - Outlines how user data is collected, used, and protected.
- **Terms of Service Page (`/terms`):**
  - Details the terms and conditions for using the application.
- **Login/Signup Page (`/login`):**
  - Handles user authentication (login) and new user registration (signup).

### Authenticated User Pages

Accessible only after a user logs in.

- **Dashboard (`/dashboard`):**
  - Provides a personalized overview of the user's finances, including total income, total expenses, current balance.
  - Highlights key budget progress and shows recent transactions.
- **Transactions Page (`/expenses`):**
  - Lists all user transactions (income and expenses) with options to edit (unless linked to savings goals) or delete.
  - Provides multiple interfaces for adding transactions:
    - **Manual Entry:** A standard form for inputting transaction details.
    - **AI Text Input:** Type a free-form description for AI parsing.
    - **AI Receipt/Document Upload:** Upload an image for AI data extraction.
    - **AI Camera Scan:** Use the device camera to scan receipts for AI processing.
- **Budgets Page (`/budgets`):**
  - Allows users to create, view, edit, and delete budgets for different expense categories.
  - Displays progress against each budget.
- **Savings Goals Page (`/savings-goals`):**
  - Enables users to create, manage, contribute to, and withdraw from their savings goals.
  - Tracks progress and provides detailed views of each goal, including maturity status and withdrawal conditions.
- **Settings Page (`/settings`):**
  - Enables users to customize their experience, including:
    - Theme (Light/Dark/System).
    - Display Currency (USD, EUR, KES).
    - Local Input Currency (USD, EUR, KES).

### Admin Pages

Restricted area for administrators.

- **Admin Dashboard (`/admin`):**
  - Displays platform-wide aggregate statistics.
  - Provides navigation to other admin functionalities.
- **User Management (`/admin/users`):**
  - Lists all users, allowing admins to view their details and basic activity metrics.

## Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI Components:** ShadCN UI
- **Styling:** Tailwind CSS
- **AI & Generative Features:** Genkit (powered by Google's Gemini models)
- **Backend & Database:** Firebase
  - **Authentication:** Firebase Authentication (Email/Password)
  - **Database:** Firestore (for storing user data, expenses, budgets, savings goals)
  - **Storage:** Firebase Storage (for receipt images)
- **State Management:** React Context API (for auth, expenses, budgets, savings goals, settings)
- **Form Handling:** React Hook Form with Zod for validation
- **Date Handling:** `date-fns`
- **Deployment:** Configured for Firebase App Hosting

## Getting Started

This application is designed to run in an environment like Firebase Studio or can be deployed to Firebase App Hosting.

1.  **Environment Variables:**
    Ensure you have a `.env` file (or configure environment variables in your hosting environment) with your Firebase project configuration keys:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id (optional)

    GEMINI_API_KEY=your_google_generative_ai_api_key
    NEXT_PUBLIC_APP_URL=http://localhost:9002 (or your production URL)
    ```

2.  **Firebase Setup:**
    - Create a Firebase project.
    - Enable Firebase Authentication (Email/Password sign-in method).
    - Set up Firestore as your database.
    - Set up Firebase Storage.
    - Ensure your Firestore security rules are configured appropriately for user data access and, if implementing platform-wide features, for admin access.
      - For example, user-specific data should be restricted:
        ```
        match /users/{userId}/{document=**} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
        ```
      - Collections like `expenses_all` or `budgets_all` (if used for admin views) would need careful rule-setting or be managed via Cloud Functions for security in a production environment.
3.  **Genkit Setup:**
    - Ensure you have a Google Cloud project with the Generative Language API (Gemini) enabled.
    - Provide the `GEMINI_API_KEY` in your environment variables.
4.  **Running Locally:**
    ```bash
    npm install
    npm run dev # For the Next.js app
    # In a separate terminal for Genkit development flow inspection (optional)
    # npm run genkit:dev
    ```
    The application typically runs on `http://localhost:9002`.

This comprehensive README should provide a solid overview of SM Cash.
