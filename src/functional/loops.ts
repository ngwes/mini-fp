export function repeatWhile<T>(init: () => T, when: (acc: T) => boolean, step: (acc: T) => T): T {
  let acc = init();
  while (when(acc)) acc = step(acc);
  return acc;
}

export async function repeatWhileAsync<T>(
  init: () => T | PromiseLike<T>,
  when: (acc: T) => boolean,
  step: (acc: T) => T | PromiseLike<T>,
): Promise<T> {
  let acc = await init();
  while (when(acc)) acc = await step(acc);
  return acc;
}
