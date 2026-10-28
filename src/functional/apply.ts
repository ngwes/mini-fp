export function apply<A, Rest extends unknown[], R>(
  fn: (first: A, ...rest: Rest) => R,
  first: A,
): (...rest: Rest) => R {
  return (...rest) => fn(first, ...rest);
}
