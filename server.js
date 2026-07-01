const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// Load .env
if (fs.existsSync(path.join(__dirname, '.env'))) {
    const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    env.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) process.env[key.trim()] = values.join('=').trim();
    });
}

const certDir  = path.join(__dirname, 'certs');
const certFile = path.join(certDir, 'cert.pem');
const keyFile  = path.join(certDir, 'key.pem');

const PORT_HTTPS = 8443;
const PORT_HTTP  = 8080;

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
    res.writeHead(200, {
        'Content-Type': type,
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
    });
    fs.createReadStream(filePath).pipe(res);
}

async function startServer() {
    if (!fs.existsSync(certDir)) fs.mkdirSync(certDir);

    if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
        console.log('🔐 Generating self-signed SSL certificate for hasu.local...');
        const selfsigned = require('selfsigned');
        const pems = selfsigned.generate(
            [{ name: 'commonName', value: 'hasu.local' }, { name: 'organizationName', value: 'Hasu Chat' }],
            {
                days: 365,
                keySize: 2048,
                algorithm: 'sha256',
                extensions: [{
                    name: 'subjectAltName',
                    altNames: [
                        { type: 2, value: 'hasu.local' },
                        { type: 7, ip: '127.0.0.1' },
                    ]
                }]
            }
        );
        fs.writeFileSync(certFile, pems.cert);
        fs.writeFileSync(keyFile,  pems.private);
        console.log('✅ Certificate saved to ./certs/');
    }

    const credentials = {
        key:  fs.readFileSync(keyFile),
        cert: fs.readFileSync(certFile),
    };

    // HTTPS server
    https.createServer(credentials, serve).listen(PORT_HTTPS, () => {
        console.log('\n🔒 Hasu Chat is now running securely!');
        console.log(`   ➜  https://hasu.local:${PORT_HTTPS}`);
        console.log(`   ➜  https://127.0.0.1:${PORT_HTTPS}\n`);
    });

    // HTTP → HTTPS redirect
    http.createServer((req, res) => {
        res.writeHead(301, { Location: `https://hasu.local:${PORT_HTTPS}${req.url}` });
        res.end();
    }).listen(PORT_HTTP, () => {
        console.log(`↪️  http://hasu.local:${PORT_HTTP}  →  https://hasu.local:${PORT_HTTPS}`);
    });
}

startServer().catch(err => { console.error('❌ Server failed to start:', err); process.exit(1); });
