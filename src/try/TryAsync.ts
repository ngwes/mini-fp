import { Either } from "../either/Either.js";
import { EitherAsync } from "../either/EitherAsync.js";
import { Try } from "./Try.js";
import type { Outcome } from "./outcome.js";

const attempt = async <T>(fn: () => Outcome<T> | PromiseLike<Outcome<T>>): Promise<Outcome<T>> => {
  try {
    return await fn();
  } catch (error) {
    return { ok: false, error };
  }
};

export class TryAsync<T> implements PromiseLike<Try<T>> {
  private constructor(private readonly evaluate: () => Promise<Outcome<T>>) {}

  static runAsync<T>(fn: () => PromiseLike<T>): TryAsync<T> {
    return new TryAsync(() => attempt<T>(async () => ({ ok: true, value: await fn() })));
  }

  memo(): TryAsync<T> {
    let cached: Promise<Outcome<T>> | undefined;
    return new TryAsync(() => {
      cached ??= this.evaluate().then(outcome => {
        cached = outcome.ok ? cached : undefined;
        return outcome;
      });
      return cached;
    });
  }

  bind<U>(fn: (value: T) => TryAsync<U>): TryAsync<U> {
    return new TryAsync<U>(() => this.evaluate().then(outcome =>
      outcome.ok ? attempt(() => fn(outcome.value).evaluate()) : outcome,
    )).memo();
  }

  do(action: (value: T) => void): TryAsync<T> {
    return new TryAsync<T>(() => this.evaluate().then(outcome =>
      outcome.ok ? attempt(() => { action(outcome.value); return outcome; }) : outcome,
    ));
  }

  match<U>(
    onSuccess: (value: T) => U | PromiseLike<U>,
    onFail: ((error: unknown) => U | PromiseLike<U>) | U,
  ): Promise<U> {
    return this.evaluate().then(outcome => {
      if (outcome.ok)
        return onSuccess(outcome.value);

      return typeof onFail === "function"
        ? (onFail as (error: unknown) => U | PromiseLike<U>)(outcome.error)
        : onFail;
    });
  }

  onFail(fallback: T | ((error: unknown) => T | PromiseLike<T>)): Promise<T> {
    return this.match(value => value, fallback);
  }

  onFailAsync<L, R>(handler: (error: unknown) => PromiseLike<Either<L, R>>): EitherAsync<L, R>;
  onFailAsync(handler: (error: unknown) => PromiseLike<T>): PromiseLike<T>;
  onFailAsync(handler: (error: unknown) => PromiseLike<any>): PromiseLike<any> | EitherAsync<any, any> {
    return EitherAsync.from(this.match<any>(value => value, handler));
  }

  toEither(): EitherAsync<unknown, T> {
    return EitherAsync.from(
      this.match(value => Either.right<unknown, T>(value), error => Either.left<unknown, T>(error)),
    );
  }

  then<TResult1 = Try<T>, TResult2 = never>(
    onfulfilled?: ((value: Try<T>) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): PromiseLike<TResult1 | TResult2> {
    return this.match(value => Try.run(() => value), error => Try.run<T>(() => { throw error; }))
      .then(onfulfilled, onrejected);
  }
}
