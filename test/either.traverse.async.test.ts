import { describe, expect, it } from "vitest";
import { Either, traverseEitherAsync } from "../src";

const { right, left } = Either;


describe("traverseEitherAsync", () => {

  it("returns Right<R[]> when all elements are Right(Promise)", async () => {
    const input = [
       right<string, Promise<number>>(Promise.resolve(1)),
       right<string, Promise<number>>(Promise.resolve(2)),
       right<string, Promise<number>>(Promise.resolve(3)),
    ];

    const result = await traverseEitherAsync(input);

    expect(result.isRight()).toBe(true);
    expect(result.unwrapRight()).toEqual([1, 2, 3]);
  });

  it("returns Left<L> when first element is Left", async () => {
    const input = [
      left<string, Promise<number>>("bad"),
       right<string, Promise<number>>(Promise.resolve(2)),
    ];

    const result = await traverseEitherAsync(input);

    expect(result.isLeft()).toBe(true);
    expect(result.unwrapLeft()).toBe("bad");
  });

  it("returns Left<L> when middle element is Left (fail-fast)", async () => {
    const input = [
       right<string, Promise<number>>(Promise.resolve(1)),
      left<string, Promise<number>>("error"),
       right<string, Promise<number>>(Promise.resolve(3)),
    ];

    const result = await traverseEitherAsync(input);

    expect(result.isLeft()).toBe(true);
    expect(result.unwrapLeft()).toBe("error");
  });

  it("returns Right<[]> for empty array", async () => {
    const result = await traverseEitherAsync<string, number>([]);

    expect(result.isRight()).toBe(true);
    expect(result.unwrapRight()).toEqual([]);
  });

  it("works with complex types", async () => {
    type Err = { code: number };
    type Data = { id: number };

    const input = [
       right<Err, Promise<Data>>(Promise.resolve({ id: 1 })),
       right<Err, Promise<Data>>(Promise.resolve({ id: 2 })),
    ];

    const result = await traverseEitherAsync(input);

    expect(result.isRight()).toBe(true);
    expect(result.unwrapRight()).toEqual([{ id: 1 }, { id: 2 }]);
  });

});