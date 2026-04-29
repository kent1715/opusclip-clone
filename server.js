// Custom Next.js dev server that handles WebSocket HMR through proxies properly
const http = require('http');
const next = require('next');

const dev = true;
const port = 3000;

const app = next({ dev, turbopack: true });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;

      // Intercept HMR HTTP requests
      if (pathname.startsWith('/_next/webpack-hmr') || pathname.startsWith('/_next/hmr')) {
        res.writeHead(204, { 'Connection': 'close' });
        res.end();
        return;
      }

      handle(req, res).catch((err) => {
        console.error('[HANDLER ERROR]', err.message);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
        }
        res.end('Internal Server Error');
      });
    } catch (err) {
      console.error('[REQUEST ERROR]', err.message);
      if (!res.headersSent) {
        res.writeHead(500);
      }
      res.end();
    }
  });

  // Handle WebSocket upgrade requests - accept them but don't do anything
  // This prevents the crash from rejected upgrades
  server.on('upgrade', (req, socket, head) => {
    try {
      // For HMR WebSocket requests, create a dummy WebSocket that accepts but drops
      // This prevents the server from crashing on rejected upgrades
      const key = req.headers['sec-websocket-key'];
      if (key) {
        // Send a proper WebSocket accept response
        const crypto = require('crypto');
        const accept = crypto.createHash('sha1')
          .update(key + '258EAFA5-E914-47DA-95CA-5AB5DC65B281')
          .digest('base64');
        
        socket.write(
          'HTTP/1.1 101 Switching Protocols\r\n' +
          'Upgrade: websocket\r\n' +
          'Connection: Upgrade\r\n' +
          `Sec-WebSocket-Accept: ${accept}\r\n` +
          '\r\n'
        );
        
        // Just keep the socket open but ignore all data
        socket.on('data', () => {});
        socket.on('error', () => {});
        
        // Close after a short time to prevent resource leaks
        setTimeout(() => {
          try { socket.end(); } catch (e) { /* ignore */ }
        }, 30000);
      } else {
        socket.end();
      }
    } catch (err) {
      console.error('[WS ERROR]', err.message);
      try { socket.end(); } catch (e) { /* ignore */ }
    }
  });

  server.on('error', (err) => {
    console.error('[SERVER ERROR]', err.message);
  });

  server.on('clientError', (err, socket) => {
    if (socket.writable) {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
  });

  server.timeout = 30000;
  server.keepAliveTimeout = 5000;
  server.headersTimeout = 35000;

  server.listen(port, '0.0.0.0', () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });

  process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT]', err.message);
  });

  process.on('unhandledRejection', (err) => {
    console.error('[UNHANDLED REJECTION]', err);
  });
}).catch((err) => {
  console.error('[STARTUP ERROR]', err);
  process.exit(1);
});
