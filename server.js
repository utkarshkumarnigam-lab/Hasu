const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');

// Load .env
if (fs.existsSync(path.join(__dirname, '.env'))) {
    const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    env.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) process.env[key.trim()] = values.join('=').trim();
    });
}

const PORT = process.env.PORT || 3000;

/** Get the local network IP so phones on the same WiFi can connect */
function getLanIp() {
    for (const iface of Object.values(os.networkInterfaces())) {
        for (const info of iface) {
            if (info.family === 'IPv4' && !info.internal) return info.address;
        }
    }
    return null;
}

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
};

function serve(req, res) {
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

    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(__dirname, 'index.html');
    }
    const ext  = path.extname(filePath);
    const type = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(filePath).pipe(res);
}

http.createServer(serve).listen(PORT, '0.0.0.0', () => {
    const lan = getLanIp();
    console.log('\n✅ Hasu Chat is running!');
    console.log(`   ➜  Local:   http://127.0.0.1:${PORT}`);
    if (lan) {
        console.log(`   ➜  Network: http://${lan}:${PORT}  ← open this on your phone`);
    }
    console.log();
});
