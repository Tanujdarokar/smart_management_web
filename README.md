# SmartTask Manager 🚀

SmartTask Manager is a professional, high-performance Task Management web application built with modern vanilla web technologies. It combines a sophisticated Glassmorphism UI with an intelligent file parsing engine and robust security features, providing a seamless productivity experience entirely in the browser.

## ✨ Key Features

- **🔐 Secure-simulated Auth**: Persistent registration and login system with password obfuscation and "Remember Me" session handling.
- **📊 Dynamic Dashboard**: Real-time analytics, visual task completion progress rings, and quick-access activity summaries.
- **📋 Advanced Task Management**: 
    - **Smart Grouping**: Tasks are automatically categorized into **Overdue**, **Today's Focus**, and **Upcoming** for maximum productivity.
    - **Full-cycle CRUD**: Create, Read, Update, and Delete operations with instant LocalStorage sync.
    - **Advanced Filtering**: Sort and filter by Status, Priority, Category, or Search terms.
- **📥 Intelligent Import Engine**:
    - **Multi-format Support**: Drag-and-drop `.txt`, `.csv`, and `.json` files.
    - **Staging & CRUD**: Review, edit, manually add, or selectively import tasks from a dedicated preview area.
    - **Enhanced NLP Parser**: Automatically detects Priorities, Statuses, and international date formats.
- **📅 Interactive Calendar**: A month-view visual planner—click any date to instantly create pre-filled tasks.
- **💳 Payment Tracker**: Manage financial transactions with date-wise sorting and status tracking (Sent/Received).
- **🌓 Global Adaptive Theming**: Built-in Light and Dark modes that respect system preferences and persist across all application pages.
- **📱 Mobile-First Architecture**: Fully responsive design with an off-canvas sidebar and optimized touch interfaces.

## 🛠️ Tech Stack

- **Frontend**: Semantic HTML5, CSS3 (Custom Properties, Flexbox, Grid, Glassmorphism)
- **Architecture**: Modular Vanilla JavaScript (ES6+ Modules)
- **Persistence**: LocalStorage Browser API (No backend required)
- **Security**: Built-in XSS protection and HTML sanitization

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

- **v1.2.0**: 
    - **Security Patch**: Implemented global XSS protection and HTML escaping for all user inputs.
    - **Logic Overhaul**: Added automatic task grouping (Overdue/Today/Upcoming) and a dedicated History section.
    - **Import CRUD**: Enabled full editing and manual entry capabilities within the Import module.
    - **Global Theming**: Fixed theme persistence issues and ensured Light/Dark mode consistency across all pages.
    - **Payments**: Improved financial transaction management with chronological sorting.

## 📝 License

This project is open-source and available under the MIT License.

---
Built with ❤️ by [Tanuj Darokar](https://github.com/Tanujdarokar)
