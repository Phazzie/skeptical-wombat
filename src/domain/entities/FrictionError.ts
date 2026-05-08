export class FrictionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FrictionError';
    Object.setPrototypeOf(this, FrictionError.prototype);
  }
}
