const http = require("http");
const net = require("net");
const httpProxy = require("http-proxy");

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  console.log("HTTP:", req.method, req.url);


  
  // ✅ Health check (Fly gọi cái này)
  if (req.url === "/") {
    res.writeHead(200);
    return res.end("OK");
  }

  // ❗ Chỉ proxy khi là full URL
  if (!req.url.startsWith("http")) {
    res.writeHead(400);
    return res.end("Invalid proxy request");
  }

  proxy.web(req, res, {
    target: req.url,
    changeOrigin: true,
  });
});

// HTTPS CONNECT
server.on("connect", (req, clientSocket, head) => {
  console.log("CONNECT:", req.url);

  const { hostname, port } = new URL(`http://${req.url}`);

  const serverSocket = net.connect(port || 443, hostname, () => {
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");

    if (head && head.length) {
      serverSocket.write(head);
    }

    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on("error", () => {
    clientSocket.end();
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Proxy server running on port", PORT);
});