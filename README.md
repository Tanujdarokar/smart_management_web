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
- **Authentication and user flow**: register, login, logout, guest mode, remember-me behavior, and user storage handling.
- **Dashboard overview**: task totals, pending/completed counts, overdue tracking, progress ring, monthly finance snapshot widget, and summary cards.
- **Task manager**: create, edit, delete, complete, filter, sort, and search tasks.
- **Smart import system**: supports CSV, TXT, JSON, XLSX, and tracker-style workbook imports.
- **Flexible import parsing**: detects matching columns dynamically, handles extra rows/columns, preserves explicit dates, and adds sequential dates when missing.
- **Tracker support**: dedicated tracker page and import workflow for interview or workflow workbook files.
- **Company Tracker**: track job applications by company, company type (MNC, Top startup, FAANG, or Other), role, stage, location, expected salary, applied date, follow-up date, company website, job posting link, pin status, and notes. Search, filter by stage or pinned companies, and sort applications; summary counts show active applications, interviews, and offers.
- **Workbook summary view**: imported task data can be aggregated into category and priority summaries on the dashboard.
- **Calendar view**: visual date-based task planning and day grouping.
- **Settings page**: light, dark, or system theme selection, default currency, budget warning thresholds, profile data management, and feature feedback.
- **Simple, responsive UI**: consistent blue and neutral colors, clear forms and navigation, and layouts that adapt to mobile screens.

## 🧩 Project Structure

```text
smart-task-manager/
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── tasks.html
├── import.html
├── tracker.html
├── companies.html
├── calendar.html
├── payments.html
├── settings.html
├── css/
├── js/
├── assets/
├── test/
├── package.json
├── README.md
└── node_modules/
```

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript ES Modules
- **Storage**: `localStorage`
- **Import/Excel support**: `xlsx` package
- **Testing**: Node.js built-in test runner (`node --test`)
- **Architecture**: static browser app without a backend

## 🏢 Company Tracker

Open **Company Tracker** from the sidebar to manage job applications. Each entry can include a company and type (MNC, Top startup, FAANG, or Other), job title, stage (Interested, Applied, Interviewing, Offer, Rejected, or Withdrawn), location, expected salary, application and follow-up dates, a company website, a job posting URL, a pin, and notes. Use the separate company website and job posting links on a card to open either page. Select **Pinned companies** in the filter to quickly find saved pinned entries.

Use search to find a company, role, or location; filter by stage; or sort by the latest application date, follow-up date, most recently updated, or company name. The latest application date is the default, and entries without an application date appear after dated entries. Application records are stored locally in the browser and kept separate for each user.

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

## 📝 Notes

This app is intentionally built as a frontend-only project. It does not require a backend database or server-side API. All data remains local to the browser unless the user explicitly exports or copies it elsewhere.

## 📄 License

This project is available for educational and development use.

---
Built with ❤️ for smart task management and workflow tracking.
