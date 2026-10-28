import { describe, expect, it } from "vitest";
import { invalid, left, none, right, some, valid } from "../src";

describe("prelude", () => {
  it("prelude functions build the same values as the statics", () => {
    expect(some(1).unwrap()).toBe(1);
    expect(none().isNone()).toBe(true);
    expect(left<string, number>("e").isLeft()).toBe(true);
    expect(right(1).isRight()).toBe(true);
    expect(valid(1).isValid()).toBe(true);
    expect(invalid(["e"]).isInvalid()).toBe(true);
  });

  it("prelude functions keep their generic signatures", () => {
    const value: number = right<string, number>(2).map(x => x * 2).unwrapRight();
    const errors: string[] = invalid<string, number>(["e"]).unwrapInvalid();

    expect(value).toBe(4);
    expect(errors).toEqual(["e"]);
  });
});
