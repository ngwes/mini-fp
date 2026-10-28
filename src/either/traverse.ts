import { Either } from "./Either.js";

export function traverseEither<L, R>(items: Either<L, R>[]): Either<L, R[]>;
export function traverseEither<L, T, U>(items: Either<L, T>[], map: (value: T) => U): Either<L, U[]>;
export function traverseEither<L, T, U>(
  items: Either<L, T>[],
  map: (value: T) => T | U = value => value,
): Either<L, (T | U)[]> {
  const result: (T | U)[] = [];

  for (const e of items) {
    if (e.isLeft()) return Either.left<L, (T | U)[]>(e.unwrapLeft());
    result.push(map(e.unwrapRight()));
  }

  return Either.right<L, (T | U)[]>(result);
}
