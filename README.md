# SmartTask Manager 🚀

SmartTask Manager is a professional, high-performance Task Management web application built with modern vanilla web technologies. It combines a sophisticated SaaS-style UI with an intelligent file parsing engine, providing a seamless productivity experience entirely in the browser.

## ✨ Key Features

- **🔐 Secure-simulated Auth**: Persistent registration and login system with "Remember Me" session handling.
- **📊 Dynamic Dashboard**: Real-time analytics, visual task completion progress rings, and quick-access activity summaries.
- **📋 Full-cycle Task Management**: 
    - Full CRUD (Create, Read, Update, Delete) operations with instant LocalStorage sync.
    - **Advanced Filtering**: Sort and filter by Status, Priority, Category, or Search terms.
    - **Smart Tags**: Categorize tasks with custom tags for better organization.
- **📥 Intelligent Import Engine**:
    - **Multi-format Support**: Drag-and-drop `.txt`, `.csv`, and `.json` files.
    - **Enhanced NLP Parser**: Automatically detects Priorities (e.g., `[HIGH]`), Statuses (e.g., `[DONE]`), and Dates (Supports `YYYY-MM-DD`, `DD/MM/YYYY`, and natural language like `tomorrow`).
    - **Review Staging**: Interactive preview area to edit or selectively import tasks from external files.
- **📅 Interactive Calendar**: A month-view visual planner with direct task integration—click any date to pre-fill and create tasks.
- **🌓 Adaptive Theming**: Built-in Light and Dark modes that respect system preferences and persist across sessions.
- **📱 Mobile-First Architecture**: Responsive design with a custom sidebar navigation and floating action menus for mobile users.

## 🛠️ Tech Stack

- **Frontend**: Semantic HTML5, CSS3 (Custom Properties, Flexbox, Grid, Glassmorphism)
- **Architecture**: Modular Vanilla JavaScript (ES6+ Modules)
- **Persistence**: LocalStorage Browser API (No backend required)
- **Icons**: Emoji-based lightweight icons for performance

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Tanujdarokar/smart_management_web.git
   ```
2. **Launch**:
   Simply open `index.html` in your browser.
3. **Setup**:
   Register a local account. All data remains private and stored on your device.

## 💡 Smart Import Guide

The **Smart TXT Parser** is designed to understand how you write. Try uploading a text file with:

- `[CRITICAL] Finalize Q4 report by 2026-12-31`
- `[DONE] Client onboarding meeting`
- `Review documentation by tomorrow -- High priority`
- `Fix login bug due 15/09/2026`

The engine will automatically map these to the correct database fields for you.

## 📈 Recent Updates

- **v1.1.0**: 
    - Added international date format support (`DD/MM/YYYY`) to the parser.
    - Integrated Calendar-to-Task creation flow.
    - Fixed persistence logic to preserve task creation history during edits.
    - Improved UI color variable consistency for Dark Mode.

## 📝 License

This project is open-source and available under the MIT License.

---
Built with ❤️ by [Tanuj Darokar](https://github.com/Tanujdarokar)
