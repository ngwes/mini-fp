export type DisposableResource = { dispose(): void };

export function using<D extends DisposableResource, T>(resource: D, fn: (resource: D) => T): T {
  try {
    return fn(resource);
  } finally {
    resource.dispose();
  }
}

export function usingAsync<D extends DisposableResource, T>(
  resource: D,
  fn: (resource: D) => PromiseLike<T>,
): Promise<T>;
export function usingAsync<D1 extends DisposableResource, D2 extends DisposableResource, T>(
  first: D1,
  createSecond: (first: D1) => D2,
  fn: (first: D1, second: D2) => PromiseLike<T>,
): Promise<T>;
export async function usingAsync<D1 extends DisposableResource, D2 extends DisposableResource, T>(
  first: D1,
  ...args:
    | [fn: (resource: D1) => PromiseLike<T>]
    | [createSecond: (first: D1) => D2, fn: (first: D1, second: D2) => PromiseLike<T>]
): Promise<T> {
  if (args.length === 2) {
    const [createSecond, fn] = args;
    return usingAsync(first, f => usingAsync(createSecond(f), second => fn(f, second)));
  }

  try {
    return await args[0](first);
  } finally {
    first.dispose();
  }
}
