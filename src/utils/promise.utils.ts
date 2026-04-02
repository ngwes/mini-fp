export function asTask<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}