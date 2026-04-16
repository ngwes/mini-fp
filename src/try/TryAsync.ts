import { Try } from "./Try.js";

export class TryAsync<T> implements PromiseLike<Try<T>> {
  private constructor(private readonly internal: Promise<Try<T>>) {}

  static runAsync<T>(fn: () => PromiseLike<T>): TryAsync<T> {
    return new TryAsync(Try.runAsync(fn));
  }

  onFailAsync(handler: (error: unknown) => PromiseLike<T>): Promise<T> {
    return this.internal.then(result =>
      result.onFailAsync(handler)
    );
  }

  then<TResult1 = Try<T>, TResult2 = never>(
    onfulfilled?: ((value: Try<T>) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): PromiseLike<TResult1 | TResult2> {
    return this.internal.then(onfulfilled, onrejected);
  }
}
