document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');
    const sendBtn = document.getElementById('send-btn');

    let messageHistory = []; // remembers the conversation
    let userName = null;

    // ─── AI Response Engine ───────────────────────────────────────────
    const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your Google Gemini API key
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    async function generateHumanReply() {
        const contents = messageHistory.map(m => ({
            role: m.role === 'bot' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const systemInstruction = {
            parts: [{ text: "You are Hasu, a highly intelligent and helpful AI assistant, similar to ChatGPT. Answer the user's questions accurately, provide explanations, write code, and assist with any tasks they have. Be polite, clear, and comprehensive while maintaining a helpful and friendly tone. Format code blocks properly if needed." }]
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction,
                    contents,
                    generationConfig: {
                        temperature: 0.7,
                    }
                })
            });

            if (!response.ok) {
                console.error('API Error:', await response.text());
                return "Sorry, I'm having trouble thinking right now. 😅";
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Error fetching from Gemini:', error);
            return "Oops, my brain disconnected for a second. What were we talking about? 😅";
        }
    }

    // ─── UI Functions ─────────────────────────────────────────────────────────

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';

        if (this.value.trim().length > 0) {
            sendBtn.removeAttribute('disabled');
            sendBtn.style.backgroundColor = '#fff';
            sendBtn.style.color = '#000';
        } else {
            sendBtn.setAttribute('disabled', 'true');
            sendBtn.style.backgroundColor = '#676767';
            sendBtn.style.color = '#212121';
        }
    });

    // Handle Enter key to send (Shift+Enter for new line)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim().length > 0) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    function createMessageElement(content, isUser) {
        const messageRow = document.createElement('div');
        messageRow.className = `message-row ${isUser ? 'user-row' : 'bot-row'}`;

        if (!isUser) {
            const avatar = document.createElement('div');
            avatar.className = 'bot-avatar';
            avatar.textContent = 'H';
            messageRow.appendChild(avatar);
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        const p = document.createElement('p');
        p.innerHTML = content.replace(/\n/g, '<br>');
        contentDiv.appendChild(p);

        messageRow.appendChild(contentDiv);
        return messageRow;
    }

    function scrollToBottom() {
        const container = document.getElementById('messages-container');
        container.scrollTop = container.scrollHeight;
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const messageText = messageInput.value.trim();
        if (!messageText) return;

        messageHistory.push({ role: 'user', content: messageText });

        // Add user message
        const userMsgElem = createMessageElement(messageText, true);
        chatMessages.appendChild(userMsgElem);

        // Reset input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');
        sendBtn.style.backgroundColor = '#676767';
        sendBtn.style.color = '#212121';

        scrollToBottom();

        // Show typing indicator
        typingIndicator.style.display = 'block';
        scrollToBottom();

        generateHumanReply().then(replyText => {
            typingIndicator.style.display = 'none';
            messageHistory.push({ role: 'bot', content: replyText });

            const botMsgElem = createMessageElement(replyText, false);
            chatMessages.appendChild(botMsgElem);
            scrollToBottom();
        });
    });
});
