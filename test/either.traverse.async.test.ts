import { describe, expect, it, vi } from "vitest";
import { Either, EitherAsync, bindAllAsync, traverseEitherAsync } from "../src";

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

describe("bindAllAsync", () => {

  it("bindAllAsync applies every function to the right value", async () => {
    const results = await bindAllAsync(Promise.resolve(right<string, number>(2)), [
      x => Promise.resolve(right<string, number>(x + 1)),
      x => EitherAsync.right<string, number>(x * 10),
    ]);

    expect(results.map(r => r.unwrapRight())).toEqual([3, 20]);
  });

  it("bindAllAsync runs the functions in parallel", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    const second = vi.fn((x: number) => Promise.resolve(right<string, number>(x)));

    const pending = bindAllAsync(EitherAsync.right<string, number>(1), [
      x => gate.then(() => right<string, number>(x)),
      second,
    ]);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(second).toHaveBeenCalledWith(1);
    release();
    expect((await pending).map(r => r.unwrapRight())).toEqual([1, 1]);
  });

  it("on a left every result is that left", async () => {
    const fn = vi.fn((x: number) => Promise.resolve(right<string, number>(x)));

    const results = await bindAllAsync(Promise.resolve(left<string, number>("bad")), [fn, fn]);

    expect(results).toHaveLength(2);
    expect(results.every(r => r.isLeft() && r.unwrapLeft() === "bad")).toBe(true);
    expect(fn).not.toHaveBeenCalled();
  });

});
