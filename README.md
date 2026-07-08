# IndiaPay Super - Google Pay Fullstack Clone

IndiaPay Super is a premium, fully interactive Google Pay clone built with React, Tailwind CSS, Node.js, and Express. It features a complete payment selection orchestrator, user wallets, P2P chats, linked banks, automated scratch card cashback rewards, and a merchant developer panel.

---

## 🚀 How to Run Locally

### 1. Install Dependencies
In the root directory, run:
```bash
npm install
npm run install-all
```

### 2. Start Servers Concurrently
Run:
```bash
npm start
```
This will launch:
* **Backend Server**: http://localhost:5000
* **Frontend Web App**: http://localhost:3000

---

## 📦 How to Push to your GitHub Account

Since Git has already been initialized and committed on your local system, you can easily push it to your GitHub profile by running these commands in your command prompt:

```bash
# 1. Rename local branch to main
git branch -M main

# 2. Add your GitHub remote repository link (Replace the URL with your actual GitHub repo)
git remote add origin https://github.com/your-username/indiapay-super.git

# 3. Push to your GitHub repository
git push -u origin main
```

---

## ⚡ Deployment Guidelines (Render + Vercel / GitHub Pages)

### ⚠️ Note on GitHub Pages (`github.io`)
GitHub Pages (`github.io`) only supports hosting **static frontend pages** (HTML, CSS, JS). Since this is a **Full-Stack Application** with a Node.js Express backend and transaction ledgers:
* If you deploy the frontend directly to `github.io`, the visual elements will load, but authentication, balance transfers, utility bill settlements, and rewards claims will fail.
* To make it fully live, you must host the backend API on a server hosting provider like **Render** (Free Tier).

### 🛠️ Step-by-Step Hosting Plan:

#### 1. Host the Backend on Render
1. Sign up on [Render.com](https://render.com/) (Free).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository.
4. Set settings:
   * **Runtime**: Node
   * **Build Command**: `npm install` (within backend subdirectory or using `package.json` configurations)
   * **Start Command**: `node server.js`
5. Click **Deploy**. Render will generate a live URL (e.g., `https://indiapay-backend.onrender.com`).

#### 2. Configure Frontend URL
In your local code, open `frontend/src/config.js` and update `API_BASE` to point to your live Render backend URL instead of localhost:
```javascript
export const API_BASE = 'https://your-backend-app.onrender.com';
```

#### 3. Host Frontend on Vercel, Netlify, or GitHub Pages
You can now deploy the frontend directory directly to Vercel or GitHub Pages, and it will communicate smoothly with your live backend server database!
