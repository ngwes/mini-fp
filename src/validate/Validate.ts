export class Validate<L, R> {
  private constructor(
    private readonly errors: L[] | null,
    private readonly value: R | null,
  ) {}

  static valid<L, R>(value: R | null): Validate<L, R> {
    if (value === null) throw new Error("value cannot be null");

    return new Validate<L, R>(null, value);
  }

  static invalid<L, R>(errors: L[] | null): Validate<L, R> {
    if (errors === null) throw new Error("value cannot be null");

    return new Validate<L, R>(errors, null);
  }

  isValid(): boolean {
    return this.errors === null;
  }

  isInvalid(): boolean {
    return !this.isValid();
  }

  unwrap(): R {
    if (this.isInvalid()) throw new Error("Instance is in the wrong state");

    return this.value!;
  }

  unwrapInvalid(): L[] {
    if (this.isValid()) throw new Error("Instance is in the wrong state");

    return this.errors!;
  }

  map<U>(fn: (value: R) => U): Validate<L, U> {
    return this.isValid()
      ? Validate.valid<L, U>(fn(this.value!))
      : Validate.invalid<L, U>(this.errors!);
  }

  bind<U>(fn: (value: R) => Validate<L, U>): Validate<L, U> {
    return this.isValid()
      ? fn(this.value!)
      : Validate.invalid<L, U>(this.errors!);
  }

  mapInvalid<U>(fn: (error: L) => U): Validate<U, R> {
    return this.isValid()
      ? Validate.valid<U, R>(this.value!)
      : Validate.invalid<U, R>(this.errors!.map(e => fn(e)));
  }

  bindInvalid<U>(fn: (errors: L[]) => Validate<U, R>): Validate<U, R> {
    return this.isValid()
      ? Validate.valid<U, R>(this.value!)
      : fn(this.errors!);
  }

  match<U>(
    onValid: ((value: R) => U) | U,
    onInvalid: ((errors: L[]) => U) | U,
  ): U {
    if (this.isValid())
      return typeof onValid === "function"
        ? (onValid as (value: R) => U)(this.value!)
        : onValid;

    return typeof onInvalid === "function"
      ? (onInvalid as (errors: L[]) => U)(this.errors!)
      : onInvalid;
  }

  async matchAsync<U>(
    onValid: ((value: R) => U | PromiseLike<U>) | PromiseLike<U>,
    onInvalid: ((errors: L[]) => U | PromiseLike<U>) | PromiseLike<U>,
  ): Promise<U> {
    if (this.isValid())
      return typeof onValid === "function" ? onValid(this.value!) : onValid;

    return typeof onInvalid === "function" ? onInvalid(this.errors!) : onInvalid;
  }

  combine(other: Validate<L, R>): Validate<L, R> {
    if (this.isValid() && other.isValid())
      return Validate.valid<L, R>(this.value!);

    const errors = [...(this.errors ?? []), ...(other.errors ?? [])];

    return Validate.invalid<L, R>(errors);
  }

  async combineAsync(other: Promise<Validate<L, R>>): Promise<Validate<L, R>> {
    const otherResult = await other;
    if (this.isValid() && otherResult.isValid())
      return Validate.valid<L, R>(this.value!);

    const errors = [...(this.errors ?? []), ...(otherResult.errors ?? [])];

    return Validate.invalid<L, R>(errors);
  }
}
