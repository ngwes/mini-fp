import { Either } from "./Either.js";

export async function traverseEitherAsync<L, R>(
  items: Either<L, Promise<R>>[]
): Promise<Either<L, R[]>> {
  const result: R[] = [];

  for (const e of items) {
    if (e.isLeft()) return Either.left<L, R[]>(e.unwrapLeft());

    const value = await e.unwrapRight();
    result.push(value);
  }

  return Either.right<L, R[]>(result);
}

export async function bindAllAsync<L, T, U>(
  value: PromiseLike<Either<L, T>>,
  fns: ((value: T) => PromiseLike<Either<L, U>>)[],
): Promise<Either<L, U>[]> {
  const either = await value;

  return either.isRight()
    ? Promise.all(fns.map(fn => fn(either.unwrapRight())))
    : fns.map(() => Either.left<L, U>(either.unwrapLeft()));
}
