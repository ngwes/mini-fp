import { describe, expect, it, vi } from "vitest";
import { Either } from "../src";
import { ErrorResult } from "./models/Error";
const { right, left } = Either;

describe("Either", () => {
  it("Uses left to instantiate undefined correctly", () => {
    expect(() => left(undefined)).toThrow();
  });

  it("Uses right<ErrorResult, number> to instantiate value correctly", () => {
    expect(right<ErrorResult, number>(2).isRight()).toEqual(true);
  });

  it("Uses right<ErrorResult, number> to instantiate a value correctly", () => {
    expect(right<ErrorResult, number>(2).unwrapRight()).toEqual(2);
  });

  it("maps right<ErrorResult, number> correctly", () => {
    expect(
      right<ErrorResult, number>(2)
        .map((x) => x * 2)
        .unwrapRight(),
    ).toEqual(4);
  });

  it("maps left correctly", () => {
    expect(
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .map((x) => x * 2)
        .isLeft(),
    ).toEqual(true);
  });

  it("binds right correctly", () => {
    expect(
      right<ErrorResult, number>(2)
        .bind((x) => right<ErrorResult, number>(x * 2))
        .unwrapRight(),
    ).toEqual(4);
  });

  it("binds left correctly", () => {
    expect(
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .bind((x) => right<ErrorResult, number>(x * 2))
        .isLeft(),
    ).toEqual(true);
  });

  it("matches right correctly", () => {
    expect(
      right<ErrorResult, number>(2).match(
        (x) => x,
        () => 4,
      ),
    ).toEqual(2);
  });

  it("matches left correctly", () => {
    expect(
      left<ErrorResult, number>(ErrorResult.with("code", "message")).match(
        (x) => x,
        () => 4,
      ),
    ).toEqual(4);
  });

  it("maps right<ErrorResult, number> correctly into rightthing else", () => {
    expect(
      right<ErrorResult, number>(2)
        .map((x) => x.toString())
        .unwrapRight(),
    ).toEqual("2");
  });

  it("maps left correctly", () => {
    expect(
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .map((x) => x.toString())
        .isLeft(),
    ).toEqual(true);
  });

  it("mapLeft on left keep on left", () => {
    expect(
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .mapLeft((x) => 2)
        .isLeft(),
    ).toEqual(true);
  });

  it("mapLeft on left correctly", () => {
    expect(
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .mapLeft((x) => 2)
        .unwrapLeft(),
    ).toEqual(2);
  });

  it("mapLeft on right keep on right", () => {
    expect(
      right<ErrorResult, string>("Hello world")
        .mapLeft((x) => 2)
        .isRight(),
    ).toEqual(true);
  });

  it("binds right correctly", () => {
    expect(
      right<ErrorResult, number>(2)
        .bind((x) => right<ErrorResult, string>((x * 2).toString()))
        .unwrapRight(),
    ).toEqual("4");
  });

  it("binds left correctly", () => {
    expect(
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .bind((x) => right<ErrorResult, string>((x * 2).toString()))
        .isLeft(),
    ).toEqual(true);
  });

  it("binds on left, keeps on left", () => {
    expect(
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .bindLeft((x) => left<string, number>("2"))
        .isLeft(),
    ).toEqual(true);
  });

  it("binds on right, keeps on right", () => {
    expect(
      right<ErrorResult, number>(4)
        .bindLeft((x) => left<string, number>("2"))
        .isRight(),
    ).toEqual(true);
  });

  it("binds on left correctly", () => {
    expect(
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
      .bindLeft((x) => left<string, number>("2"))
      .unwrapLeft()
    ).toEqual("2");
  });

  it("matches right correctly", () => {
    expect(
      right<ErrorResult, number>(2).match(
        (x) => x.toString(),
        () => "4",
      ),
    ).toEqual("2");
  });

  it("matches left correctly", () => {
    expect(
      left<ErrorResult, number>(ErrorResult.with("code", "message")).match(
        (x) => x.toString(),
        () => "4",
      ),
    ).toEqual("4");
  });

  it("onRight runs only on right and returns the same either", () => {
    const action = vi.fn();
    const either = right<string, number>(3);
    expect(either.onRight(action)).toBe(either);
    expect(action).toHaveBeenCalledWith(3);

    const spy = vi.fn();
    const failed = left<string, number>("e");
    expect(failed.onRight(spy)).toBe(failed);
    expect(spy).not.toHaveBeenCalled();
  });

  it("onLeft runs only on left", () => {
    const action = vi.fn();
    const failed = left<string, number>("e");
    expect(failed.onLeft(action)).toBe(failed);
    expect(action).toHaveBeenCalledWith("e");

    const spy = vi.fn();
    const either = right<string, number>(3);
    expect(either.onLeft(spy)).toBe(either);
    expect(spy).not.toHaveBeenCalled();
  });

  it("guardMap applies the first matching guard", () => {
    expect(
      right<string, number>(5)
        .guardMap((_) => "default", [(x) => x > 3, () => "gt3"], [(x) => x > 1, () => "gt1"])
        .unwrapRight(),
    ).toEqual("gt3");
  });

  it("guardMap applies otherwise when no guard matches", () => {
    expect(
      right<string, number>(0)
        .guardMap((_) => "default", [(x) => x > 3, () => "gt3"], [(x) => x > 1, () => "gt1"])
        .unwrapRight(),
    ).toEqual("default");
  });

  it("guardMap keeps left and evaluates no guard", () => {
    const when = vi.fn((x: number) => x > 3);
    const otherwise = vi.fn((_: number) => "default");
    expect(
      left<string, number>("e").guardMap(otherwise, [when, () => "gt3"]).unwrapLeft(),
    ).toEqual("e");
    expect(when).not.toHaveBeenCalled();
    expect(otherwise).not.toHaveBeenCalled();
  });

  it("guardBind applies the first matching guard", () => {
    expect(
      right<string, number>(5)
        .guardBind((_) => right<string, string>("default"), [(x) => x > 3, () => left<string, string>("x")])
        .unwrapLeft(),
    ).toEqual("x");
    expect(
      right<string, number>(0)
        .guardBind((_) => right<string, string>("default"), [(x) => x > 3, () => left<string, string>("x")])
        .unwrapRight(),
    ).toEqual("default");
  });

  it("guardBind with onLeft maps the left side", () => {
    expect(
      left<string, number>("e")
        .guardBind(
          (l) => right<number, string>(String(l.length)),
          (r) => right(String(r)),
        )
        .unwrapRight(),
    ).toEqual("1");

    const onLeft = vi.fn((l: string) => right<number, string>(String(l.length)));
    expect(
      right<string, number>(5)
        .guardBind(
          onLeft,
          (r) => right<number, string>(String(r)),
          [(x) => x > 3, () => left<number, string>(9)],
        )
        .unwrapLeft(),
    ).toEqual(9);
    expect(onLeft).not.toHaveBeenCalled();
  });
});
