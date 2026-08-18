import { SessionRepository } from "../../domain/repositories/SessionRepository.js";
import { hashSessionToken } from "../../domain/shared/hashSessionToken.js";

export class LogoutHandler {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async handle(input: { readonly sessionToken: string }): Promise<void> {
    await this.sessionRepository.revoke(hashSessionToken(input.sessionToken));
  }
}
