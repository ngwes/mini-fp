
import { Either } from "./Either.js";

export function traverseEither<L, R>(items: Either<L, R>[]): Either<L, R[]> {
  const result: R[] = [];

  for (const e of items) {
    if (e.isLeft()) return Either.left<L, R[]>(e.unwrapLeft());
    result.push(e.unwrapRight());
  }

  return Either.right<L, R[]>(result);
}