export class Try<T> {
  private constructor(
    private readonly value: T | null,
    private readonly error: unknown | null,
  ) {}

  static run<T>(fn: () => T): Try<T> {
    try {
      return new Try(fn(), null);
    } catch (err) {
      return new Try<T>(null, err);
    }
  }
  
 static async runAsync<T>(fn: () => PromiseLike<T>): Promise<Try<T>> {
    try {
      return new Try(await fn(), null);
    } catch (err) {
      return new Try<T>(null, err);
    }
  }

  isSuccess(): boolean {
    return this.error === null;
  }

  isFailure(): boolean {
    return !this.isSuccess();
  }

  onFail(fn: (error: unknown) => T): T {
    if(this.isFailure())
        return fn(this.error)
    return this.value!
  }

  onFailAsync(fn: (error: unknown) => PromiseLike<T>): Promise<T> {
    if(this.isFailure())
        return Promise.resolve(fn(this.error))
    return Promise.resolve(this.value!)
  }
}
