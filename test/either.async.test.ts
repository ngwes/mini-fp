import { describe, expect, it } from "vitest";
import { Either, asTask } from "../src";
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
});
