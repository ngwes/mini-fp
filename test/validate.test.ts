import { describe, expect, it, vi } from "vitest";
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

  it("match with functions", () => {
    const onValid = (x: number) => `valid ${x}`;
    const onInvalid = (errors: string[]) => `invalid ${errors.join(",")}`;
    expect(valid<string, number>(1).match(onValid, onInvalid)).toBe("valid 1");
    expect(invalid<string, number>(["a", "b"]).match(onValid, onInvalid)).toBe(
      "invalid a,b",
    );
  });

  it("match with plain values", () => {
    expect(valid<string, number>(1).match("ok", "ko")).toBe("ok");
    expect(invalid<string, number>(["e"]).match("ok", "ko")).toBe("ko");
  });

  it("match does not call onInvalid on valid", () => {
    const onInvalid = vi.fn(() => "ko");
    expect(valid<string, number>(1).match((x) => `ok ${x}`, onInvalid)).toBe(
      "ok 1",
    );
    expect(onInvalid).not.toHaveBeenCalled();
  });

  it("match does not call onValid on invalid", () => {
    const onValid = vi.fn(() => "ok");
    expect(invalid<string, number>(["e"]).match(onValid, () => "ko")).toBe(
      "ko",
    );
    expect(onValid).not.toHaveBeenCalled();
  });

  it("matchAsync with a mix of sync/async handlers and promises", async () => {
    expect(
      await valid<string, number>(1).matchAsync(
        (x) => `ok ${x}`,
        async (errors) => errors.join(","),
      ),
    ).toBe("ok 1");
    expect(
      await invalid<string, number>(["a", "b"]).matchAsync(
        (x) => `ok ${x}`,
        async (errors) => errors.join(","),
      ),
    ).toBe("a,b");
    expect(
      await valid<string, number>(1).matchAsync(Promise.resolve("ok"), (errors) =>
        errors.join(","),
      ),
    ).toBe("ok");
    expect(
      await invalid<string, number>(["e"]).matchAsync(
        async (x) => `ok ${x}`,
        Promise.resolve("ko"),
      ),
    ).toBe("ko");
  });

  it("matchAsync does not call onInvalid on valid", async () => {
    const onInvalid = vi.fn(async () => "ko");
    expect(
      await valid<string, number>(1).matchAsync(async () => "ok", onInvalid),
    ).toBe("ok");
    expect(onInvalid).not.toHaveBeenCalled();
  });

  it("mapInvalid maps every error", () => {
    const v = invalid<string, number>(["a", "bb"]).mapInvalid((e) => e.length);
    expect(v.isInvalid()).toBe(true);
    expect(v.unwrapInvalid()).toEqual([1, 2]);
  });

  it("mapInvalid passes only the error to the callback", () => {
    const v = invalid<string, number>(["10", "7"]).mapInvalid(parseInt);
    expect(v.unwrapInvalid()).toEqual([10, 7]);
  });

  it("mapInvalid keeps valid", () => {
    const fn = vi.fn((e: string) => e.length);
    const v = valid<string, number>(5).mapInvalid(fn);
    expect(v.isValid()).toBe(true);
    expect(v.unwrap()).toBe(5);
    expect(fn).not.toHaveBeenCalled();
  });

  it("bindInvalid recovers", () => {
    const v = invalid<string, number>(["a", "b"]).bindInvalid((errors) =>
      valid<number, number>(errors.length),
    );
    expect(v.isValid()).toBe(true);
    expect(v.unwrap()).toBe(2);
  });

  it("bindInvalid can return new errors", () => {
    const v = invalid<string, number>(["a", "bb"]).bindInvalid((errors) =>
      invalid<number, number>(errors.map((e) => e.length)),
    );
    expect(v.unwrapInvalid()).toEqual([1, 2]);
  });

  it("bindInvalid keeps valid without calling fn", () => {
    const fn = vi.fn((errors: string[]) =>
      valid<number, number>(errors.length),
    );
    const v = valid<string, number>(5).bindInvalid(fn);
    expect(v.isValid()).toBe(true);
    expect(v.unwrap()).toBe(5);
    expect(fn).not.toHaveBeenCalled();
  });
});
