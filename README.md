# Krypton - Financial Resilience Platform

Krypton is a premium, AI-powered financial dashboard built for gig-workers, freelancers, and individuals with irregular income streams. It moves beyond traditional budgeting by focusing on **Financial Resilience**—helping you weather income shocks, build safety buffers, and manage fixed obligations.

## 🚀 Features

- **Agentic AI Coach:** Powered by Google Gemini, the AI doesn't just chat—it can actively update your financial goals and state based on your conversational intent.
- **Resilience Engine:** Calculates a 0-100 score based on your income stability, savings buffer, debt capacity, and expense flexibility.
- **Shock Simulator:** Interactive sliders that let you stress-test your finances against sudden income drops (e.g., -20% next month).
- **Interactive Dashboard:** Beautifully visualized cash flow envelopes, donut charts for expense breakdowns, and rolling number animations.
- **Manual Data Entry:** A sleek UI to instantly log income or fixed expenses and watch the UI update in real-time.
- **Mobile First & PWA Ready:** A fully responsive layout with a collapsible sidebar and hamburger menu. Can be installed directly to your phone's home screen.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Recharts, CSS Variables (for responsive theming)
- **Backend:** Node.js, Express
- **Database:** MongoDB (In-Memory for local development)
- **AI Integration:** Google GenAI SDK (Gemini 1.5 Flash)

## 📦 Local Setup Instructions

To run Krypton locally, you need to start both the backend API and the frontend React application.

### 1. Backend Setup

Open your terminal and navigate to the `server` directory:

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder with your API keys:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=5001
```

Start the backend:
```bash
npm start
```

### 2. Frontend Setup

Open a **new** terminal window and navigate to the `client` directory:

```bash
cd client
npm install
npm run dev
```

The application will now be running at `http://localhost:5173`.

## 📂 Project Structure

```text
krypton/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components (Sidebar, Charts, Coach)
│   │   ├── App.jsx         # Main Layout and Logic
│   │   ├── App.css         # Styling and Media Queries
│   │   └── api.js          # Axios API wrappers
│   └── vite.config.js      # Vite & PWA Configuration
│
├── server/                 # Node/Express Backend
│   ├── controllers/        # Business Logic (User, Finance, AI)
│   ├── models/             # Mongoose Schemas
│   ├── routes/             # Express Routes
│   ├── gemini.js           # Agentic AI Tool calling logic
│   └── server.js           # Express App Entrypoint
│
└── docs/                   # Project Implementation Planning & Roadmap
```
