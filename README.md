# SmartTask Manager 🚀

SmartTask Manager is a static single-page style productivity dashboard built with vanilla HTML, CSS, and JavaScript. It helps users create, organize, import, track, and review tasks while keeping all app data in the browser through `localStorage`.

The current project includes a login and registration flow, a dashboard, task management, import parsing, calendar planning, payment tracking, and settings with profile/account deletion actions.

## ✨ Current Project Features

- **Authentication flow**: Register, login, logout, and remember-me behavior through the browser storage layer.
- **Guest UI preview behavior**: Users can open the app as a guest and see the website layout, but site clicks and feature actions trigger a login-required warning modal until the user signs in.
- **Dashboard**: Shows task totals, recent tasks, overdue, pending, completed summaries, and a progress visualization.
- **Tasks module**: Add, edit, delete, update completion, filter, search, and sort tasks.
- **Import module**: Drag-and-drop file import, manual preview rows, imported task preview, and review/edit/import workflow.
- **Calendar module**: Month calendar layout that groups and displays tasks by date.
- **Payments module**: Track sent and received payments, filters, status tabs, and transaction deletion workflows.
- **Settings module**: Theme switching, profile update form, and account deletion.
- **Responsive UI**: Sidebar, mobile navigation toggle, and CSS-driven responsive styling across pages.

## 🧩 Project Structure

```text
smart-task-manager/
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── tasks.html
├── import.html
├── calendar.html
├── payments.html
├── settings.html
├── css/
├── js/
└── assets/
```

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript ES modules
- **Architecture**: Static web app using local page files
- **Storage**: LocalStorage API
- **Parser**: Custom import parser in the JavaScript parser module

## 🚀 How to Run

Since this is a static web project, you can run it locally by opening the app in a browser, or by using a VS Code Live Server extension.

Recommended workflow:

1. Clone or download the repository.
2. Open the project folder.
3. Start a local static server or use Live Server.
4. Open the app from `index.html` or open `login.html` directly.

Example using a Python server:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## 🔐 Guest / Login Behavior

The app now supports a guest mode experience:

- A user can click **Continue as Guest** from the login page.
- Guest users can view the UI layout.
- The app shows a login-required modal when a guest tries to use protected features.
- Full feature access requires creating an account or logging in.

## 📝 Notes

This project is implemented as a local browser-based task manager and does not use a backend server or database. All persistent application data such as users, tasks, settings, and payments are stored in the browser’s `localStorage`.

## 📄 License

This project is available for educational and development use.

---
Built with ❤️ for task and workflow management.
