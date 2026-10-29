import { describe, expect, it, vi } from "vitest";
import { Either, traverseEither } from "../src";

const { right, left } = Either;

describe("traverseEither", () => {

  it("returns Right<R[]> when all elements are Right", () => {
    const input = [
      right<string, number>(1),
      right<string, number>(2),
      right<string, number>(3),
    ];

    const result = traverseEither(input);

    expect(result.isRight()).toBe(true);
    expect(result.unwrapRight()).toEqual([1, 2, 3]);
  });

  it("returns Left<L> when the first element is Left", () => {
    const input = [
      left<string, number>("err"),
      right<string, number>(2),
      right<string, number>(3),
    ];

    const result = traverseEither(input);

    expect(result.isLeft()).toBe(true);
    expect(result.unwrapLeft()).toBe("err");
  });

  it("returns Left<L> when a middle element is Left (fail-fast)", () => {
    const input = [
      right<string, number>(1),
      left<string, number>("boom"),
      right<string, number>(3),
    ];

    const result = traverseEither(input);

    expect(result.isLeft()).toBe(true);
    expect(result.unwrapLeft()).toBe("boom");
  });

  it("returns Left<L> when the last element is Left", () => {
    const input = [
      right<string, number>(1),
      right<string, number>(2),
      left<string, number>("bad"),
    ];

    const result = traverseEither(input);

    expect(result.isLeft()).toBe(true);
    expect(result.unwrapLeft()).toBe("bad");
  });

  it("returns Right<[]> for an empty array", () => {
    const result = traverseEither<string, number>([]);

    expect(result.isRight()).toBe(true);
    expect(result.unwrapRight()).toEqual([]);
  });

  it("works with complex types", () => {
    type ErrorType = { message: string };
    type Data = { id: number };

    const input = [
      right<ErrorType, Data>({ id: 1 }),
      right<ErrorType, Data>({ id: 2 }),
    ];

    const result = traverseEither(input);

    expect(result.isRight()).toBe(true);
    expect(result.unwrapRight()).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("traverseEither with a mapper maps every right", () => {
    const result = traverseEither([right<string, number>(1), right<string, number>(2)], x => x * 10);

    expect(result.isRight()).toBe(true);
    expect(result.unwrapRight()).toEqual([10, 20]);
  });

  it("traverseEither with a mapper stops at the first left", () => {
    const mapper = vi.fn((x: number) => x * 10);
    const input = [right<string, number>(1), left<string, number>("boom"), right<string, number>(3)];

    const result = traverseEither(input, mapper);

    expect(result.isLeft()).toBe(true);
    expect(result.unwrapLeft()).toBe("boom");
    expect(mapper).toHaveBeenCalledTimes(1);
  });

});