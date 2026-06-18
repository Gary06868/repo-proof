import http from 'node:http';
const PORT = 3000;
const server = http.createServer((req, res) => res.end('ok'));
server.listen(PORT, () => {
  setTimeout(() => server.close(() => process.exit(0)), 250);
});
