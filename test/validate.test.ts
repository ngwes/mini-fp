import { describe, expect, it } from "vitest";
import { Validate } from "../src/";

const { valid, invalid } = Validate;

describe("Validate", () => {

  it("creates a valid instance with a non-null value", () => {
    const v = valid<string, number>(5);
    expect(v.isValid()).toBe(true);
    expect(v.isInvalid()).toBe(false);
    expect(v.unwrap()).toBe(5);
  });

  it("throws if creating valid with null", () => {
    expect(() => valid<string, number>(null)).toThrow(
      "value cannot be null",
    );
  });

  it("creates an invalid instance with non-null errors", () => {
    const v = invalid<string, number>(["bad"]);
    expect(v.isInvalid()).toBe(true);
    expect(v.isValid()).toBe(false);
    expect(v.unwrapInvalid()).toEqual(["bad"]);
  });

  it("throws if creating invalid with null", () => {
    expect(() => invalid<string, number>(null)).toThrow(
      "value cannot be null",
    );
  });

  it("unwrap throws on invalid", () => {
    const v = invalid<string, number>(["err"]);
    expect(() => v.unwrap()).toThrow("Instance is in the wrong state");
  });

  it("unwrapInvalid throws on valid", () => {
    const v = valid<string, number>(10);
    expect(() => v.unwrapInvalid()).toThrow("Instance is in the wrong state");
  });

  it("map transforms a valid value", () => {
    const v = valid<string, number>(5).map((x) => x * 2);
    expect(v.isValid()).toBe(true);
    expect(v.unwrap()).toBe(10);
  });

  it("map preserves invalid", () => {
    const v = invalid<string, number>(["oops"]).map((x) => x * 2);
    expect(v.isInvalid()).toBe(true);
    expect(v.unwrapInvalid()).toEqual(["oops"]);
  });

  it("bind chains correctly when valid", () => {
    const v = valid<string, number>(2).bind((x) =>
      valid<string, number>(x + 3),
    );
    expect(v.isValid()).toBe(true);
    expect(v.unwrap()).toBe(5);
  });

  it("bind preserves invalid state", () => {
    const v = invalid<string, number>(["e1"]).bind((x) =>
      valid<string, number>(x + 1),
    );
    expect(v.isInvalid()).toBe(true);
    expect(v.unwrapInvalid()).toEqual(["e1"]);
  });

  it("combine two valid values keeps the first value", () => {
    const a = valid<string, number>(1);
    const b = valid<string, number>(2);

    const r = a.combine(b);
    expect(r.isValid()).toBe(true);
    expect(r.unwrap()).toBe(1);
  });

  it("combine accumulates errors from both invalids", () => {
    const a = invalid<string, number>(["a1"]);
    const b = invalid<string, number>(["b1", "b2"]);

    const r = a.combine(b);
    expect(r.isInvalid()).toBe(true);
    expect(r.unwrapInvalid()).toEqual(["a1", "b1", "b2"]);
  });

  it("combine mixes valid + invalid (harvesting)", () => {
    const a = valid<string, number>(10);
    const b = invalid<string, number>(["err"]);

    const r = a.combine(b);
    expect(r.isInvalid()).toBe(true);
    expect(r.unwrapInvalid()).toEqual(["err"]);
  });

  it("combineAsync works correctly with valid values", async () => {
    const a = valid<string, number>(10);
    const bPromise = Promise.resolve(valid<string, number>(20));

    const r = await a.combineAsync(bPromise);
    expect(r.isValid()).toBe(true);
    expect(r.unwrap()).toBe(10);
  });

  it("combineAsync harvests async invalid", async () => {
    const a = invalid<string, number>(["syncErr"]);
    const bPromise = Promise.resolve(
      invalid<string, number>(["asyncErr"]),
    );

    const r = await a.combineAsync(bPromise);
    expect(r.isInvalid()).toBe(true);
    expect(r.unwrapInvalid()).toEqual(["syncErr", "asyncErr"]);
  });
});
