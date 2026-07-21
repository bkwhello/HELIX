/** Generates a new unique event identity for the domain event envelope (event-model.md §4, `event_id`). */
export interface EventIdGenerator {
  generate(): string;
}
