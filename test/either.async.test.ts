import { describe, expect, it } from "vitest";
import { Either, EitherAsync, asTask } from "../src";
import { ErrorResult } from "./models/Error";
const { right, left } = Either;

describe("Either", () => {
  it("maps right correctly", async () => {
    expect(
      (
        await right<ErrorResult, number>(2).mapAsync((x) =>
          asTask(x * 2),
        )
      ).unwrapRight(),
    ).toEqual(4);
  });

  it("maps left correctly", async () => {
    expect(
      (
        await left<ErrorResult, number>(
          ErrorResult.with("code", "message"),
        ).mapAsync((x) => asTask(x * 2))
      ).isLeft(),
    ).toEqual(true);
  });

  it("binds right correctly", async () => {
    expect(
      (
        await right<ErrorResult, number>(2).bindAsync((x) =>
          asTask(right<ErrorResult, number>(x * 2)),
        )
      ).unwrapRight(),
    ).toEqual(4);
  });

  it("binds left correctly", async () => {
    expect(
      (
        await left<ErrorResult, number>(
          ErrorResult.with("code", "message"),
        ).bindAsync((x) => asTask(right<ErrorResult, number>(x * 2)))
      ).isLeft(),
    ).toEqual(true);
  });

  it("matches right correctly", async () => {
    expect(
      await right<ErrorResult, number>(2).matchAsync(
        (x) => asTask(x),
        () => asTask(4),
      ),
    ).toEqual(2);
  });

  it("matches left correctly", async () => {
    expect(
      await left<ErrorResult, number>(
        ErrorResult.with("code", "message"),
      ).matchAsync(
        (x) => asTask(x),
        () => asTask(4),
      ),
    ).toEqual(4);
  });

  it("maps right<ErrorResult, number> correctly into rightthing else", async () => {
    expect((await
      right<ErrorResult, number>(2)
        .mapAsync((x) => asTask(x.toString())))
        .unwrapRight(),
    ).toEqual("2");
  });

  it("maps left correctly", async () => {
    expect((await
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .mapAsync((x) => asTask(x.toString())))
        .isLeft(),
    ).toEqual(true);
  });

  it("mapLeft on left keep on left", async () => {
    expect(( await
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .mapLeftAsync((x) => asTask(2)))
        .isLeft(),
    ).toEqual(true);
  });

   it("mapLeft on right keep on right", async () => {
    expect((await
      right<ErrorResult, string>("Hello world")
        .mapLeftAsync((x) => asTask(2)))
        .isRight(),
    ).toEqual(true);
  });

  it("mapLeft on left correctly", async () => {
    expect(( await
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .mapLeftAsync((x) => asTask(2)))
        .unwrapLeft(),
    ).toEqual(2);
  });

  it("binds right correctly", async () => {
    expect((await
      right<ErrorResult, number>(2)
        .bindAsync((x) => asTask(right<ErrorResult, string>((x * 2).toString()))))
        .unwrapRight(),
    ).toEqual("4");
  });

  it("binds left correctly", async () => {
    expect((await
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .bindAsync((x) => asTask(right<ErrorResult, string>((x * 2).toString()))))
        .isLeft(),
    ).toEqual(true);
  });

  it("binds on left, keeps on left", async () => {
    expect((await
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .bindLeftAsync((x) => asTask(left<string, number>("2"))))
        .isLeft(),
    ).toEqual(true);
  });

  it("binds on right, keeps on right", async () => {
    expect((await
      right<ErrorResult, number>(4)
        .bindLeftAsync((x) => asTask(left<string, number>("2"))))
        .isRight(),
    ).toEqual(true);
  });

  it("binds on left correctly", async () => {
    expect(( await
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
      .bindLeftAsync((x) => asTask(left<string, number>("2"))))
      .unwrapLeft()
    ).toEqual("2");
  });

  it("matches right correctly", async () => {
    expect(await
      right<ErrorResult, number>(2).matchAsync(
        (x) => asTask(x.toString()),
        () => asTask("4"),
      ),
    ).toEqual("2");
  });

  it("matches left correctly", async () => {
    expect(await
      left<ErrorResult, number>(ErrorResult.with("code", "message")).matchAsync(
        (x) => asTask(x.toString()),
        () => asTask("4"),
      ),
    ).toEqual("4");
  });

  it("chains bindAsync on right without .then()", async () => {
    expect((await
      right<ErrorResult, number>(2)
        .bindAsync(x => asTask(right<ErrorResult, number>(x * 2)))
        .bindAsync(x => asTask(right<ErrorResult, string>(x.toString()))))
      .unwrapRight(),
    ).toEqual("4");
  });

  it("chains bindAsync short-circuits on left without .then()", async () => {
    expect((await
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .bindAsync(x => asTask(right<ErrorResult, number>(x * 2)))
        .bindAsync(x => asTask(right<ErrorResult, string>(x.toString()))))
      .isLeft(),
    ).toEqual(true);
  });

  it("chains three bindAsync calls without .then()", async () => {
    expect((await
      right<ErrorResult, number>(1)
        .bindAsync(x => asTask(right<ErrorResult, number>(x + 1)))
        .bindAsync(x => asTask(right<ErrorResult, number>(x * 3)))
        .bindAsync(x => asTask(right<ErrorResult, string>(x.toString()))))
      .unwrapRight(),
    ).toEqual("6");
  });

  it("bindAsync accepts a Promise overload on right", async () => {
    expect((await
      right<ErrorResult, number>(2)
        .bindAsync(asTask(right<ErrorResult, string>("hello"))))
      .unwrapRight(),
    ).toEqual("hello");
  });

  it("bindAsync accepts a Promise overload and short-circuits on left", async () => {
    expect((await
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .bindAsync(asTask(right<ErrorResult, string>("hello"))))
      .isLeft(),
    ).toEqual(true);
  });

  it("EitherAsync.bindAsync accepts a Promise overload on right", async () => {
    expect((await
      right<ErrorResult, number>(2)
        .bindAsync(x => asTask(right<ErrorResult, number>(x * 2)))
        .bindAsync(asTask(right<ErrorResult, string>("world"))))
      .unwrapRight(),
    ).toEqual("world");
  });

  it("EitherAsync.bindAsync accepts a Promise overload and short-circuits on left", async () => {
    expect((await
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .bindAsync(x => asTask(right<ErrorResult, number>(x * 2)))
        .bindAsync(asTask(right<ErrorResult, string>("world"))))
      .isLeft(),
    ).toEqual(true);
  });

  it("EitherAsync.right creates a right EitherAsync", async () => {
    expect((await EitherAsync.right<ErrorResult, number>(42)).unwrapRight()).toEqual(42);
  });

  it("EitherAsync.left creates a left EitherAsync", async () => {
    expect((await EitherAsync.left<ErrorResult, number>(ErrorResult.with("code", "message"))).isLeft()).toEqual(true);
  });

  it("Either.bindAsync accepts EitherAsync-returning fn on right", async () => {
    expect((await
      right<ErrorResult, number>(2)
        .bindAsync(x => EitherAsync.right<ErrorResult, number>(x * 3)))
      .unwrapRight(),
    ).toEqual(6);
  });

  it("Either.bindAsync accepts EitherAsync-returning fn and short-circuits on left", async () => {
    expect((await
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .bindAsync(x => EitherAsync.right<ErrorResult, number>(x * 3)))
      .isLeft(),
    ).toEqual(true);
  });

  it("EitherAsync.bindAsync accepts EitherAsync-returning fn on right", async () => {
    expect((await
      right<ErrorResult, number>(2)
        .bindAsync(x => asTask(right<ErrorResult, number>(x * 2)))
        .bindAsync(x => EitherAsync.right<ErrorResult, string>(x.toString())))
      .unwrapRight(),
    ).toEqual("4");
  });

  it("EitherAsync.bindAsync accepts EitherAsync-returning fn and short-circuits on left", async () => {
    expect((await
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .bindAsync(x => asTask(right<ErrorResult, number>(x * 2)))
        .bindAsync(x => EitherAsync.right<ErrorResult, string>(x.toString())))
      .isLeft(),
    ).toEqual(true);
  });

  it("Either.bindLeftAsync accepts EitherAsync-returning fn on left", async () => {
    expect((await
      left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .bindLeftAsync(_ => EitherAsync.right<string, number>(42)))
      .unwrapRight(),
    ).toEqual(42);
  });

  it("Either.bindLeftAsync accepts EitherAsync-returning fn and short-circuits on right", async () => {
    expect((await
      right<ErrorResult, number>(10)
        .bindLeftAsync(_ => EitherAsync.right<string, number>(42)))
      .unwrapRight(),
    ).toEqual(10);
  });

  it("chains EitherAsync constructors with bindAsync for fluent pipeline", async () => {
    expect((await
      EitherAsync.right<ErrorResult, number>(1)
        .bindAsync(x => EitherAsync.right<ErrorResult, number>(x + 1))
        .bindAsync(x => EitherAsync.right<ErrorResult, string>(x.toString())))
      .unwrapRight(),
    ).toEqual("2");
  });

  it("EitherAsync.mapAsync transforms right value", async () => {
    expect((await
      EitherAsync.right<ErrorResult, number>(2)
        .mapAsync(async x => x * 3))
      .unwrapRight(),
    ).toEqual(6);
  });

  it("EitherAsync.mapAsync short-circuits on left", async () => {
    expect((await
      EitherAsync.left<ErrorResult, number>(ErrorResult.with("code", "message"))
        .mapAsync(async x => x * 3))
      .isLeft(),
    ).toEqual(true);
  });

  it("EitherAsync.mapAsync chains with bindAsync", async () => {
    expect((await
      EitherAsync.right<ErrorResult, number>(2)
        .mapAsync(async x => x * 2)
        .bindAsync(x => EitherAsync.right<ErrorResult, string>(x.toString())))
      .unwrapRight(),
    ).toEqual("4");
  });

  it("EitherAsync.mapAsync does not unwrap when right — maps to plain value not Either", async () => {
    expect((await
      EitherAsync.right<ErrorResult, string>("hello")
        .mapAsync(async s => s.length))
      .unwrapRight(),
    ).toEqual(5);
  });
});
