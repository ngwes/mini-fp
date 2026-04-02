import { describe, expect, it } from "vitest";
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
});
