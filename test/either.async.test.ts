import { describe, expect, it, vi } from "vitest";
import { Either, EitherAsync, asTask } from "../src";
import type { Guard } from "../src";
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

  it("matchAsync accepts sync and async handlers", async () => {
    expect(await right<string, number>(2).matchAsync((x) => x * 2, async () => 0)).toEqual(4);
    expect(await left<string, number>("e").matchAsync(async (x) => x, () => 9)).toEqual(9);
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

  it("mapAsync result chains with bindAsync and match", async () => {
    expect(await right<string, number>(2).mapAsync(async x => x + 1).bind(x => right(x * 10)).match(x => x, () => -1)).toEqual(30);
  });

  it("mapAsync and mapLeftAsync return an EitherAsync", () => {
    expect(right<string, number>(2).mapAsync(async x => x)).toBeInstanceOf(EitherAsync);
    expect(left<string, number>("e").mapLeftAsync(async e => e)).toBeInstanceOf(EitherAsync);
  });

  it("mapLeftAsync returns a chainable EitherAsync", async () => {
    expect((await left<string, number>("err").mapLeftAsync(async e => e.length).mapLeft(n => n + 1)).unwrapLeft()).toEqual(4);
    expect((await right<string, number>(2).mapLeftAsync(async e => e.length).map(x => x + 1)).unwrapRight()).toEqual(3);
  });

  it("bindAsync accepts a function returning a plain Either inside a PromiseLike", async () => {
    expect((await right<string, number>(2).bindAsync(x => thenable(right<string, number>(x * 2)))).unwrapRight()).toEqual(4);
    expect((await EitherAsync.right<string, number>(2).bindAsync(x => thenable(right<string, number>(x * 3)))).unwrapRight()).toEqual(6);
    expect((await left<string, number>("e").bindLeftAsync(e => thenable(right<number, number>(e.length)))).unwrapRight()).toEqual(1);
    expect((await EitherAsync.left<string, number>("e").bindLeftAsync(e => thenable(left<number, number>(e.length)))).unwrapLeft()).toEqual(1);
  });

  it("bindAsync and bindLeftAsync accept a PromiseLike value", async () => {
    expect((await right<string, number>(2).bindAsync(thenable(right<string, string>("v")))).unwrapRight()).toEqual("v");
    expect((await left<string, number>("e").bindAsync(thenable(right<string, string>("v")))).unwrapLeft()).toEqual("e");
    expect((await EitherAsync.right<string, number>(2).bindAsync(thenable(right<string, string>("v")))).unwrapRight()).toEqual("v");
    expect((await left<string, number>("e").bindLeftAsync(thenable(left<number, number>(1)))).unwrapLeft()).toEqual(1);
    expect((await right<string, number>(2).bindLeftAsync(thenable(left<number, number>(1)))).unwrapRight()).toEqual(2);
    expect((await EitherAsync.left<string, number>("e").bindLeftAsync(thenable(left<number, number>(1)))).unwrapLeft()).toEqual(1);
  });

  it("EitherAsync.from accepts a PromiseLike", async () => {
    expect((await EitherAsync.from(thenable(right<string, number>(1)))).unwrapRight()).toEqual(1);
  });

  it("EitherAsync.map / mapLeft", async () => {
    expect((await EitherAsync.right<string, number>(2).map(x => x * 2)).unwrapRight()).toEqual(4);
    expect((await EitherAsync.left<string, number>("e").map(x => x * 2)).unwrapLeft()).toEqual("e");
    expect((await EitherAsync.left<string, number>("e").mapLeft(e => e.length)).unwrapLeft()).toEqual(1);
    expect((await EitherAsync.right<string, number>(2).mapLeft(e => e.length)).unwrapRight()).toEqual(2);
  });

  it("EitherAsync.bind / bindLeft", async () => {
    expect((await EitherAsync.right<string, number>(2).bind(x => right<string, string>(`${x}`))).unwrapRight()).toEqual("2");
    expect((await EitherAsync.left<string, number>("e").bind(x => right<string, string>(`${x}`))).unwrapLeft()).toEqual("e");
    expect((await EitherAsync.left<string, number>("e").bindLeft(e => right<number, number>(e.length))).unwrapRight()).toEqual(1);
    expect((await EitherAsync.right<string, number>(2).bindLeft(e => left<number, number>(e.length))).unwrapRight()).toEqual(2);
  });

  it("EitherAsync.mapLeftAsync / bindLeftAsync", async () => {
    expect((await EitherAsync.left<string, number>("ab").mapLeftAsync(async e => e.length)).unwrapLeft()).toEqual(2);
    expect((await EitherAsync.right<string, number>(2).mapLeftAsync(async e => e.length)).unwrapRight()).toEqual(2);
    expect((await EitherAsync.left<string, number>("ab").bindLeftAsync(async e => right<number, number>(e.length))).unwrapRight()).toEqual(2);
    expect((await EitherAsync.right<string, number>(2).bindLeftAsync(async e => left<number, number>(e.length))).unwrapRight()).toEqual(2);
  });

  it("EitherAsync.onRight / onLeft", async () => {
    const onRight = vi.fn((_: number) => {});
    const onLeft = vi.fn((_: string) => {});
    expect((await EitherAsync.right<string, number>(2).onRight(onRight).onLeft(onLeft)).unwrapRight()).toEqual(2);
    expect(onRight).toHaveBeenCalledWith(2);
    expect(onLeft).not.toHaveBeenCalled();
    expect((await EitherAsync.left<string, number>("e").onRight(onRight).onLeft(onLeft)).unwrapLeft()).toEqual("e");
    expect(onLeft).toHaveBeenCalledWith("e");
    expect(onRight).toHaveBeenCalledTimes(1);
  });

  it("EitherAsync.guardMap", async () => {
    expect((await EitherAsync.right<string, number>(5).guardMap(_ => "default", [x => x > 3, () => "gt3"])).unwrapRight()).toEqual("gt3");
    expect((await EitherAsync.right<string, number>(0).guardMap(_ => "default", [x => x > 3, () => "gt3"])).unwrapRight()).toEqual("default");
    expect((await EitherAsync.left<string, number>("e").guardMap(_ => "default", [x => x > 3, () => "gt3"])).unwrapLeft()).toEqual("e");
  });

  it("EitherAsync.guardBind", async () => {
    expect((await EitherAsync.right<string, number>(5).guardBind(_ => right<string, string>("default"), [x => x > 3, () => left<string, string>("gt3")])).unwrapLeft()).toEqual("gt3");
    expect((await EitherAsync.right<string, number>(0).guardBind(_ => right<string, string>("default"), [x => x > 3, () => left<string, string>("gt3")])).unwrapRight()).toEqual("default");
    expect((await EitherAsync.left<string, number>("e").guardBind(_ => right<string, string>("default"))).unwrapLeft()).toEqual("e");
  });

  it("EitherAsync.guardBind with onLeft", async () => {
    expect((await EitherAsync.left<string, number>("e").guardBind(l => right<number, string>(l), r => right<number, string>(`${r}`))).unwrapRight()).toEqual("e");
    expect((await EitherAsync.right<string, number>(5).guardBind(l => right<number, string>(l), r => right<number, string>(`${r}`), [x => x > 3, () => left<number, string>(9)])).unwrapLeft()).toEqual(9);
    expect((await EitherAsync.right<string, number>(0).guardBind(l => right<number, string>(l), r => right<number, string>(`${r}`), [x => x > 3, () => left<number, string>(9)])).unwrapRight()).toEqual("0");
  });

  it("guardMapAsync on Either and EitherAsync", async () => {
    const when = vi.fn((x: number) => x > 3);
    expect((await right<string, number>(5).guardMapAsync(async _ => "default", [when, async () => "gt3"])).unwrapRight()).toEqual("gt3");
    expect((await right<string, number>(0).guardMapAsync(async _ => "default", [when, async () => "gt3"])).unwrapRight()).toEqual("default");
    expect((await EitherAsync.right<string, number>(5).guardMapAsync(async _ => "default", [when, async () => "gt3"])).unwrapRight()).toEqual("gt3");
    when.mockClear();
    expect((await left<string, number>("e").guardMapAsync(async _ => "default", [when, async () => "gt3"])).unwrapLeft()).toEqual("e");
    expect((await EitherAsync.left<string, number>("e").guardMapAsync(async _ => "default", [when, async () => "gt3"])).unwrapLeft()).toEqual("e");
    expect(when).not.toHaveBeenCalled();
  });

  it("guardBindAsync on Either and EitherAsync", async () => {
    const otherwise = async (_: number) => right<string, string>("default");
    const gt3: Guard<number, Promise<Either<string, string>>> = [x => x > 3, async () => left<string, string>("gt3")];
    expect((await right<string, number>(5).guardBindAsync(otherwise, gt3)).unwrapLeft()).toEqual("gt3");
    expect((await right<string, number>(0).guardBindAsync(otherwise, gt3)).unwrapRight()).toEqual("default");
    expect((await left<string, number>("e").guardBindAsync(otherwise, gt3)).unwrapLeft()).toEqual("e");
    expect((await EitherAsync.right<string, number>(5).guardBindAsync(otherwise, gt3)).unwrapLeft()).toEqual("gt3");
    expect((await EitherAsync.right<string, number>(0).guardBindAsync(otherwise)).unwrapRight()).toEqual("default");
    expect((await EitherAsync.left<string, number>("e").guardBindAsync(otherwise, gt3)).unwrapLeft()).toEqual("e");
  });

  it("guardBindAsync with onLeft on Either and EitherAsync", async () => {
    const onLeft = async (l: string) => right<number, string>(l);
    const otherwise = async (r: number) => right<number, string>(`${r}`);
    const gt3: Guard<number, Promise<Either<number, string>>> = [x => x > 3, async () => left<number, string>(9)];
    expect((await left<string, number>("e").guardBindAsync(onLeft, otherwise, gt3)).unwrapRight()).toEqual("e");
    expect((await right<string, number>(5).guardBindAsync(onLeft, otherwise, gt3)).unwrapLeft()).toEqual(9);
    expect((await right<string, number>(0).guardBindAsync(onLeft, otherwise)).unwrapRight()).toEqual("0");
    expect((await EitherAsync.left<string, number>("e").guardBindAsync(onLeft, otherwise, gt3)).unwrapRight()).toEqual("e");
    expect((await EitherAsync.right<string, number>(5).guardBindAsync(onLeft, otherwise, gt3)).unwrapLeft()).toEqual(9);
    expect((await EitherAsync.right<string, number>(0).guardBindAsync(onLeft, otherwise, gt3)).unwrapRight()).toEqual("0");
  });

  it("EitherAsync.match / matchAsync resolve the plain value", async () => {
    expect(await EitherAsync.right<string, number>(2).match(x => x * 2, () => 0)).toEqual(4);
    expect(await EitherAsync.left<string, number>("e").match(x => x * 2, e => e.length)).toEqual(1);
    expect(await EitherAsync.right<string, number>(2).matchAsync(async x => x * 2, () => 0)).toEqual(4);
    expect(await EitherAsync.left<string, number>("e").matchAsync(x => x * 2, async () => 9)).toEqual(9);
  });

  it("stops calling async steps after left", async () => {
    const spy = vi.fn(async (x: number) => x + 1);
    const spy2 = vi.fn(async (x: number) => right<string, number>(x));
    const spy3 = vi.fn(async (x: number) => x);
    expect((await EitherAsync.left<string, number>("e").mapAsync(spy).bindAsync(spy2).guardMapAsync(spy3)).isLeft()).toEqual(true);
    expect((await left<string, number>("e").mapAsync(spy).bindAsync(spy2)).isLeft()).toEqual(true);
    expect(spy).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
    expect(spy3).not.toHaveBeenCalled();
  });

  it("rejects when a callback throws", async () => {
    await expect(EitherAsync.right<string, number>(1).map(() => { throw new Error("boom"); })).rejects.toThrow("boom");
    await expect(right<string, number>(1).mapAsync(async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    await expect(EitherAsync.right<string, number>(1).bindAsync(() => { throw new Error("boom"); })).rejects.toThrow("boom");
  });

  it("bindAsync rejects when the callback throws synchronously", async () => {
    const fn = (_: number): Promise<Either<string, number>> => { throw new Error("boom"); };
    await expect(right<string, number>(1).bindAsync(fn)).rejects.toThrow("boom");
  });

  it("bindLeftAsync rejects when the callback throws synchronously", async () => {
    const fn = (_: string): Promise<Either<string, number>> => { throw new Error("boom"); };
    await expect(left<string, number>("e").bindLeftAsync(fn)).rejects.toThrow("boom");
  });

  it("guardBindAsync rejects when a guard throws synchronously", async () => {
    const otherwise = async (x: number) => right<string, number>(x);
    const when = (_: number): boolean => { throw new Error("boom"); };
    await expect(right<string, number>(1).guardBindAsync(otherwise, [when, otherwise])).rejects.toThrow("boom");
  });
});

function thenable<T>(value: T): PromiseLike<T> {
  return { then: (onfulfilled, onrejected) => Promise.resolve(value).then(onfulfilled, onrejected) };
}
