document.addEventListener('DOMContentLoaded', () => {
    const chatForm        = document.getElementById('chat-form');
    const messageInput    = document.getElementById('message-input');
    const chatMessages    = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');
    const sendBtn         = document.getElementById('send-btn');
    const newChatBtn      = document.getElementById('new-chat-btn');
    const sidebarToggle   = document.getElementById('sidebar-toggle');
    const sidebar         = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    // API Settings Modal Selectors
    const apiSettingsBtn    = document.getElementById('api-settings-btn');
    const apiModalOverlay   = document.getElementById('api-modal-overlay');
    const apiModalClose     = document.getElementById('api-modal-close');
    const apiModalCancel    = document.getElementById('api-modal-cancel');
    const apiModalSave      = document.getElementById('api-modal-save');
    const customApiKeyInput  = document.getElementById('custom-api-key');
    const useCustomKeyToggle = document.getElementById('use-custom-key-toggle');
    const statusDot         = document.getElementById('status-dot');
    const statusText        = document.getElementById('status-text');
    const modelStatusDot    = document.getElementById('model-status-dot');
    const modelBadgeText    = document.getElementById('model-badge-text');

    let messageHistory  = [];
    let currentChatId   = null;

    // ─── Sidebar Helpers (desktop + mobile drawer) ────────────────────────────
    function isMobileView() { return window.innerWidth <= 768; }

    function openSidebar() {
        sidebar.classList.remove('collapsed');
        if (isMobileView()) sidebarBackdrop.classList.add('active');
    }

    function closeSidebar() {
        sidebar.classList.add('collapsed');
        sidebarBackdrop.classList.remove('active');
    }

    // ─── API Settings State & Handlers ────────────────────────────────────────
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    let customGeminiKey = localStorage.getItem('hasu_custom_api_key') || '';
    // On remote hosts, always use direct API with user-provided key
    let useCustomKey = localStorage.getItem('hasu_use_custom_key') !== null
        ? localStorage.getItem('hasu_use_custom_key') === 'true'
        : !isLocalhost;

    function initApiSettings() {
        customApiKeyInput.value = customGeminiKey;
        useCustomKeyToggle.checked = useCustomKey;
        updateStatusIndicators();
    }

    function updateStatusIndicators() {
        if (useCustomKey && customGeminiKey) {
            statusDot.className = 'status-dot';
            statusDot.style.background = '#10b981';
            statusDot.style.boxShadow = '0 0 8px rgba(16,185,129,0.6)';
            statusText.textContent = 'API Key Set';
            modelStatusDot.style.background = '#10b981';
            modelStatusDot.style.boxShadow = '0 0 8px rgba(16,185,129,0.6)';
            modelBadgeText.textContent = 'Gemini 2.5 Flash';
        } else if (!isLocalhost) {
            statusDot.className = 'status-dot';
            statusDot.style.background = '#f59e0b';
            statusDot.style.boxShadow = '0 0 8px rgba(245,158,11,0.6)';
            statusText.textContent = 'Key Needed';
            modelStatusDot.style.background = '#f59e0b';
            modelStatusDot.style.boxShadow = '0 0 8px rgba(245,158,11,0.6)';
            modelBadgeText.textContent = 'Set API Key';
        } else {
            statusDot.className = 'status-dot';
            statusDot.style.background = '#10b981';
            statusDot.style.boxShadow = '0 0 8px rgba(16,185,129,0.6)';
            statusText.textContent = 'Local Node';
            modelStatusDot.style.background = '#10b981';
            modelStatusDot.style.boxShadow = '0 0 8px rgba(16,185,129,0.6)';
            modelBadgeText.textContent = 'Gemini 2.5 Flash';
        }
    }

    function openApiModal() {
        customApiKeyInput.value = customGeminiKey;
        useCustomKeyToggle.checked = useCustomKey;
        apiModalOverlay.classList.add('active');
    }

    function closeApiModal() {
        apiModalOverlay.classList.remove('active');
    }

    function saveApiSettings() {
        customGeminiKey = customApiKeyInput.value.trim();
        useCustomKey = useCustomKeyToggle.checked;
        localStorage.setItem('hasu_custom_api_key', customGeminiKey);
        localStorage.setItem('hasu_use_custom_key', useCustomKey ? 'true' : 'false');
        updateStatusIndicators();
        closeApiModal();
    }

    // ─── Constants ────────────────────────────────────────────────────────────
    const API_URL        = '/api/chat';
    const STORAGE_KEY    = 'hasu_chats';
    const MAX_AGE_DAYS   = 12;
    const MAX_AGE_MS     = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    // ─── Chat Persistence (localStorage) ─────────────────────────────────────

    function loadAllChats() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch { return {}; }
    }

    function saveAllChats(chats) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    }

    /** Remove chats older than 12 days */
    function pruneOldChats() {
        const chats = loadAllChats();
        const now   = Date.now();
        let pruned  = false;
        for (const id in chats) {
            if (now - chats[id].updatedAt > MAX_AGE_MS) {
                delete chats[id];
                pruned = true;
            }
        }
        if (pruned) saveAllChats(chats);
    }

    /** Save / update the current chat session */
    function saveCurrentChat() {
        if (!currentChatId || messageHistory.length === 0) return;
        const chats = loadAllChats();
        const firstUserMsg = messageHistory.find(m => m.role === 'user');
        const title = firstUserMsg
            ? firstUserMsg.content.slice(0, 42) + (firstUserMsg.content.length > 42 ? '…' : '')
            : 'New Chat';
        chats[currentChatId] = {
            id:        currentChatId,
            title,
            messages:  messageHistory,
            updatedAt: Date.now(),
            createdAt: chats[currentChatId]?.createdAt || Date.now()
        };
        saveAllChats(chats);
        renderSidebarHistory();
    }

    /** Start a brand-new chat session */
    function startNewChat() {
        currentChatId  = `chat_${Date.now()}`;
        messageHistory = [];
        showWelcomeCard();
        renderSidebarHistory();
    }

    /** On page load, restore the most recent chat (or start fresh if none) */
    function restoreOrStartChat() {
        const chats = loadAllChats();
        const sorted = Object.values(chats).sort((a, b) => b.updatedAt - a.updatedAt);
        if (sorted.length > 0) {
            loadChat(sorted[0].id);
        } else {
            startNewChat();
        }
    }

    /** Load a chat by id */
    function loadChat(id) {
        const chats = loadAllChats();
        const chat  = chats[id];
        if (!chat) return;
        currentChatId  = id;
        messageHistory = chat.messages;
        chatMessages.innerHTML = '';
        chat.messages.forEach(m => {
            chatMessages.appendChild(createMessageElement(m.content, m.role === 'user'));
        });
        renderSidebarHistory();
        scrollToBottom();
        // On mobile, close the sidebar drawer after selecting a chat
        if (isMobileView()) closeSidebar();
    }

    /** Render the sidebar history list */
    function renderSidebarHistory() {
        const chats  = loadAllChats();
        const histEl = document.getElementById('sidebar-history');
        histEl.innerHTML = '';

        // Group by date
        const now    = Date.now();
        const groups = { Today: [], 'Last 7 Days': [], Older: [] };

        Object.values(chats)
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .forEach(chat => {
                const ageDays = (now - chat.updatedAt) / (1000 * 60 * 60 * 24);
                if (ageDays < 1)       groups['Today'].push(chat);
                else if (ageDays < 7)  groups['Last 7 Days'].push(chat);
                else                   groups['Older'].push(chat);
            });

        let hasAny = false;
        for (const [label, items] of Object.entries(groups)) {
            if (!items.length) continue;
            hasAny = true;
            const header = document.createElement('p');
            header.className = 'history-label';
            header.textContent = label;
            histEl.appendChild(header);

            items.forEach(chat => {
                const item = document.createElement('div');
                item.className = 'history-item' + (chat.id === currentChatId ? ' active' : '');
                item.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>${escapeHtml(chat.title)}</span>
                    <button class="delete-chat-btn" title="Delete chat" data-id="${chat.id}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>`;
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.delete-chat-btn')) return; // handled below
                    loadChat(chat.id);
                });
                item.querySelector('.delete-chat-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                });
                histEl.appendChild(item);
            });
        }

        if (!hasAny) {
            const empty = document.createElement('p');
            empty.className = 'history-empty';
            empty.textContent = 'No conversations yet';
            histEl.appendChild(empty);
        }
    }

    function deleteChat(id) {
        const chats = loadAllChats();
        delete chats[id];
        saveAllChats(chats);
        if (currentChatId === id) startNewChat();
        else renderSidebarHistory();
    }

    function escapeHtml(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ─── Backend Proxy API ────────────────────────────────────────────────────

    async function generateReply() {
        // Resolve which key to use: user-provided key > backend proxy
        const resolvedKey = useCustomKey ? customGeminiKey : null;

        const contents = messageHistory.map(m => ({
            role: m.role === 'bot' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));
        const systemInstruction = {
            parts: [{ text: "You are Hasu, a highly intelligent and helpful AI assistant. Answer questions accurately, provide explanations, write and debug code, and assist with any tasks. Be clear, comprehensive, and friendly. When presenting code, use proper code formatting. Use markdown-style bold (**text**) for emphasis when helpful. Keep responses concise but complete." }]
        };
        try {
            let fetchUrl = API_URL;
            let headers = { 'Content-Type': 'application/json' };
            let bodyData = { systemInstruction, contents, generationConfig: { temperature: 0.7 } };

            if (resolvedKey) {
                fetchUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${resolvedKey}`;
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(bodyData)
            });
            if (!response.ok) {
                console.error('API Error:', await response.text());
                return "Sorry, I hit a snag. Please check your API key and try again. 😅";
            }
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (err) {
            console.error('Fetch error:', err);
            return useCustomKey
                ? "Connection error — are you connected to the internet? 🌐"
                : "Connection error — is the local server running? 🔌";
        }
    }

    // ─── UI Helpers ───────────────────────────────────────────────────────────

    function setInputEnabled(enabled) {
        enabled ? sendBtn.removeAttribute('disabled') : sendBtn.setAttribute('disabled', 'true');
    }

    function autoResize() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
    }

    function scrollToBottom() {
        const container = document.getElementById('messages-container');
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }

    // ─── Welcome Card ─────────────────────────────────────────────────────────

    function showWelcomeCard() {
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
        attachChipListeners();
    }

    function attachChipListeners() {
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.getAttribute('data-prompt');
                if (prompt) sendMessage(prompt);
            });
        });
    }

    function removeWelcomeCard() {
        const card = document.querySelector('.welcome-card');
        if (card) card.remove();
    }

    // ─── Message Rendering ────────────────────────────────────────────────────

    function renderMarkdown(text) {
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
        isUser ? p.textContent = content : p.innerHTML = renderMarkdown(content);
        contentDiv.appendChild(p);
        row.appendChild(contentDiv);
        return row;
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

        // Persist after every exchange
        saveCurrentChat();
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

    newChatBtn.addEventListener('click', () => startNewChat());

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.contains('collapsed') ? openSidebar() : closeSidebar();
    });
    sidebarBackdrop.addEventListener('click', () => closeSidebar());

    // Modal listeners
    apiSettingsBtn.addEventListener('click', () => openApiModal());
    apiModalClose.addEventListener('click', () => closeApiModal());
    apiModalCancel.addEventListener('click', () => closeApiModal());
    apiModalSave.addEventListener('click', () => saveApiSettings());
    
    // Close modal on clicking overlay background
    apiModalOverlay.addEventListener('click', (e) => {
        if (e.target === apiModalOverlay) closeApiModal();
    });

    // ─── Boot ─────────────────────────────────────────────────────────────────

    pruneOldChats();        // clean up expired chats on load
    restoreOrStartChat();   // restore last chat or start fresh
    initApiSettings();      // initialize API key and checkbox from storage

    // Collapse sidebar by default on mobile
    if (isMobileView()) sidebar.classList.add('collapsed');

    // Auto-prompt: on remote host with no key yet, open the API settings modal
    if (!isLocalhost && !customGeminiKey) {
        setTimeout(() => openApiModal(), 1200);
    }
});
