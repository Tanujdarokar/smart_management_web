# SmartTask Manager 🚀

SmartTask Manager is a professional, responsive Task Management web application built with modern vanilla web technologies. It features a sophisticated UI, smart file parsing, and LocalStorage-based persistence, making it a perfect tool for managing daily productivity without the need for a complex backend.

## ✨ Key Features

- **🔐 Simulated Authentication**: Full registration and login flow with "Remember Me" functionality.
- **📊 Interactive Dashboard**: Real-time task statistics, completion progress rings, and recent activity overview.
- **📋 Advanced Task Management**: 
    - Full CRUD (Create, Read, Update, Delete) operations.
    - Advanced filtering (Status, Priority, Category).
    - Instant search and multi-criteria sorting.
    - Tags and category support.
- **📥 Smart File Import (Core Engine)**:
    - **Multi-format Support**: Import `.txt`, `.csv`, and `.json` files.
    - **NLP-like Parsing**: Automatically detects priorities (e.g., `[HIGH]`), statuses (e.g., `[DONE]`), and deadlines (e.g., `by tomorrow`) from plain text.
    - **Import Preview**: A staging area to review, edit, and select specific tasks from your files before importing.
- **📅 Task Calendar**: A Month-view visual schedule to track deadlines and upcoming tasks.
- **🌓 Modern Theming**: Light, Dark, and System mode support with persistent settings.
- **📱 Fully Responsive**: Optimized for Desktop, Tablet, and Mobile with a dedicated hamburger navigation.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Variables, Flexbox, Grid)
- **Logic**: Vanilla JavaScript (ES6+ Modules)
- **Data Persistence**: LocalStorage API
- **Design System**: Modern SaaS-style UI with custom animations and glassmorphism effects.

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Tanujdarokar/smart_management_web.git
   ```
2. **Open the project**:
   Simply open `index.html` in any modern web browser.
3. **Register/Login**:
   Create a local account to start managing your tasks.

## 💡 Smart Import Guide

One of the most powerful features is the **Smart TXT Parser**. You can upload a simple `.txt` file with lines like:

- `[CRITICAL] Finish the project report by 2026-09-05`
- `[DONE] Call the client`
- `Buy groceries by tomorrow -- Low priority`

The application will automatically detect the **Priority**, **Status**, and **Due Date** and present them in a preview table for your confirmation.

## 📝 License

This project is open-source and available under the MIT License.

---
Built with ❤️ by [Tanuj Darokar](https://github.com/Tanujdarokar)


