import app from "./app.js";
import prisma from "./lib/prisma.js";

const port = Number(process.env.PORT ?? 5000);

const server = app.listen(port, () => {
  console.log(`CRM API listening on http://localhost:${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
