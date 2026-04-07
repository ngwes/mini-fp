
import { Option } from "./Option.js";

export function traverseOption<T>(items: Option<T>[]): Option<T[]> {
  const result: T[] = [];

  for (const o of items) {
    if (o.isNone()) return Option.none<T[]>();
    result.push(o.unwrap());
  }

  return Option.some(result);
}
