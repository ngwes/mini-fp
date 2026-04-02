export class EitherAsync<L, R> implements PromiseLike<Either<L, R>> {
  private constructor(private readonly promise: Promise<Either<L, R>>) {}

  static from<L, R>(promise: Promise<Either<L, R>>): EitherAsync<L, R> {
    return new EitherAsync(promise);
  }

  public bindAsync<U>(fn: (value: R) => Promise<Either<L, U>>): EitherAsync<L, U>;
  public bindAsync<U>(promise: Promise<Either<L, U>>): EitherAsync<L, U>;
  public bindAsync<U>(
    fnOrPromise: ((value: R) => Promise<Either<L, U>>) | Promise<Either<L, U>>,
  ): EitherAsync<L, U> {
    if (fnOrPromise instanceof Promise) {
      return new EitherAsync<L, U>(
        this.promise.then(e =>
          e.isLeft()
            ? Promise.resolve(Either.left<L, U>(e.unwrapLeft()))
            : fnOrPromise,
        ),
      );
    }
    return new EitherAsync<L, U>(
      this.promise.then(e => {
        if (e.isRight()) return fnOrPromise(e.unwrapRight());
        return Promise.resolve(Either.left<L, U>(e.unwrapLeft()));
      }),
    );
  }

  public bindLeftAsync<U>(fn: (value: L) => Promise<Either<U, R>>): EitherAsync<U, R>;
  public bindLeftAsync<U>(promise: Promise<Either<U, R>>): EitherAsync<U, R>;
  public bindLeftAsync<U>(
    fnOrPromise: ((value: L) => Promise<Either<U, R>>) | Promise<Either<U, R>>,
  ): EitherAsync<U, R> {
    if (fnOrPromise instanceof Promise) {
      return new EitherAsync<U, R>(
        this.promise.then(e =>
          e.isRight()
            ? Promise.resolve(Either.right<U, R>(e.unwrapRight()))
            : fnOrPromise,
        ),
      );
    }
    return new EitherAsync<U, R>(
      this.promise.then(e => {
        if (e.isLeft()) return fnOrPromise(e.unwrapLeft());
        return Promise.resolve(Either.right<U, R>(e.unwrapRight()));
      }),
    );
  }

  public then<TResult1 = Either<L, R>, TResult2 = never>(
    onfulfilled?: ((value: Either<L, R>) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined,
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}

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

  public async mapAsync<U>(
    fn: (value: R) => Promise<U>,
  ): Promise<Either<L, U>> {
    if (this.isRight())
      return Either.right<L, U>(await fn(this.rightValue as R));
    return Either.left<L, U>(this.leftValue as L);
  }

  public async mapLeftAsync<U>(
    fn: (value: L) => Promise<U>,
  ): Promise<Either<U, R>> {
    if (this.isLeft()) return Either.left<U, R>(await fn(this.leftValue as L));
    return Either.right<U, R>(this.rightValue as R);
  }

  public bindAsync<U>(fn: (value: R) => Promise<Either<L, U>>): EitherAsync<L, U>;
  public bindAsync<U>(promise: Promise<Either<L, U>>): EitherAsync<L, U>;
  public bindAsync<U>(
    fnOrPromise: ((value: R) => Promise<Either<L, U>>) | Promise<Either<L, U>>,
  ): EitherAsync<L, U> {
    if (fnOrPromise instanceof Promise) {
      if (this.isLeft())
        return EitherAsync.from(Promise.resolve(Either.left<L, U>(this.leftValue as L)));
      return EitherAsync.from(fnOrPromise);
    }
    if (this.isRight()) return EitherAsync.from(fnOrPromise(this.rightValue as R));
    return EitherAsync.from(Promise.resolve(Either.left<L, U>(this.leftValue as L)));
  }

  public bindLeftAsync<U>(fn: (value: L) => Promise<Either<U, R>>): EitherAsync<U, R>;
  public bindLeftAsync<U>(promise: Promise<Either<U, R>>): EitherAsync<U, R>;
  public bindLeftAsync<U>(
    fnOrPromise: ((value: L) => Promise<Either<U, R>>) | Promise<Either<U, R>>,
  ): EitherAsync<U, R> {
    if (fnOrPromise instanceof Promise) {
      if (this.isRight())
        return EitherAsync.from(Promise.resolve(Either.right<U, R>(this.rightValue as R)));
      return EitherAsync.from(fnOrPromise);
    }
    if (this.isLeft()) return EitherAsync.from(fnOrPromise(this.leftValue as L));
    return EitherAsync.from(Promise.resolve(Either.right<U, R>(this.rightValue as R)));
  }

  public matchAsync<U>(
    onRight: (value: R) => Promise<U>,
    onLeft: (value: L) => Promise<U>,
  ): Promise<U> {
    return this.isRight() ? onRight(this.rightValue!) : onLeft(this.leftValue!);
  }
}
