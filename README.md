# 🌟 IndiaPay Super - Next-Gen Payment Orchestrator & GPay Clone

[![React](https://img.shields.io/badge/Frontend-React.js-blue.svg?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js--Express-green.svg?logo=nodedotjs)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%2F%20JSON%20Fallback-emerald.svg?logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/Academic%20Project-Portfolio-orange.svg)]()

> A high-fidelity, full-stack payment orchestration simulator cloning the user experience of Google Pay. Built with a focus on system resilience, transaction ledger consistency, and modern checkout routing.

---

## 🔗 Live Interactive Frontend
Explore the live user interface:
👉 **[https://vishallrawal.github.io/Indiapay-payment-website/](https://vishallrawal.github.io/Indiapay-payment-website/)**

---

## ⚡ Core Features

*   **💳 Payment Orchestration Gateway**: Select from multiple payment modes:
    *   *Net Banking / UPI*: Triggers NPCl-style numerical keyboard checks.
    *   *Debit / Credit Cards*: Real-time inputs validating card numbers, CVVs, and expiry calendars.
    *   *Easy EMIs*: Interactive calculator providing interest logs (3 Months @ 12%, 6 Months @ 14%, 12 Months @ 15% p.a.).
*   **💬 P2P Conversational Wallet**: In-app messaging and money transfer threads with default seeded contacts (*Rohit Verma* & *Sneha Reddy*).
*   **🎁 Automated Scratch Card Rewards**: Generates scratch cards upon transaction confirmation. Swiping the card reveals random cashbacks (₹10 - ₹150) credited instantly to the wallet balance.
*   **⚙️ Developer Config Panel**: Real-time mock simulator enabling configuration of custom usernames, wallet balances, Card numbers, linked bank details, and manual transaction ledger injections.
*   **🌓 Light/Dark Mode**: High-fidelity theme toggler utilizing soft lavender gradients in light mode and magma-sunset glows in dark mode.

---

## 📁 Project Directory Structure

```text
indiapay-super/
├── backend/                  # Node.js + Express API Server
│   ├── config/               # DB Connection wrappers
│   ├── controllers/          # Business logic handlers (Wallet, Bookings, Rewards)
│   ├── routes/               # API endpoints (/api/user, /api/wallet)
│   ├── .data/                # Failover Local JSON Database Storage
│   └── server.js             # Server startup script
├── frontend/                 # React SPA (Vite builder)
│   ├── src/
│   │   ├── components/       # UI Panels (FintechDashboard, BankManager, RewardsCenter)
│   │   ├── config.js         # API gateway configs
│   │   ├── index.css         # Theme styles & custom overrides
│   │   └── App.jsx           # Main State controller & Router
└── README.md                 # Project Documentation
```

---



## 🛠️ Technology Stack & Rationale

*   **React.js (Vite)**: Selected for its state-management efficiency in single-page applications, enabling smooth view transitions.
*   **Tailwind CSS**: Utilized utility classes and custom theme overrides (`index.css`) to implement premium visual aesthetics (glassmorphism overlays and fixed gradient backdrops).
*   **Node.js & Express**: Provides a lightweight and highly concurrent API handling transaction records routing.
*   **MongoDB & Mongoose**: Used as the primary Document Database for schema modeling.
*   **Smart Failover Database Engine**: A custom file-based database system developed to fallback seamlessly to structured JSON flat files inside `backend/.data/` if local MongoDB services are offline.

---

## 🚀 How to Run Locally

### 1. Prerequisite
Ensure you have **Node.js** (v16 or above) installed on your system.

### 2. Installation
Clone the repository, navigate to the root directory, and install dependencies:
```bash
npm install
npm run install-all
```

### 3. Launch Development Server
Run the concurrently command to start the backend and frontend servers:
```bash
npm start
```
*   **Frontend Client**: http://localhost:3000
*   **Backend Server**: http://localhost:5000

---

## 🧑‍💻 Developer & Designer
*   **Vishal Rawal** (Design & Fullstack Core Developer)
