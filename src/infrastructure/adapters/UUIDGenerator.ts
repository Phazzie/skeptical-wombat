import { IdGeneratorPort } from '../../domain/ports/outbound/IdGeneratorPort';

export class UUIDGenerator implements IdGeneratorPort {
  generateId(): string {
    return crypto.randomUUID();
  }
}
