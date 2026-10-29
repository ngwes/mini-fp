export function tee<T>(value: T, action: (value: T) => void): T {
  action(value);
  return value;
}

export function teeWhen<T>(value: T, action: (value: T) => void, when: (value: T) => boolean): T {
  return when(value) ? tee(value, action) : value;
}

export function teeAsync<T>(value: PromiseLike<T>, action: (value: T) => unknown): Promise<T> {
  return teeWhenAsync(value, action, () => true);
}

export async function teeWhenAsync<T>(
  value: PromiseLike<T>,
  action: (value: T) => unknown,
  when: (value: T) => boolean,
): Promise<T> {
  const resolved = await value;
  if (when(resolved)) await action(resolved);
  return resolved;
}
