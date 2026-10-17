# SmartTask Manager 🚀

SmartTask Manager is a browser-based productivity app for managing tasks, imports, payments, schedules, and tracker-style workflow data. It is built with vanilla HTML, CSS, and JavaScript and stores all user data in the browser using `localStorage`.

The current project includes authentication, dashboard analytics, task management, smart import parsing, calendar planning, interview tracker imports, job-application tracking, payments management, and settings. It is designed to support both regular task tracking and workbook-style imported data from CSV, TXT, JSON, and Excel files.

## ✨ Current Features

- **Money Management Hub 💰**:
  - **Transaction Ledger**: record income/expenses, tag categories, payment methods, link to tasks, duplicate/edit entries.
  - **Monthly Budgets & Category Spending Limits**: visual progress tracking, budget utilization warning thresholds, and remaining amount calculations.
  - **Savings Goals & Milestones**: set targets, deposit/withdraw funds, progress bars, and completion deadlines.
  - **Recurring Subscriptions & Fixed Commitments**: renewal reminders, urgency badges, monthly commitment calculation, and one-click "Record Paid".
  - **Visual Financial Analytics**: expense distribution by category, income vs expense cash flow ratio, and payment method share.
  - **Multi-Currency Support**: switch seamlessly between USD ($), EUR (€), GBP (£), INR (₹), JPY (¥), CAD (CA$), and AUD (A$).
  - **Statement & Export Center**: printable financial statement generator, CSV spreadsheet exports, and JSON backups.
- **Tasks & Import Hub 📋**: unified daily task tracking with a built-in spreadsheet importer for `.xlsx`, `.xls`, `.csv`, `.json`, and smart `.txt` files. Toggle seamlessly between your active task board, batch file importer, and batch import history.
- **Company & Interview Tracker 🏢**: unified career hub combining company job application tracking (with MNC/Startup badges, stages, and salary expectations) with an interview prep workbook tracker for DSA / LeetCode study spreadsheets.
- **Goal carrer Focus Company 🎯**: direct career page directory for premier tech MNCs and high-growth startups, synchronized in real-time with company career URLs pasted into Company Tracker.
- **Dashboard overview**: task totals, pending/completed counts, overdue tracking, progress ring, monthly finance snapshot widget, and summary cards.
- **Money Management Hub 💰**: transactions, category budgets, savings goals, recurring subscriptions, and multi-currency support.
- **Calendar view**: visual date-based task planning and day grouping.
- **Settings page**: light, dark, or system theme selection, default currency, budget warning thresholds, profile data management, and feature feedback.

## 📋 Tasks & Import Hub

Open **Tasks & Import** from the sidebar to manage daily work and batch import tasks in one place:
- **My Tasks View**: Filter, search, and sort tasks by priority (Critical, High, Medium, Low) and status (Pending, In Progress, Completed). Overdue, Today's Focus, and Upcoming tasks are automatically separated into clean visual sections.
- **Batch Import Tab**: Drag & drop any `.xlsx`, `.xls`, `.csv`, `.json`, or `.txt` file, preview parsed tasks in an interactive table, make inline edits, and import them directly into your task list with one click.
- **Imported History Tab**: Review and manage previously batch-imported tasks.

## 🏢 Company & Interview Tracker

Open **Company & Tracker** from the sidebar for your complete job search and preparation workspace:
- **Company Applications Tab**: Track every job application with company name, company type (MNC, Top startup, FAANG, or Other), target role, stage (Interested, Applied, Interviewing, Offer, Rejected, or Withdrawn), location, expected salary, dates, pinned status, and direct career URLs. Pasting any company career URL here automatically syncs with **Goal carrer Focus Company**.
- **Interview Prep & Workbooks Tab**: Drag and drop technical interview prep spreadsheets (e.g. LeetCode Blind 75, System Design checklists, or DSA study workbooks) to track your problem-solving progress, difficulty levels, and target completion dates.

## 🎯 Goal carrer Focus Company

Open **Goal carrer Focus Company** from the sidebar menu to explore direct career portals of leading MNCs and top startups, as well as every company URL saved in Company Tracker.

Key capabilities:
- **75+ Direct MNC & Top Startup Tags**: Instant access to official career pages for 75+ premier tech giants (Google, Microsoft, Amazon, Meta, NVIDIA, Apple, Netflix, Adobe, Salesforce, Oracle, Cisco, Intel, AMD, Qualcomm, Goldman Sachs, JPMorgan Chase, Morgan Stanley, Bloomberg, Visa, Mastercard, Accenture, TCS, Infosys, etc.) and high-growth unicorns/startups (OpenAI, Anthropic, Scale AI, Hugging Face, Cohere, Perplexity AI, Mistral AI, Databricks, Stripe, Figma, Canva, Notion, Airbnb, Snowflake, Discord, Linear, Vercel, Supabase, Retool, Airtable, Miro, GitLab, Brex, Ramp, DoorDash, ByteDance, Postman, Razorpay, Swiggy, Zomato, Zepto, Zerodha, CRED, Flipkart, PhonePe, Meesho, etc.).
- **Automatic Sync with Company Tracker**: Any company and career URL pasted into **Company Tracker** automatically appears here with a `📋 In Tracker` tag, live stage badge, and direct URL visit links.
- **Quick Career URL Importer**: Paste any career portal or job listing URL directly in the top banner or modal to auto-detect and sync it with your local Company Tracker in one click.
- **Category Filter Chips**: Filter effortlessly by `🏢 MNC`, `🚀 Top startup`, `⭐ FAANG`, `📋 From Company Tracker`, or `📌 Pinned Goals`.
- **Live Search & Sort**: Search by company name, target role, domain, or tag, and sort alphabetically or by tracked status.

## 🚀 How to Run

Since this is a static project, you can run it locally with any simple web server.

### Option 1: Python local server

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2: VS Code Live Server

Open the project in VS Code and run the app with Live Server or another static server extension.

## 🔐 Login and Guest Flow

The app supports:

- regular user registration and login
- guest browsing without a full account
- protected actions that prompt login when needed
- data persistence for signed-in users in browser storage

## 📥 Import Support

The app is built to handle:

- CSV files
- TXT task files
- JSON task exports
- XLSX/XLS spreadsheet imports
- multi-sheet tracker or interview workbook files

The import logic identifies the most relevant sheet, normalizes field names, and manages date behavior automatically when values are missing.

## 🧪 Verification

The project includes regression tests for the main features, including:

- guest behavior
- storage persistence
- parser logic
- CSV and TXT imports
- Excel import
- tracker workflow sheet selection
- company application storage, updates, deletion, and per-user isolation
- date assignment and consistency

Run:

```bash
npm test
```

## 🌐 Production setup

The app is static and has no server-side authentication, contact form endpoint, or analytics provider. Registration is browser-only; passwords are Base64-encoded in local storage and are not protected authentication credentials. Do not use sensitive or reused passwords. A real production account system and protection for server-side secrets require a backend; no API secret is present in this frontend project.

Before deployment, choose a hosting provider and production domain. Configure HTTPS redirects and security headers at that provider; an HTML-only app cannot enforce HTTPS before the host serves the page. After the production domain is available, generate a sitemap and matching `robots.txt` from the project root:

```powershell
$env:SITE_URL = "https://www.example.com"
npm run generate:sitemap
```

The command rejects non-HTTPS URLs and writes absolute sitemap URLs for the public landing, privacy, and terms pages. Run it again whenever the production domain changes. `robots.txt` is initially a permissive placeholder without a sitemap URL; do not deploy the placeholder in place of the generated version.

Optional analytics are not active. Choose an analytics provider, configure its account/site ID, and connect its loading code to the saved opt-in consent before enabling it. The consent banner does not load a tracker by itself. Bot protection and abuse limits must be enforced by a backend if server-backed forms or APIs are added; browser-only checks can be bypassed.

## 📝 Notes

This app is intentionally built as a frontend-only project. It does not require a backend database or server-side API. All data remains local to the browser unless the user explicitly exports or copies it elsewhere.

## 📄 License

This project is available for educational and development use.

---
Built with ❤️ for smart task management and workflow tracking.
