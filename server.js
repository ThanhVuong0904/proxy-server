const http = require("http");
const net = require("net");
const httpProxy = require("http-proxy");

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  console.log("\n===== HTTP REQUEST =====");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", req.headers);

  proxy.web(req, res, {
    target: "https://httpbin.org",
    changeOrigin: true,
  });
});

// HTTPS tunneling
server.on("connect", (req, clientSocket, head) => {
  console.log("\n===== HTTPS CONNECT =====");
  console.log("CONNECT to:", req.url);
  console.log("Headers:", req.headers);

  const { port, hostname } = new URL(`http://${req.url}`);

  const serverSocket = net.connect(port || 443, hostname, () => {
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");

    if (head && head.length) {
      serverSocket.write(head);
    }

    // log traffic size (optional)
    clientSocket.on("data", (chunk) => {
      console.log("Client -> Target:", chunk.length, "bytes");
    });

    serverSocket.on("data", (chunk) => {
      console.log("Target -> Client:", chunk.length, "bytes");
    });

    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on("error", (err) => {
    console.error("Server socket error:", err.message);
  });
});

// log khi proxy gửi request đi
proxy.on("proxyReq", (proxyReq, req) => {
  console.log("\n--- PROXY REQ ---");
  console.log("Forwarding:", req.method, req.url);
});

// log response từ target
proxy.on("proxyRes", (proxyRes, req, res) => {
  console.log("\n--- PROXY RES ---");
  console.log("Status:", proxyRes.statusCode);
});

// log lỗi
proxy.on("error", (err, req, res) => {
  console.error("\n*** PROXY ERROR ***");
  console.error(err.message);

  if (!res.headersSent) {
    res.writeHead(500);
  }
  res.end("Proxy error");
});

server.listen(9999, () => {
  console.log("Proxy server running on http://localhost:9999");
});