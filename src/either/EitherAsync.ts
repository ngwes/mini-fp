import { Either } from "./Either.js";
import type { Guard } from "../utils/guard.js";

export class EitherAsync<L, R> implements PromiseLike<Either<L, R>> {
  private constructor(private readonly promise: Promise<Either<L, R>>) { }

  static from<L, R>(promise: PromiseLike<Either<L, R>>): EitherAsync<L, R> {
    return new EitherAsync(Promise.resolve(promise));
  }

  static right<L, R>(value: R): EitherAsync<L, R> {
    return EitherAsync.from(Promise.resolve(Either.right<L, R>(value)));
  }

  static left<L, R>(value: L): EitherAsync<L, R> {
    return EitherAsync.from(Promise.resolve(Either.left<L, R>(value)));
  }

  public map<U>(fn: (value: R) => U): EitherAsync<L, U> {
    return EitherAsync.from(this.promise.then(e => e.map(fn)));
  }

  public mapLeft<U>(fn: (value: L) => U): EitherAsync<U, R> {
    return EitherAsync.from(this.promise.then(e => e.mapLeft(fn)));
  }

  public bind<U>(fn: (value: R) => Either<L, U>): EitherAsync<L, U> {
    return EitherAsync.from(this.promise.then(e => e.bind(fn)));
  }

  public bindLeft<U>(fn: (value: L) => Either<U, R>): EitherAsync<U, R> {
    return EitherAsync.from(this.promise.then(e => e.bindLeft(fn)));
  }

  public mapAsync<U>(fn: (value: R) => PromiseLike<U>): EitherAsync<L, U> {
    return EitherAsync.from(this.promise.then(e => e.mapAsync(fn)));
  }

  public mapLeftAsync<U>(fn: (value: L) => PromiseLike<U>): EitherAsync<U, R> {
    return EitherAsync.from(this.promise.then(e => e.mapLeftAsync(fn)));
  }

  public bindAsync<U>(fn: (value: R) => PromiseLike<Either<L, U>>): EitherAsync<L, U>;
  public bindAsync<U>(promise: PromiseLike<Either<L, U>>): EitherAsync<L, U>;
  public bindAsync<U>(
    fnOrPromise: ((value: R) => PromiseLike<Either<L, U>>) | PromiseLike<Either<L, U>>,
  ): EitherAsync<L, U> {
    const fn = typeof fnOrPromise === "function" ? fnOrPromise : () => fnOrPromise;
    return EitherAsync.from(this.promise.then(e => e.bindAsync(fn)));
  }

  public bindLeftAsync<U>(fn: (value: L) => PromiseLike<Either<U, R>>): EitherAsync<U, R>;
  public bindLeftAsync<U>(promise: PromiseLike<Either<U, R>>): EitherAsync<U, R>;
  public bindLeftAsync<U>(
    fnOrPromise: ((value: L) => PromiseLike<Either<U, R>>) | PromiseLike<Either<U, R>>,
  ): EitherAsync<U, R> {
    const fn = typeof fnOrPromise === "function" ? fnOrPromise : () => fnOrPromise;
    return EitherAsync.from(this.promise.then(e => e.bindLeftAsync(fn)));
  }

  public onRight(action: (value: R) => void): EitherAsync<L, R> {
    return EitherAsync.from(this.promise.then(e => e.onRight(action)));
  }

  public onLeft(action: (value: L) => void): EitherAsync<L, R> {
    return EitherAsync.from(this.promise.then(e => e.onLeft(action)));
  }

  public guardMap<U>(otherwise: (value: R) => U, ...guards: Guard<R, U>[]): EitherAsync<L, U> {
    return EitherAsync.from(this.promise.then(e => e.guardMap(otherwise, ...guards)));
  }

  public guardMapAsync<U>(
    otherwise: (value: R) => PromiseLike<U>,
    ...guards: Guard<R, PromiseLike<U>>[]
  ): EitherAsync<L, U> {
    return EitherAsync.from(this.promise.then(e => e.guardMapAsync(otherwise, ...guards)));
  }

  public guardBind<U>(
    otherwise: (value: R) => Either<L, U>,
    ...guards: Guard<R, Either<L, U>>[]
  ): EitherAsync<L, U>;
  public guardBind<A, B>(
    onLeft: (value: L) => Either<A, B>,
    otherwise: (value: R) => Either<A, B>,
    ...guards: Guard<R, Either<A, B>>[]
  ): EitherAsync<A, B>;
  public guardBind<A, B>(
    first: ((value: R) => Either<A, B>) | ((value: L) => Either<A, B>),
    second?: ((value: R) => Either<A, B>) | Guard<R, Either<A, B>>,
    ...rest: Guard<R, Either<A, B>>[]
  ): EitherAsync<A, B> {
    // Either.guardBind picks its overload from the runtime shape of `second`: forward the arguments unchanged.
    return EitherAsync.from(this.promise.then(e => e.guardBind(
      first as (value: L) => Either<A, B>,
      second as (value: R) => Either<A, B>,
      ...rest,
    )));
  }

  public guardBindAsync<U>(
    otherwise: (value: R) => PromiseLike<Either<L, U>>,
    ...guards: Guard<R, PromiseLike<Either<L, U>>>[]
  ): EitherAsync<L, U>;
  public guardBindAsync<A, B>(
    onLeft: (value: L) => PromiseLike<Either<A, B>>,
    otherwise: (value: R) => PromiseLike<Either<A, B>>,
    ...guards: Guard<R, PromiseLike<Either<A, B>>>[]
  ): EitherAsync<A, B>;
  public guardBindAsync<A, B>(
    first: ((value: R) => PromiseLike<Either<A, B>>) | ((value: L) => PromiseLike<Either<A, B>>),
    second?: ((value: R) => PromiseLike<Either<A, B>>) | Guard<R, PromiseLike<Either<A, B>>>,
    ...rest: Guard<R, PromiseLike<Either<A, B>>>[]
  ): EitherAsync<A, B> {
    // Either.guardBindAsync picks its overload from the runtime shape of `second`: forward the arguments unchanged.
    return EitherAsync.from(this.promise.then(e => e.guardBindAsync(
      first as (value: L) => PromiseLike<Either<A, B>>,
      second as (value: R) => PromiseLike<Either<A, B>>,
      ...rest,
    )));
  }

  public match<U>(onRight: (value: R) => U, onLeft: (value: L) => U): Promise<U> {
    return this.promise.then(e => e.match(onRight, onLeft));
  }

  public matchAsync<U>(
    onRight: (value: R) => U | PromiseLike<U>,
    onLeft: (value: L) => U | PromiseLike<U>,
  ): Promise<U> {
    return this.promise.then(e => e.matchAsync(onRight, onLeft));
  }

  public then<TResult1 = Either<L, R>, TResult2 = never>(
    onfulfilled?: ((value: Either<L, R>) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
