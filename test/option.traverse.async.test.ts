import { describe, expect, it } from "vitest";
import { Option, traverseOptionAsync } from "../src";

const { some, none} = Option;

describe("traverseOptionAsync", () => {

  it("returns Some<T[]> when all items are Some(Promise)", async () => {
    const input = [
      some(Promise.resolve(1)),
      some(Promise.resolve(2)),
      some(Promise.resolve(3)),
    ];

    const result = await traverseOptionAsync(input);

    expect(result.isSome()).toBe(true);
    expect(result.unwrap()).toEqual([1, 2, 3]);
  });

  it("returns None when the first element is None", async () => {
    const input = [
      none<Promise<number>>(),
      some(Promise.resolve(2)),
    ];

    const result = await traverseOptionAsync(input);

    expect(result.isNone()).toBe(true);
  });

  it("returns None when a middle element is None", async () => {
    const input = [
      some(Promise.resolve(1)),
      none<Promise<number>>(),
      some(Promise.resolve(3)),
    ];

    const result = await traverseOptionAsync(input);

    expect(result.isNone()).toBe(true);
  });

  it("returns Some<[]> for an empty array", async () => {
    const result = await traverseOptionAsync<number>([]);

    expect(result.isSome()).toBe(true);
    expect(result.unwrap()).toEqual([]);
  });

  it("works with complex types", async () => {
    const input = [
      some(Promise.resolve({ id: 1 })),
      some(Promise.resolve({ id: 2 })),
    ];

    const result = await traverseOptionAsync(input);

    expect(result.isSome()).toBe(true);
    expect(result.unwrap()).toEqual([{ id: 1 }, { id: 2 }]);
  });

});