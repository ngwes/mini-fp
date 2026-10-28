import { describe, expect, it, vi } from "vitest";
import { Try } from "../src";
const { run, runAsync} = Try;

const throwable = () : number => {throw new Error("2")};
const notThrowable = () : number => {return 1};
const notThrowableAsync = () : Promise<number> => {return Promise.resolve(1)};
const throwableAsync = () : Promise<number> => {throw new Error("2")};

describe("Try", () => {
    it("run catch errors", () => {
        expect(run(throwable).isFailure()).toEqual(true);
    });

    it("runAsync catch errors", async () => {
        expect((await runAsync(throwableAsync)).isFailure()).toEqual(true);
    });

    it("run return the value on not errors", () => {
        expect(run(notThrowable).isSuccess()).toEqual(true);
    });

    it("runAsync returns the value on not errors", async () => {
        expect((await runAsync(notThrowableAsync)).isSuccess()).toEqual(true);
    });

    it("onFail catch errors and return the handled errors", () => {
        expect(run(throwable).onFail(x => Number((x as Error).message))).toEqual(2);
    });

      it("onFailAsync catch errors and return the handled errors", async () => {
        expect((await run(throwable).onFailAsync(x => Promise.resolve(Number((x as Error).message))))).toEqual(2);
    });

    it("onFailAsync catch errors on async run", async () => {
        expect((await (await runAsync(throwableAsync)).onFailAsync(x => Promise.resolve(Number((x as Error).message))))).toEqual(2);
    });

    it("run return the value on not errors", () => {
        expect(run(notThrowable).onFail(x => Number((x as Error).message))).toEqual(1);
    });

    it("runAsync returns the value on not errors", async () => {
        expect((await runAsync(notThrowableAsync)).onFail(x => Number((x as Error).message))).toEqual(1);
    });

    it("onFailAsync accepts a PromiseLike handler on failure", async () => {
        const promiseLike: PromiseLike<number> = { then: (resolve) => Promise.resolve(99).then(resolve) };
        expect(await run(throwable).onFailAsync(() => promiseLike)).toEqual(99);
    });

    it("onFailAsync accepts a PromiseLike handler on success", async () => {
        const promiseLike: PromiseLike<number> = { then: (resolve) => Promise.resolve(99).then(resolve) };
        expect(await run(notThrowable).onFailAsync(() => promiseLike)).toEqual(1);
    });

    it("run does not execute the function until consumed", () => {
        const spy = vi.fn(() => 1);
        const t = run(spy);
        expect(spy).not.toHaveBeenCalled();
        t.isSuccess();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("without memo every consumption re-runs the function", () => {
        const spy = vi.fn(() => 1);
        const t = run(spy);
        t.isSuccess();
        t.onFail(0);
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it("memo runs a successful function once", () => {
        const spy = vi.fn(() => 1);
        const t = run(spy).memo();
        t.isSuccess();
        t.onFail(0);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("memo does not cache a failure", () => {
        let calls = 0;
        const t = run(() => {
            calls++;
            if (calls === 1) throw new Error("first");
            return 5;
        }).memo();
        expect(t.isFailure()).toEqual(true);
        expect(t.onFail(0)).toEqual(5);
    });

    it("map transforms a success and is memoized", () => {
        const spy = vi.fn(() => 2);
        const mapped = run(spy).map(x => x * 10);
        expect(spy).not.toHaveBeenCalled();
        expect(mapped.onFail(0)).toEqual(20);
        expect(mapped.isSuccess()).toEqual(true);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("map turns a throw inside fn into a failure", () => {
        const mapped = run(notThrowable).map((): number => { throw new Error("in map"); });
        expect(mapped.isFailure()).toEqual(true);
        expect(mapped.onFail(e => (e as Error).message.length)).toEqual(6);
    });

    it("bind chains tries and short-circuits on failure", () => {
        expect(run(notThrowable).bind(x => run(() => x + 1)).onFail(0)).toEqual(2);
        expect(run(notThrowable).bind(() => run(throwable)).isFailure()).toEqual(true);
        const spy = vi.fn((x: number) => run(() => x + 1));
        const bound = run(throwable).bind(spy);
        expect(bound.isFailure()).toEqual(true);
        expect(spy).not.toHaveBeenCalled();
    });

    it("match calls onSuccess or onFail", () => {
        expect(run(notThrowable).match(x => x + 1, () => 0)).toEqual(2);
        expect(run(throwable).match(x => x + 1, e => Number((e as Error).message))).toEqual(2);
    });

    it("match accepts a plain fail value", () => {
        expect(Try.run((): number => { throw 1; }).match(x => x, 0)).toEqual(0);
    });

    it("onFail accepts a value, a zero-arg factory and an error handler", () => {
        expect(run(throwable).onFail(7)).toEqual(7);
        expect(run(throwable).onFail(() => 8)).toEqual(8);
        expect(run(throwable).onFail(e => Number((e as Error).message))).toEqual(2);
    });

    it("onFail does not call the factory on success", () => {
        const factory = vi.fn(() => 0);
        expect(run(notThrowable).onFail(factory)).toEqual(1);
        expect(factory).not.toHaveBeenCalled();
    });

    it("toEither gives right on success and left with the thrown error on failure", () => {
        expect(run(notThrowable).toEither().unwrapRight()).toEqual(1);
        expect((Try.run((): number => { throw new Error("x"); }).toEither().unwrapLeft() as Error).message).toEqual("x");
    });

    it("toEither then mapLeft turns the error into a typed left", () => {
        expect(Try.run(() => JSON.parse("{")).toEither().mapLeft(e => (e as Error).name).unwrapLeft()).toEqual("SyntaxError");
    });

    it("bind is lazy and runs its source once across consumptions", () => {
        const spy = vi.fn(() => 1);
        const bound = run(spy).bind(x => run(() => x + 1));
        expect(spy).not.toHaveBeenCalled();
        expect(bound.onFail(0)).toEqual(2);
        expect(bound.isSuccess()).toEqual(true);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("map does not call fn when the source fails", () => {
        const fn = vi.fn((x: number) => x + 1);
        expect(run(throwable).map(fn).isFailure()).toEqual(true);
        expect(fn).not.toHaveBeenCalled();
    });

    it("toEither throws when the success value is null or undefined", () => {
        expect(() => Try.run(() => undefined).toEither()).toThrow();
        expect(() => Try.run(() => null).toEither()).toThrow();
    });

    it("toEither throws when the thrown value is null", () => {
        expect(() => Try.run(() => { throw null; }).toEither()).toThrow();
    });

    it("throwing null is a failure", () => {
        expect(Try.run(() => { throw null; }).isFailure()).toEqual(true);
        expect(Try.run(() => { throw undefined; }).isFailure()).toEqual(true);
    });
});