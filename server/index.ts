import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";

// 환경 변수 로드
dotenv.config({ path: "../.env" });
// import { setupVite, serveStatic, log } from "./vite";

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();

// CORS 설정
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("서버 에러:", err);
    res.status(status).json({ message });
    // throw err; // 이 줄을 제거하여 서버가 종료되지 않도록 함
  });

  // Vite 설정 건너뛰기 (개발용)
  // if (app.get("env") === "development") {
  //   await setupVite(app, server);
  // } else {
  //   serveStatic(app);
  // }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 6000;
  server.listen(port, "localhost", () => {
    log(`serving on port ${port}`);
  });
})();
