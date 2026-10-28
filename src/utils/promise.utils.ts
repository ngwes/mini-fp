import { Unit } from "../unit/Unit.js";

export function asTask<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

export function asPromise<T>(value: T): Promise<T> {
  return asTask(value);
}

export async function toUnitAsync(promise: PromiseLike<unknown>): Promise<Unit> {
  await promise;
  return Unit.default;
}
