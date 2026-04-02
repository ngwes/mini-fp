import { describe, expect, it } from "vitest";
import { Validate, sequenceValidate } from "../src";

const{valid, invalid} = Validate;

describe("sequenceValidate", () => {

  it("returns Valid<R[]> when all validations are valid", () => {
    const input = [
      valid<string, number>(1),
      valid<string, number>(2),
      valid<string, number>(3),
    ];

    const result = sequenceValidate(input);

    expect(result.isValid()).toBe(true);
    expect(result.unwrap()).toEqual([1, 2, 3]);
  });

  it("returns Invalid<L[]> when there is one invalid element", () => {
    const input = [
      valid<string, number>(1),
      invalid<string, number>(["err"]),
      valid<string, number>(2),
    ];

    const result = sequenceValidate(input);

    expect(result.isInvalid()).toBe(true);
    expect(result.unwrapInvalid()).toEqual(["err"]);
  });

  it("accumulates multiple errors (harvesting)", () => {
    const input = [
      invalid<string, number>(["e1"]),
      valid<string, number>(5),
      invalid<string, number>(["e2", "e3"]),
    ];

    const result = sequenceValidate(input);

    expect(result.isInvalid()).toBe(true);
    expect(result.unwrapInvalid()).toEqual(["e1", "e2", "e3"]);
  });

  it("returns Valid<[]> when the input array is empty", () => {
    const result = sequenceValidate<string, number>([]);

    expect(result.isValid()).toBe(true);
    expect(result.unwrap()).toEqual([]);
  });

  it("works with complex types", () => {
    type Err = { code: number };
    type Data = { id: number };

    const input = [
      valid<Err, Data>({ id: 1 }),
      valid<Err, Data>({ id: 2 }),
    ];

    const result = sequenceValidate(input);

    expect(result.isValid()).toBe(true);
    expect(result.unwrap()).toEqual([{ id: 1 }, { id: 2 }]);
  });

});