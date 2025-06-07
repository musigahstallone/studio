
# PennyPincher AI: Intelligent Expense & Budget Management

PennyPincher AI is a modern, AI-powered web application designed to help users effortlessly track their expenses, manage budgets, and gain insights into their financial habits. It leverages cutting-edge AI to automate data entry from text and receipts, provides multi-currency support, and includes a comprehensive admin panel for platform oversight.

## Key Features

*   **AI-Powered Expense Tracking:**
    *   **Text-to-Transaction:** Simply type a description like "Lunch at Cafe Mocha $12.50" or "Salary received 2000 EUR", and the AI will parse the merchant, amount, date, category, and transaction type.
    *   **Receipt & Document Scanning (Upload):** Upload an image of a receipt or financial document, and the AI will automatically extract key details.
    *   **Camera Scanning:** Use your device's camera to instantly scan receipts and documents for AI-driven data extraction.
    *   Automatic categorization suggestions.

*   **Comprehensive Budget Management:**
    *   Create and manage budgets for various expense categories.
    *   Track spending progress against your budgets in real-time.
    *   Visual indicators for budget status (e.g., progress bars, over-budget warnings).

*   **Multi-Currency Support:**
    *   **Local Input Currency:** Set your preferred currency (KES, USD, EUR) for entering transaction amounts.
    *   **Display Currency:** Choose the currency in which all monetary values are displayed throughout the application.
    *   Automatic conversion to a base storage currency (USD) for consistency, with on-the-fly conversion for display.
    *   Comma-separated number formatting for easy readability.

*   **User Accounts & Authentication:**
    *   Secure email and password-based user registration and login.
    *   Password reset functionality.
    *   User profiles stored in Firestore, including an `isAdmin` flag for role-based access.

*   **Admin Panel & Platform Oversight:**
    *   **Role-Based Access:** Dedicated admin section accessible only to users with admin privileges.
    *   **Admin Dashboard:**
        *   View platform-wide statistics: total transactions, total expenses, total income.
        *   Identify the most common and highest-spending expense categories across the platform.
        *   See a feed of recent platform-wide transactions.
        *   Quick links to user management and application settings.
        *   *Note: Advanced analytics like per-user aggregates or real-time streaming would require backend (e.g., Cloud Functions) implementation.*
    *   **User Management:**
        *   List all registered users on the platform.
        *   View user details like name, email, join date, and admin status.
        *   Pagination for easy navigation through the user list.

*   **Customizable User Interface:**
    *   **Theme Support:** Choose between Light, Dark, or System preference themes.
    *   Modern, responsive design built with ShadCN UI and Tailwind CSS, ensuring a seamless experience on desktop and mobile devices.
    *   User-friendly forms with validation and intuitive navigation.
    *   Toast notifications for feedback on user actions.

## Main Modules & Pages

*   **Dashboard (`/`):** Provides a personalized overview of the user's finances, including total income, total expenses, current balance, budget highlights, and recent transactions.
*   **Transactions Page (`/expenses`):**
    *   Lists all user transactions (income and expenses) with options to edit or delete.
    *   Provides interfaces for adding transactions manually or via AI:
        *   AI Text Input
        *   AI Receipt/Document Upload
        *   AI Camera Scan
*   **Budgets Page (`/budgets`):** Allows users to set, view, edit, and delete budgets for different expense categories.
*   **Settings Page (`/settings`):** Enables users to customize their experience, including:
    *   Theme (Light/Dark/System)
    *   Display Currency
    *   Local Input Currency
*   **Login/Signup Page (`/login`):** Handles user authentication and registration.
*   **Admin Section (`/admin`, `/admin/users`):** Restricted area for administrators to view platform analytics and manage users.

## Technology Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI Components:** ShadCN UI
*   **Styling:** Tailwind CSS
*   **AI & Generative Features:** Genkit (powered by Google's Gemini models)
*   **Backend & Database:** Firebase (Authentication, Firestore for database, Firebase Storage for receipt images)

This application provides a robust and intelligent solution for personal finance management, with a focus on ease of use and insightful data presentation.
