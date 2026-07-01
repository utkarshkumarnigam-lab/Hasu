# Hasu Chat Box

Hasu is a beautiful, locally-hosted, human-like chat interface that leverages the power of the Google Gemini API to act as a highly intelligent AI assistant. It provides a ChatGPT-like experience with a clean UI, built using pure HTML, CSS, and Vanilla JavaScript on the frontend, and a simple Node.js static server on the backend.

## Features

- **Gemini API Integration**: Uses the `gemini-2.5-flash` model for fast, accurate, and comprehensive AI responses.
- **Modern UI**: A sleek, dark-themed chat interface with responsive design and typing indicators.
- **Local HTTPS Server**: Runs locally over HTTPS with auto-generated self-signed certificates, ensuring secure connections.
- **Conversation Memory**: Maintains chat history to allow for continuous, context-aware conversations.

## Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.
- A valid Google Gemini API Key. (Update `script.js` with your own key if needed).

## Installation & Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd "Chat Box"
   ```

2. **Install dependencies**:
   The project uses `selfsigned` to generate SSL certificates for local development.
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```
   Or you can simply run the provided `Launch Hasu Chat.bat` file if you are on Windows.

4. **Open in Browser**:
   The server will start and automatically redirect you to the secure HTTPS connection:
   - `https://hasu.local:8443`
   - `https://127.0.0.1:8443`

## Configuration

To change the Gemini API key or adjust the model, edit the `API_KEY` and `API_URL` constants in `script.js`:
```javascript
const API_KEY = 'your-api-key-here';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
```

## License

ISC License
