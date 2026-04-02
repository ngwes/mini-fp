import { describe, expect, it } from "vitest";
import { Validate, sequenceValidateAsync } from "../src";

const{valid, invalid} = Validate;

describe("sequenceValidateAsync", () => {

  it("returns Valid<R[]> when all async results are valid", async () => {
    const inputPromise = Promise.resolve([
      valid<string, number>(1),
      valid<string, number>(2),
      valid<string, number>(3),
    ]);

    const result = await sequenceValidateAsync(inputPromise);

    expect(result.isValid()).toBe(true);
    expect(result.unwrap()).toEqual([1, 2, 3]);
  });

  it("returns Invalid<L[]> when one async validation is invalid", async () => {
    const inputPromise = Promise.resolve([
      valid<string, number>(1),
      invalid<string, number>(["err"]),
      valid<string, number>(2),
    ]);

    const result = await sequenceValidateAsync(inputPromise);

    expect(result.isInvalid()).toBe(true);
    expect(result.unwrapInvalid()).toEqual(["err"]);
  });

  it("harvests multiple errors from async input", async () => {
    const inputPromise = Promise.resolve([
      invalid<string, number>(["e1"]),
      invalid<string, number>(["e2"]),
      valid<string, number>(10),
      invalid<string, number>(["e3", "e4"]),
    ]);

    const result = await sequenceValidateAsync(inputPromise);

    expect(result.isInvalid()).toBe(true);
    expect(result.unwrapInvalid()).toEqual(["e1", "e2", "e3", "e4"]);
  });

  it("returns Valid<[]> for empty async array", async () => {
    const result = await sequenceValidateAsync<string, number>(
      Promise.resolve([])
    );

    expect(result.isValid()).toBe(true);
    expect(result.unwrap()).toEqual([]);
  });

  it("works with complex types", async () => {
    type Err = { code: number };
    type Data = { id: number };

    const inputPromise = Promise.resolve([
      valid<Err, Data>({ id: 1 }),
      valid<Err, Data>({ id: 2 }),
    ]);

    const result = await sequenceValidateAsync(inputPromise);

    expect(result.isValid()).toBe(true);
    expect(result.unwrap()).toEqual([{ id: 1 }, { id: 2 }]);
  });

});