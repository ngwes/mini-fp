import { Either } from "./Either.js";

export class EitherAsync<L, R> implements PromiseLike<Either<L, R>> {
  private constructor(private readonly promise: Promise<Either<L, R>>) { }

  static from<L, R>(promise: Promise<Either<L, R>>): EitherAsync<L, R> {
    return new EitherAsync(promise);
  }

  static right<L, R>(value: R): EitherAsync<L, R> {
    return new EitherAsync(Promise.resolve(Either.right<L, R>(value)));
  }

  static left<L, R>(value: L): EitherAsync<L, R> {
    return new EitherAsync(Promise.resolve(Either.left<L, R>(value)));
  }

  public bindAsync<U>(fn: (value: R) => Promise<Either<L, U>>): EitherAsync<L, U>;
  public bindAsync<U>(fn: (value: R) => EitherAsync<L, U>): EitherAsync<L, U>;
  public bindAsync<U>(promise: Promise<Either<L, U>>): EitherAsync<L, U>;
  public bindAsync<U>(
    fnOrPromise: ((value: R) => Promise<Either<L, U>> | EitherAsync<L, U>) | Promise<Either<L, U>>
  ): EitherAsync<L, U> {
    if (fnOrPromise instanceof Promise) {
      return new EitherAsync<L, U>(
        this.promise.then(e => e.isLeft()
          ? Promise.resolve(Either.left<L, U>(e.unwrapLeft()))
          : fnOrPromise
        )
      );
    }
    return new EitherAsync<L, U>(
      this.promise.then(e => {
        if (e.isRight()) return Promise.resolve(fnOrPromise(e.unwrapRight()));
        return Promise.resolve(Either.left<L, U>(e.unwrapLeft()));
      })
    );
  }

  public bindLeftAsync<U>(fn: (value: L) => Promise<Either<U, R>>): EitherAsync<U, R>;
  public bindLeftAsync<U>(fn: (value: L) => EitherAsync<U, R>): EitherAsync<U, R>;
  public bindLeftAsync<U>(promise: Promise<Either<U, R>>): EitherAsync<U, R>;
  public bindLeftAsync<U>(
    fnOrPromise: ((value: L) => Promise<Either<U, R>> | EitherAsync<U, R>) | Promise<Either<U, R>>
  ): EitherAsync<U, R> {
    if (fnOrPromise instanceof Promise) {
      return new EitherAsync<U, R>(
        this.promise.then(e => e.isRight()
          ? Promise.resolve(Either.right<U, R>(e.unwrapRight()))
          : fnOrPromise
        )
      );
    }
    return new EitherAsync<U, R>(
      this.promise.then(e => {
        if (e.isLeft()) return Promise.resolve(fnOrPromise(e.unwrapLeft()));
        return Promise.resolve(Either.right<U, R>(e.unwrapRight()));
      })
    );
  }

  public then<TResult1 = Either<L, R>, TResult2 = never>(
    onfulfilled?: ((value: Either<L, R>) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
