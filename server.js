const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

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
