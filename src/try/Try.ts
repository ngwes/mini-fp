import { Either } from "../either/Either.js";
import { TryAsync } from "./TryAsync.js";
import type { Outcome } from "./outcome.js";

const attempt = <T>(fn: () => Outcome<T>): Outcome<T> => {
  try {
    return fn();
  } catch (error) {
    return { ok: false, error };
  }
};

export class Try<T> {
  private constructor(private readonly evaluate: () => Outcome<T>) {}

  static run<T>(fn: () => T): Try<T> {
    return new Try(() => attempt<T>(() => ({ ok: true, value: fn() })));
  }

  static runAsync<T>(fn: () => PromiseLike<T>): TryAsync<T> {
    return TryAsync.runAsync(fn);
  }

  isSuccess(): boolean {
    return this.evaluate().ok;
  }

  isFailure(): boolean {
    return !this.isSuccess();
  }

  memo(): Try<T> {
    let cached: Outcome<T> | undefined;
    return new Try(() => {
      const outcome = cached ?? this.evaluate();
      cached = outcome.ok ? outcome : undefined;
      return outcome;
    });
  }

  map<U>(fn: (value: T) => U): Try<U> {
    return new Try<U>(() => {
      const outcome = this.evaluate();
      return outcome.ok ? attempt<U>(() => ({ ok: true, value: fn(outcome.value) })) : outcome;
    }).memo();
  }

  bind<U>(fn: (value: T) => Try<U>): Try<U> {
    return new Try<U>(() => {
      const outcome = this.evaluate();
      return outcome.ok ? attempt(() => fn(outcome.value).evaluate()) : outcome;
    }).memo();
  }

  match<U>(onSuccess: (value: T) => U, onFail: ((error: unknown) => U) | U): U {
    const outcome = this.evaluate();
    if (outcome.ok)
      return onSuccess(outcome.value);

    return typeof onFail === "function" ? (onFail as (error: unknown) => U)(outcome.error) : onFail;
  }

  onFail(fallback: T | ((error: unknown) => T)): T {
    return this.match(value => value, fallback);
  }

  onFailAsync(fn: (error: unknown) => PromiseLike<T>): Promise<T> {
    return this.match(value => Promise.resolve(value), error => Promise.resolve(fn(error)));
  }

  toEither(): Either<unknown, T> {
    return this.match(value => Either.right<unknown, T>(value), error => Either.left<unknown, T>(error));
  }
}
