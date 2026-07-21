import { randomUUID } from "node:crypto";
import { EventIdGenerator } from "../application/ports/EventIdGenerator.js";

export class RandomEventIdGenerator implements EventIdGenerator {
  generate(): string {
    return randomUUID();
  }
}
