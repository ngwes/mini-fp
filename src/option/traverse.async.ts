import { Option } from "./Option.js";

export async function traverseOptionAsync<T>(
  items: Option<Promise<T>>[]
): Promise<Option<T[]>> {
  const result: T[] = [];

  for (const o of items) {
    if (o.isNone()) return Option.none<T[]>();
    const value = await o.unwrap();
    result.push(value);
  }

  return Option.some(result);
}