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

  public bindAsync<U>(
    fn: (value: R) => Promise<Either<L, U>>,
  ): Promise<Either<L, U>> {
    if (this.isRight()) return fn(this.rightValue as R);
    return Promise.resolve(Either.left<L, U>(this.leftValue as L));
  }

  public bindLeftAsync<U>(
    fn: (value: L) => Promise<Either<U, R>>,
  ): Promise<Either<U, R>> {
    if (this.isLeft()) return fn(this.leftValue as L);
    return Promise.resolve(Either.right<U, R>(this.rightValue as R));
  }

  public matchAsync<U>(
    onRight: (value: R) => Promise<U>,
    onLeft: (value: L) => Promise<U>,
  ): Promise<U> {
    return this.isRight() ? onRight(this.rightValue!) : onLeft(this.leftValue!);
  }
}
