export function asTask<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

export function asPromise<T>(value: T): Promise<T> {
  return asTask(value);
}