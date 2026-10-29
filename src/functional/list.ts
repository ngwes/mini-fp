import type { Either } from "../either/Either.js";
import type { Option } from "../option/Option.js";

const always = (): boolean => true;

export function filterSome<T>(items: Option<T>[], predicate: (value: T) => boolean = always): T[] {
  return items.filter(o => o.isSome()).map(o => o.unwrap()).filter(v => predicate(v));
}

export function filterRight<L, R>(items: Either<L, R>[], predicate: (value: R) => boolean = always): R[] {
  return items.filter(e => e.isRight()).map(e => e.unwrapRight()).filter(v => predicate(v));
}

export function filterLeft<L, R>(items: Either<L, R>[], predicate: (value: L) => boolean = always): L[] {
  return items.filter(e => e.isLeft()).map(e => e.unwrapLeft()).filter(v => predicate(v));
}

export function mapSome<T, U>(items: Option<T>[], fn: (value: T) => U): U[] {
  return filterSome(items).map(v => fn(v));
}

export function mapRight<L, R, U>(items: Either<L, R>[], fn: (value: R) => U): U[] {
  return filterRight(items).map(v => fn(v));
}

export function mapLeft<L, R, U>(items: Either<L, R>[], fn: (value: L) => U): U[] {
  return filterLeft(items).map(v => fn(v));
}

export async function foldAsync<T, S>(
  items: T[],
  state: S | PromiseLike<S>,
  folder: (state: S, item: T) => S | PromiseLike<S>,
): Promise<S> {
  let acc = await state;
  for (const item of items) acc = await folder(acc, item);
  return acc;
}
