# 🤖 Hasu — AI Chat Assistant

> A premium, full-screen AI chat assistant powered by **Google Gemini**, built with a Node.js backend, a beautiful dark glassmorphic UI, and 12-day persistent chat history.

**Live Demo:** https://utkarshkumarnigam-lab.github.io/Hasu/

![Hasu Chat Interface](https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=flat-square&logo=node.js&logoColor=white) ![Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white) ![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)

---

## 📸 About

**Hasu** is a locally-hosted AI chat application that delivers a ChatGPT-like experience right in your browser. It combines a sleek, full-screen glassmorphic interface with the intelligence of Google's Gemini 2.5 Flash model — all running privately and securely on your own machine.

Whether you want to ask questions, get explanations, write code, or just have a conversation, Hasu is built to handle it all.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **Gemini AI** | Powered by Google Gemini 2.5 Flash for fast, accurate, and intelligent responses |
| 💬 **ChatGPT-like UI** | Full-screen dark interface with collapsible sidebar, just like ChatGPT |
| 💾 **12-Day Chat History** | All conversations are saved locally and auto-expire after 12 days |
| 📂 **Sidebar History** | Browse past chats grouped by Today, Last 7 Days, and Older |
| 🗑️ **Delete Chats** | Hover over any saved chat to delete it individually |
| 🌐 **Local HTTP Server** | Runs on localhost — no SSL setup needed, opens instantly in any browser |
| 🛡️ **API Key Protection** | The Gemini API key is stored in a backend `.env` file — never exposed to the browser |
| ✨ **Quick-Start Chips** | Tap a suggestion chip to instantly start a conversation |
| 🖥️ **Markdown Rendering** | Renders **bold text**, `inline code`, and full code blocks from the AI |
| 🔄 **New Chat Button** | Start a fresh conversation anytime without losing history |
| 📜 **Auto-Pruning** | Old chats (12+ days) are automatically removed on startup |

---

## 🛠️ Technologies Used

### Frontend
| Technology | Purpose |
|---|---|
| **HTML5** | Semantic page structure and layout |
| **Vanilla CSS3** | Full custom styling — glassmorphism, dark theme, animations, responsive layout |
| **Vanilla JavaScript (ES6+)** | All UI logic, API calls, chat rendering, localStorage management |
| **Google Fonts (Inter)** | Premium typography for a modern, clean look |
| **CSS Custom Properties** | Design token system for consistent theming |
| **localStorage API** | Client-side persistence for 12-day chat history |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment for the backend server |
| **HTTP (built-in)** | Lightweight local server — no SSL or certificate setup required |
| **`.env` file** | Stores the Gemini API key securely, away from the browser |
| **`/api/chat` proxy route** | Backend endpoint that forwards requests to Google Gemini API |

### AI / API
| Technology | Purpose |
|---|---|
| **Google Gemini 2.5 Flash** | AI model used for generating intelligent, conversational responses |
| **Gemini REST API** | `generativelanguage.googleapis.com` endpoint for generating content |

### DevOps / Tooling
| Tool | Purpose |
|---|---|
| **Git** | Version control |
| **GitHub** | Remote repository and code hosting |
| **npm** | Package manager for Node.js dependencies |

---

## 📁 Project Structure

```
Hasu/
├── index.html          # Main UI — sidebar, chat area, input bar
├── styles.css          # All styling — dark theme, glassmorphism, animations
├── script.js           # Frontend logic — AI calls, history, rendering
├── server.js           # Node.js backend — HTTP server, /api/chat proxy
├── package.json        # Project metadata and dependencies
├── .env                # 🔒 Your API key (NOT committed to Git)
├── .gitignore          # Excludes node_modules/ and .env
└── launch.bat          # One-click launcher for Windows
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/utkarshkumarnigam-lab/Hasu.git
cd Hasu
```

**2. Install dependencies**
```bash
npm install
```

**3. Create your `.env` file**

Create a file named `.env` in the root directory and add your API key:
```
GEMINI_API_KEY=your_api_key_here
```

**4. Launch Hasu**

On Windows, simply double-click `launch.bat`, or run:
```bash
node server.js
```

**5. Open in Browser**

Navigate to: **`http://127.0.0.1:3000`**

> ✅ No SSL warnings or certificate setup needed — it just works!

---

## 🔐 Security

- Your **Gemini API key is never exposed** to the browser or frontend code. It lives exclusively in your `.env` file and is read only by the Node.js backend.
- The server runs locally on `127.0.0.1` — it is not accessible from outside your machine.
- The `.env` file is excluded from Git via `.gitignore`.

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">Built using Node.js, Vanilla JS, and Google Gemini!!</p>
