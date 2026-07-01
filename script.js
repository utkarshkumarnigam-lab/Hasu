document.addEventListener('DOMContentLoaded', () => {
    const chatForm       = document.getElementById('chat-form');
    const messageInput   = document.getElementById('message-input');
    const chatMessages   = document.getElementById('chat-messages');
    const typingIndicator= document.getElementById('typing-indicator');
    const sendBtn        = document.getElementById('send-btn');
    const newChatBtn     = document.getElementById('new-chat-btn');
    const sidebarToggle  = document.getElementById('sidebar-toggle');
    const sidebar        = document.getElementById('sidebar');

    let messageHistory = [];

    // ─── Backend Proxy API ────────────────────────────────────────────────────
    const API_URL = '/api/chat';

    async function generateReply() {
        const contents = messageHistory.map(m => ({
            role: m.role === 'bot' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const systemInstruction = {
            parts: [{ text: "You are Hasu, a highly intelligent and helpful AI assistant. Answer questions accurately, provide explanations, write and debug code, and assist with any tasks. Be clear, comprehensive, and friendly. When presenting code, use proper code formatting. Use markdown-style bold (**text**) for emphasis when helpful. Keep responses concise but complete." }]
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemInstruction, contents, generationConfig: { temperature: 0.7 } })
            });

            if (!response.ok) {
                console.error('API Error:', await response.text());
                return "Sorry, I hit a snag. Please try again in a moment. 😅";
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (err) {
            console.error('Fetch error:', err);
            return "Connection error — is the server running? 🔌";
        }
    }

    // ─── UI Helpers ───────────────────────────────────────────────────────────

    function setInputEnabled(enabled) {
        if (enabled) {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }
    }

    function autoResize() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
    }

    function scrollToBottom() {
        const container = document.getElementById('messages-container');
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }

    // ─── Message Rendering ────────────────────────────────────────────────────

    function renderMarkdown(text) {
        // Basic markdown: **bold**, `code`, ```code blocks```, newlines
        return text
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    function createMessageElement(content, isUser) {
        const row = document.createElement('div');
        row.className = `message-row ${isUser ? 'user-row' : 'bot-row'}`;

        if (!isUser) {
            const avatar = document.createElement('div');
            avatar.className = 'bot-avatar';
            avatar.textContent = 'H';
            row.appendChild(avatar);
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        const p = document.createElement('p');
        if (isUser) {
            p.textContent = content;
        } else {
            p.innerHTML = renderMarkdown(content);
        }
        contentDiv.appendChild(p);
        row.appendChild(contentDiv);
        return row;
    }

    // Remove welcome card once first message is sent
    function removeWelcomeCard() {
        const card = document.querySelector('.welcome-card');
        if (card) card.remove();
    }

    // ─── Send Message ─────────────────────────────────────────────────────────

    async function sendMessage(text) {
        text = text.trim();
        if (!text) return;

        removeWelcomeCard();

        messageHistory.push({ role: 'user', content: text });
        chatMessages.appendChild(createMessageElement(text, true));

        messageInput.value = '';
        messageInput.style.height = 'auto';
        setInputEnabled(false);
        scrollToBottom();

        typingIndicator.style.display = 'block';
        scrollToBottom();

        const reply = await generateReply();
        typingIndicator.style.display = 'none';

        messageHistory.push({ role: 'bot', content: reply });
        chatMessages.appendChild(createMessageElement(reply, false));
        scrollToBottom();

        setInputEnabled(messageInput.value.trim().length > 0);
    }

    // ─── Event Listeners ──────────────────────────────────────────────────────

    messageInput.addEventListener('input', () => {
        autoResize();
        setInputEnabled(messageInput.value.trim().length > 0);
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (messageInput.value.trim()) sendMessage(messageInput.value);
        }
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (messageInput.value.trim()) sendMessage(messageInput.value);
    });

    // Quick prompt chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.getAttribute('data-prompt');
            if (prompt) sendMessage(prompt);
        });
    });

    // New chat
    newChatBtn.addEventListener('click', () => {
        messageHistory = [];
        chatMessages.innerHTML = `
            <div class="welcome-card">
                <div class="welcome-avatar">H</div>
                <h1 class="welcome-title">Hi, I'm Hasu</h1>
                <p class="welcome-subtitle">Your personal AI assistant powered by Gemini. Ask me anything — I'm here to help.</p>
                <div class="welcome-chips">
                    <button class="chip" data-prompt="Explain quantum computing in simple terms">💡 Explain something</button>
                    <button class="chip" data-prompt="Write a Python script that sorts a list of numbers">🧑‍💻 Write some code</button>
                    <button class="chip" data-prompt="Give me 5 tips to stay productive while working from home">✅ Give me tips</button>
                    <button class="chip" data-prompt="Tell me a surprising fact I probably don't know">🌍 Surprise me</button>
                </div>
            </div>`;
        // Re-attach chip listeners after reset
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.getAttribute('data-prompt');
                if (prompt) sendMessage(prompt);
            });
        });
    });

    // Sidebar toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
});
