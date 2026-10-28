import { EitherAsync } from "./EitherAsync.js";
import { pickGuard } from "../utils/guard.js";
import type { Guard } from "../utils/guard.js";

export class Either<L, R> {
  private constructor(
    private readonly leftValue: L | null | undefined,
    private readonly rightValue: R | null | undefined,
  ) {}

  public static left<L, R>(value: L): Either<L, R> {
    if (value === null || value === undefined)
      throw new Error("Left must contain a value");
    return new Either<L, R>(value, undefined);
  }

  public static right<L, R>(value: R): Either<L, R> {
    if (value === null || value === undefined)
      throw new Error("Right must contain a value");
    return new Either<L, R>(undefined, value);
  }

  public isLeft(): boolean {
    return this.leftValue !== null && this.leftValue !== undefined;
  }

  public isRight(): boolean {
    return this.rightValue !== null && this.rightValue !== undefined;
  }

  public unwrapLeft(): L {
    if (this.isLeft()) return this.leftValue!;
    throw new Error("Istance is in the wrong state");
  }

  public unwrapRight(): R {
    if (this.isRight()) return this.rightValue!;
    throw new Error("Istance is in the wrong state");
  }

  public map<U>(fn: (value: R) => U): Either<L, U> {
    if (this.isRight()) return Either.right<L, U>(fn(this.rightValue as R));
    return Either.left<L, U>(this.leftValue as L);
  }

  public mapLeft<U>(fn: (value: L) => U): Either<U, R> {
    if (this.isLeft()) return Either.left<U, R>(fn(this.leftValue as L));
    return Either.right<U, R>(this.rightValue as R);
  }

  public bind<U>(fn: (value: R) => Either<L, U>): Either<L, U> {
    if (this.isRight()) return fn(this.rightValue as R);
    return Either.left<L, U>(this.leftValue as L);
  }

  public bindLeft<U>(fn: (value: L) => Either<U, R>): Either<U, R> {
    if (this.isLeft()) return fn(this.leftValue as L);
    return Either.right<U, R>(this.rightValue as R);
  }

  public match<U>(onRight: (value: R) => U, onLeft: (value: L) => U): U {
    return this.isRight() ? onRight(this.rightValue!) : onLeft(this.leftValue!);
  }

  public onRight(action: (value: R) => void): Either<L, R> {
    if (this.isRight()) action(this.rightValue as R);
    return this;
  }

  public onLeft(action: (value: L) => void): Either<L, R> {
    if (this.isLeft()) action(this.leftValue as L);
    return this;
  }

  public guardMap<U>(otherwise: (value: R) => U, ...guards: Guard<R, U>[]): Either<L, U> {
    return this.map(value => pickGuard(value, otherwise, guards)(value));
  }

  public guardBind<U>(
    otherwise: (value: R) => Either<L, U>,
    ...guards: Guard<R, Either<L, U>>[]
  ): Either<L, U>;
  public guardBind<A, B>(
    onLeft: (value: L) => Either<A, B>,
    otherwise: (value: R) => Either<A, B>,
    ...guards: Guard<R, Either<A, B>>[]
  ): Either<A, B>;
  public guardBind<A, B>(
    first: ((value: R) => Either<A, B>) | ((value: L) => Either<A, B>),
    second?: ((value: R) => Either<A, B>) | Guard<R, Either<A, B>>,
    ...rest: Guard<R, Either<A, B>>[]
  ): Either<A, B> {
    return this.matchGuards(first, second, rest, value => Either.left<A, B>(value as unknown as A));
  }

  public mapAsync<U>(fn: (value: R) => PromiseLike<U>): EitherAsync<L, U> {
    return this.bindAsync(async value => Either.right<L, U>(await fn(value)));
  }

  public mapLeftAsync<U>(fn: (value: L) => PromiseLike<U>): EitherAsync<U, R> {
    return this.bindLeftAsync(async value => Either.left<U, R>(await fn(value)));
  }

  public bindAsync<U>(fn: (value: R) => PromiseLike<Either<L, U>>): EitherAsync<L, U>;
  public bindAsync<U>(promise: PromiseLike<Either<L, U>>): EitherAsync<L, U>;
  public bindAsync<U>(
    fnOrPromise: ((value: R) => PromiseLike<Either<L, U>>) | PromiseLike<Either<L, U>>,
  ): EitherAsync<L, U> {
    if (this.isLeft()) return EitherAsync.left<L, U>(this.leftValue as L);
    return EitherAsync.from(
      typeof fnOrPromise === "function" ? fnOrPromise(this.rightValue as R) : fnOrPromise,
    );
  }

  public bindLeftAsync<U>(fn: (value: L) => PromiseLike<Either<U, R>>): EitherAsync<U, R>;
  public bindLeftAsync<U>(promise: PromiseLike<Either<U, R>>): EitherAsync<U, R>;
  public bindLeftAsync<U>(
    fnOrPromise: ((value: L) => PromiseLike<Either<U, R>>) | PromiseLike<Either<U, R>>,
  ): EitherAsync<U, R> {
    if (this.isRight()) return EitherAsync.right<U, R>(this.rightValue as R);
    return EitherAsync.from(
      typeof fnOrPromise === "function" ? fnOrPromise(this.leftValue as L) : fnOrPromise,
    );
  }

  public guardMapAsync<U>(
    otherwise: (value: R) => PromiseLike<U>,
    ...guards: Guard<R, PromiseLike<U>>[]
  ): EitherAsync<L, U> {
    return this.mapAsync(value => pickGuard(value, otherwise, guards)(value));
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
    return EitherAsync.from(
      this.matchGuards(first, second, rest, value => EitherAsync.left<A, B>(value as unknown as A)),
    );
  }

  public async matchAsync<U>(
    onRight: (value: R) => U | PromiseLike<U>,
    onLeft: (value: L) => U | PromiseLike<U>,
  ): Promise<U> {
    return this.isRight() ? onRight(this.rightValue!) : onLeft(this.leftValue!);
  }

  // A function as second argument means the first one is onLeft; otherwise the left is kept.
  private matchGuards<U>(
    first: ((value: R) => U) | ((value: L) => U),
    second: ((value: R) => U) | Guard<R, U> | undefined,
    rest: Guard<R, U>[],
    keepLeft: (value: L) => U,
  ): U {
    const hasOnLeft = typeof second === "function";
    const onLeft = hasOnLeft ? (first as (value: L) => U) : keepLeft;
    const otherwise = hasOnLeft ? second : (first as (value: R) => U);
    const guards = hasOnLeft || !second ? rest : [second, ...rest];
    return this.match(value => pickGuard(value, otherwise, guards)(value), onLeft);
  }
}
