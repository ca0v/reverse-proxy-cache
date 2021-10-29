import { EchoServer } from "../echo-server.js";
const echo = new EchoServer({ port: 5115 });
echo.start();
