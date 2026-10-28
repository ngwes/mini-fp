import { Either } from "../either/Either.js";
import { EitherAsync } from "../either/EitherAsync.js";
import { Try } from "./Try.js";

export class TryAsync<T> implements PromiseLike<Try<T>> {
  private constructor(private readonly internal: Promise<Try<T>>) {}

  static runAsync<T>(fn: () => PromiseLike<T>): TryAsync<T> {
    return new TryAsync(
      new Promise<T>(resolve => resolve(fn())).then(
        value => Try.run(() => value),
        error => Try.run<T>(() => { throw error; }),
      ),
    );
  }

  onFailAsync<L, R>(handler: (error: unknown) => PromiseLike<Either<L, R>>): EitherAsync<L, R>;
  onFailAsync(handler: (error: unknown) => PromiseLike<T>): Promise<T>;
  onFailAsync(handler: (error: unknown) => PromiseLike<any>): Promise<any> | EitherAsync<any, any> {
    const resultPromise = this.internal.then(result => result.onFailAsync(handler));
    return EitherAsync.from(resultPromise as Promise<Either<any, any>>);
  }

  then<TResult1 = Try<T>, TResult2 = never>(
    onfulfilled?: ((value: Try<T>) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): PromiseLike<TResult1 | TResult2> {
    return this.internal.then(onfulfilled, onrejected);
  }
}
