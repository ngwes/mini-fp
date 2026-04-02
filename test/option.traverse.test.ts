import { describe, expect, it } from "vitest";
import { Option, traverseOption } from "../src";

const { some, none} = Option;

describe("traverseOption", () => {

  it("returns Some<T[]> when all elements are Some", () => {
    const input = [
      some(1),
      some(2),
      some(3),
    ];

    const result = traverseOption(input);

    expect(result.isSome()).toBe(true);
    expect(result.unwrap()).toEqual([1, 2, 3]);
  });

  it("returns None when the first element is None", () => {
    const input = [
      none<number>(),
      some(2),
      some(3),
    ];

    const result = traverseOption(input);

    expect(result.isNone()).toBe(true);
  });

  it("returns None when a middle element is None (fail-fast)", () => {
    const input = [
      some(1),
      none<number>(),
      some(3),
    ];

    const result = traverseOption(input);

    expect(result.isNone()).toBe(true);
  });

  it("returns None when the last element is None", () => {
    const input = [
      some(1),
      some(2),
      none<number>(),
    ];

    const result = traverseOption(input);

    expect(result.isNone()).toBe(true);
  });

  it("returns Some<[]> when input array is empty", () => {
    const result = traverseOption<number>([]);

    expect(result.isSome()).toBe(true);
    expect(result.unwrap()).toEqual([]);
  });

  it("works with complex types", () => {
    type Data = { id: number };

    const input = [
      some<Data>({ id: 1 }),
      some<Data>({ id: 2 }),
    ];

    const result = traverseOption(input);

    expect(result.isSome()).toBe(true);
    expect(result.unwrap()).toEqual([{ id: 1 }, { id: 2 }]);
  });

});