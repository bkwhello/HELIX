import { PrismaClient } from "@prisma/client";
import { createApp } from "./app.js";
import { PrismaReservationRepository } from "../infrastructure/persistence/PrismaReservationRepository.js";
import { SystemClock } from "../infrastructure/SystemClock.js";
import { RandomIdGenerator } from "../infrastructure/RandomIdGenerator.js";

const prisma = new PrismaClient();
const app = createApp({
  repository: new PrismaReservationRepository(prisma),
  idGenerator: new RandomIdGenerator(),
  clock: new SystemClock(),
});

const port = Number(process.env["PORT"] ?? 3001);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CAP-D01.01 Reservation Management API listening on http://localhost:${port}`);
});
