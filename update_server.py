import os

with open('server.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add env loader
env_loader = """
// Load .env
if (fs.existsSync(path.join(__dirname, '.env'))) {
    const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    env.split('\\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) process.env[key.trim()] = values.join('=').trim();
    });
}
"""
content = content.replace("const path  = require('path');\n", "const path  = require('path');\n" + env_loader)

# Update serve function to handle /api/chat
serve_original = "function serve(req, res) {\n    let filePath ="
serve_new = """function serve(req, res) {
    if (req.method === 'POST' && req.url === '/api/chat') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                const API_KEY = process.env.GEMINI_API_KEY;
                const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
                
                const apiRes = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await apiRes.json();
                res.writeHead(apiRes.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    let filePath ="""

content = content.replace(serve_original, serve_new)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated server.js")
