# SmartTask Manager 🚀

SmartTask Manager is a browser-based productivity app for managing tasks, imports, payments, schedules, and tracker-style workflow data. It is built with vanilla HTML, CSS, and JavaScript and stores all user data in the browser using `localStorage`.

The current project includes a complete authentication flow, dashboard analytics, task management, smart import parsing, calendar planning, tracker workflow support, payments management, and settings. It is designed to support both regular task tracking and workbook-style imported data from CSV, TXT, JSON, and Excel files.

## ✨ Current Features

- **Authentication and user flow**: register, login, logout, guest mode, remember-me behavior, and user storage handling.
- **Dashboard overview**: task totals, pending/completed counts, overdue tracking, progress ring, and summary cards.
- **Task manager**: create, edit, delete, complete, filter, sort, and search tasks.
- **Smart import system**: supports CSV, TXT, JSON, XLSX, and tracker-style workbook imports.
- **Flexible import parsing**: detects matching columns dynamically, handles extra rows/columns, preserves explicit dates, and adds sequential dates when missing.
- **Tracker support**: dedicated tracker page and import workflow for interview or workflow workbook files.
- **Workbook summary view**: imported task data can be aggregated into category and priority summaries on the dashboard.
- **Calendar view**: visual date-based task planning and day grouping.
- **Payments tracking**: add/manage payment records, status filters, and financial overview.
- **Settings page**: theme switching, profile data management, and account-level preferences.
- **Responsive UI**: sidebar navigation, mobile layout support, and modern dashboard styling.

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
