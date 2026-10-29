export function which<T>(condition: () => boolean, onTrue: () => T, onFalse: () => T): T;
export function which<S, T>(
  value: S,
  condition: (value: S) => boolean,
  onTrue: (value: S) => T,
  onFalse: (value: S) => T,
): T;
export function which<S, T>(
  ...args:
    | [condition: () => boolean, onTrue: () => T, onFalse: () => T]
    | [value: S, condition: (value: S) => boolean, onTrue: (value: S) => T, onFalse: (value: S) => T]
): T {
  if (args.length === 3) {
    const [condition, onTrue, onFalse] = args;
    return condition() ? onTrue() : onFalse();
  }

  const [value, condition, onTrue, onFalse] = args;
  return condition(value) ? onTrue(value) : onFalse(value);
}
