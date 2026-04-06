# ✨ Content-to-Experience Platform (CXP)

Transform raw content into rich, interactive digital experiences — powered by AI.

![CXP Builder](/public/docs/builder.png)

## 🚀 Overview

A modern SaaS platform built with **Next.js 14**, designed to ingest content (text, URLs, documents) and transform it into stunning interactive experiences — landing pages, quizzes, presentations, micro-sites, and more. 

The platform combines an **AI-powered transformation engine** with a full-featured **Visual Drag-and-Drop Builder**, allowing anyone to create polished, high-engagement digital experiences without writing a single line of code.

### 🎥 See it in Action
![Demo](/public/docs/demo.webp)

---

## 💎 Key Features

- **🤖 AI Studio**: Paste any content or URL and let Google's Gemini AI automatically generate a structured, interactive experience tailored to your content.
- **🎨 Visual Builder**: A fully-featured WYSIWYG editor with drag-and-drop block support. Create, edit, reorder, and configure interactive blocks in real-time.
- **📱 Responsive Preview**: Built-in device emulators to preview experiences in Desktop, Tablet, and Mobile modes before publishing.
- **📊 Analytics Dashboard**: Track views, user engagement, traffic sources, and overall performance with beautiful dynamic charts powered by Recharts.
- **🎭 Template Gallery**: Pre-built templates for quick starts (Marketing, Education, Events, Portfolios).
- **✨ Premium UI**: Breathtaking dark-mode glassmorphism design system using custom CSS and smooth micro-animations.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **UI Library**: [React 18](https://react.dev/)
- **Styling**: Vanilla CSS with custom glassmorphism design system
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **AI Engine**: [Google Gemini API](https://ai.google.dev/) (`@google/generative-ai`)
- **Database**: SQLite ([better-sqlite3](https://github.com/WiseLibs/better-sqlite3))
- **Fonts**: Inter (Google Fonts)

---

## 📦 Project Structure

```text
.
├── src/
│   ├── app/                      
│   │   ├── page.js               # Dashboard & Overview
│   │   ├── layout.js             # Root Layout & Sidebar
│   │   ├── globals.css           # Core Design System & Properties
│   │   ├── studio/               # AI Content Transformation Engine
│   │   ├── builder/              # Visual Editor
│   │   ├── experiences/          # Saved Projects List
│   │   ├── templates/            # Template Gallery
│   │   ├── preview/              # Public facing experience view
│   │   ├── analytics/            # Analytics Dashboard
│   │   └── api/                  # Backend API Routes
│   │       ├── ai/transform/     # Gemini integration
│   │       ├── analytics/        # Engagements & Views Data
│   │       ├── experiences/      # DB CRUD Operations
│   │       └── templates/        # Template filtering
│   ├── components/               # Shared UI Components (Sidebar, TopBar)
│   └── lib/
│       └── db.js                 # SQLite schema & DB initializations
├── public/
│   └── docs/                     # Documentation assets
└── package.json                  # Dependencies
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/THERITESHJADHAV/AI-Powered-Content-to-Experience-C2E-Platform.git
cd AI-Powered-Content-to-Experience-C2E-Platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
To enable the AI content generation features, create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```
*(If no API key is provided, the platform will fall back to a basic parsing algorithm to simulate the experience creation without failing).*

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🎨 Design System

CXP uses a custom-built, highly performant CSS architecture. All visual tokens (colors, spacing, animations, typography) are defined in `src/app/globals.css`. 

**Key Design Elements:**
- **Primary Color**: Electric Violet (`hsl(252, 87%, 64%)`)
- **Accent Color**: Warm Amber (`hsl(38, 92%, 60%)`)
- **Background**: Deep Midnight (`hsl(228, 25%, 8%)`)
- **Cards**: Soft glassmorphism `rgba(255, 255, 255, 0.04)` with `backdrop-filter: blur(20px)`

---

## 📝 License

This project is licensed under the MIT License.
