const checked = <T>(value: T, name: string): T => {
  if (value === null || value === undefined)
    throw new Error(`${name} must contain a value`);
  return value;
};

export class Union<T1, T2> {
  private constructor(
    private readonly tag: 1 | 2,
    private readonly value: T1 | T2,
  ) {}

  static fromT1<T1, T2>(value: T1): Union<T1, T2> {
    return new Union<T1, T2>(1, checked(value, "T1"));
  }

  static fromT2<T1, T2>(value: T2): Union<T1, T2> {
    return new Union<T1, T2>(2, checked(value, "T2"));
  }

  isT1(): boolean {
    return this.tag === 1;
  }

  isT2(): boolean {
    return this.tag === 2;
  }

  match<U>(onT1: (value: T1) => U, onT2: (value: T2) => U): U {
    return this.isT1() ? onT1(this.value as T1) : onT2(this.value as T2);
  }

  async matchAsync<U>(
    onT1: (value: T1) => U | PromiseLike<U>,
    onT2: (value: T2) => U | PromiseLike<U>,
  ): Promise<U> {
    return this.match<U | PromiseLike<U>>(onT1, onT2);
  }
}

export class Union3<T1, T2, T3> {
  private constructor(
    private readonly tag: 1 | 2 | 3,
    private readonly value: T1 | T2 | T3,
  ) {}

  static fromT1<T1, T2, T3>(value: T1): Union3<T1, T2, T3> {
    return new Union3<T1, T2, T3>(1, checked(value, "T1"));
  }

  static fromT2<T1, T2, T3>(value: T2): Union3<T1, T2, T3> {
    return new Union3<T1, T2, T3>(2, checked(value, "T2"));
  }

  static fromT3<T1, T2, T3>(value: T3): Union3<T1, T2, T3> {
    return new Union3<T1, T2, T3>(3, checked(value, "T3"));
  }

  isT1(): boolean {
    return this.tag === 1;
  }

  isT2(): boolean {
    return this.tag === 2;
  }

  isT3(): boolean {
    return this.tag === 3;
  }

  match<U>(
    onT1: (value: T1) => U,
    onT2: (value: T2) => U,
    onT3: (value: T3) => U,
  ): U {
    return this.isT1()
      ? onT1(this.value as T1)
      : this.isT2()
        ? onT2(this.value as T2)
        : onT3(this.value as T3);
  }

  async matchAsync<U>(
    onT1: (value: T1) => U | PromiseLike<U>,
    onT2: (value: T2) => U | PromiseLike<U>,
    onT3: (value: T3) => U | PromiseLike<U>,
  ): Promise<U> {
    return this.match<U | PromiseLike<U>>(onT1, onT2, onT3);
  }
}
