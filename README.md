# The Yard  Yardsite App

A social and utility platform for the formerly incarcerated to connect, find resources, navigate life after prison, and track legal cases. This application features a unified full-stack architecture built with **React**, **TypeScript**, **Tailwind CSS**, and **Express** with a local **SQLite** database.

---

## 🚀 Speed-Run: Running in VS Code

Follow these 4 simple steps to run the application locally on your computer inside VS Code:

### 1. Prerequisite
Ensure you have Node.js (version 18 or above) installed on your system.

### 2. Install Dependencies
Open your VS Code terminal (`Ctrl + ~` or `Cmd + ~`) and install the project's npm packages:
```bash
npm install
```

### 3. Setup Environment Variables
Duplicate the `.env.example` file and save it as `.env`:
```bash
cp .env.example .env
```
Inside your new `.env` file, configure your variables (e.g., your generic or live `GEMINI_API_KEY`).

### 4. Direct Debugging or Starting
You have two easy options to start the application:

* **Option A: Simple Dev Server (No Debugger)**
  Run the dev server in the terminal:
  ```bash
  npm run dev
  ```

* **Option B: One-Click Debugging (With VS Code Debugger)**
  1. Go to the **Run and Debug** view in your VS Code sidebar (`Ctrl+Shift+D` or `Cmd+Shift+D`).
  2. Choose **"Debug Unified App (tsx)"** from the dropdown menu at the top.
  3. Press the green **Start Debugging** icon (or hit **F5**).
  4. Set breakpoints inside `server.ts` or any backend routers!

Once started, open your web browser to **`http://localhost:3000`** to interact with the application.

---

## 📁 Project Architecture & Structure

The codebase is simple and organized:

```text
├── .vscode/                 # VS Code Debugger Configurations
│   └── launch.json          # Preconfigured debug configurations (F5 runner)
├── src/                     # Client-Side Code (React SPA)
│   ├── components/          # React views: Kites, Forum, Case Tracker, Vault, etc.
│   ├── services/            # Firebase, Gemini API integration layers
│   ├── App.tsx              # Main React entrance and layout manager
│   ├── main.tsx             # DOM mounting entry point
│   └── types.ts             # Global TypeScript interface agreements
├── data/                    # Generated at local runtime
│   └── app.db               # SQLite local database (generated automatically)
├── server.ts                # Full-Stack entry point (Express, SQLite setup, APIs, Vite middleware)
├── vite.config.ts           # Bundler config (integrates tailwind, environment overrides)
├── firestore.rules          # Security rules for optional Firebase integration
├── package.json             # App manifest (scripts, dependencies)
└── README.md                # This instructions document
```

---

## 🛠️ Modifying the Application

### Adding Backend API endpoints
API endpoints are defined under `server.ts`. Any path starting with `/api` will be handled by Node/Express backend handlers. Other paths or frontend requests will automatically fall back to being served by custom **Vite middleware/assets** during development.

### Client-Side Hot-Reloads
The Express server loads the Vite configuration on dynamic boots. Modifying file contents inside `src/` automatically tells the browser to refresh or update changed modules safely.

### Local Database Checks
When running locally, a SQLite database is initialized at `data/app.db`. Tables for Users, Threads, Responses, DMs (Kites), Job trackers, Housing directories, Notifications, and Documents are generated automatically upon startup.
