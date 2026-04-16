const http = require("http");
const net = require("net");
const httpProxy = require("http-proxy");

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  console.log("\n===== HTTP REQUEST =====");
  console.log(req.method, req.url);

  proxy.web(req, res, {
    target: req.url, // forward dynamic luôn
    changeOrigin: true,
  });
});

// HTTPS tunneling
server.on("connect", (req, clientSocket, head) => {
  console.log("\n===== HTTPS CONNECT =====");
  console.log("CONNECT to:", req.url);

  const { hostname, port } = new URL(`http://${req.url}`);

  const serverSocket = net.connect(port || 443, hostname, () => {
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");

    if (head && head.length) {
      serverSocket.write(head);
    }

    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on("error", (err) => {
    console.error("Socket error:", err.message);
    clientSocket.end();
  });
});

proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err.message);
  if (res && !res.headersSent) {
    res.writeHead(500);
  }
  res?.end("Proxy error");
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log("Proxy server running on port", PORT);
});