import { describe, expect, it, vi } from "vitest";
import { Either, EitherAsync, Try, TryAsync, asTask } from "../src";

const { runAsync } = TryAsync;

const success = (): Promise<number> => Promise.resolve(1);
const throwSync = (): Promise<number> => { throw new Error("sync error"); };
const rejectAsync = (): Promise<number> => Promise.reject(new Error("async error"));

describe("TryAsync", () => {
    it("runAsync is a success when no error is thrown", async () => {
        expect((await runAsync(success)).isSuccess()).toEqual(true);
    });

    it("runAsync is a failure when the function throws synchronously", async () => {
        expect((await runAsync(throwSync)).isFailure()).toEqual(true);
    });

    it("runAsync is a failure when the promise rejects", async () => {
        expect((await runAsync(rejectAsync)).isFailure()).toEqual(true);
    });

    it("onFail returns the value on success", async () => {
        expect(await runAsync(success).onFailAsync(() => Promise.resolve(0))).toEqual(1);
    });

    it("onFail calls the handler on synchronous throw", async () => {
        expect(await runAsync(throwSync).onFailAsync(err => Promise.resolve(Number((err as Error).message.length)))).toEqual(10);
    });

    it("onFail calls the handler on rejected promise", async () => {
        expect(await runAsync(rejectAsync).onFailAsync(err => Promise.resolve(Number((err as Error).message.length)))).toEqual(11);
    });

    it("onFailAsync accepts a PromiseLike handler on failure", async () => {
        const promiseLike: PromiseLike<number> = { then: (resolve) => Promise.resolve(99).then(resolve) };
        expect(await runAsync(throwSync).onFailAsync(() => promiseLike)).toEqual(99);
    });

    it("onFailAsync accepts a PromiseLike handler on success", async () => {
        const promiseLike: PromiseLike<number> = { then: (resolve) => Promise.resolve(99).then(resolve) };
        expect(await runAsync(success).onFailAsync(() => promiseLike)).toEqual(1);
    });

    it("onFailAsync returns EitherAsync on success when handler returns Either", async () => {
        const result = await runAsync(async () => Either.right<Error, number>(1))
            .onFailAsync(e => asTask(Either.left<Error, number>(e as Error)));
        expect(result.isRight()).toEqual(true);
        expect(result.unwrapRight()).toEqual(1);
    });

    it("onFailAsync returns EitherAsync from handler on failure when handler returns Either", async () => {
        const result = await runAsync<Either<Error, number>>(() => { throw new Error("fail"); })
            .onFailAsync(e => asTask(Either.left<Error, number>(e as Error)));
        expect(result.isLeft()).toEqual(true);
    });

    it("onFailAsync with Either handler chains mapAsync and bindAsync", async () => {
        const result = await runAsync(async () => Either.right<Error, number>(2))
            .onFailAsync(e => asTask(Either.left<Error, number>(e as Error)))
            .mapAsync(async x => x * 2)
            .bindAsync(x => EitherAsync.right<Error, string>(x.toString()));
        expect(result.unwrapRight()).toEqual("4");
    });

    it("onFailAsync with Either handler short-circuits mapAsync on left", async () => {
        const result = await runAsync<Either<Error, number>>(() => { throw new Error("fail"); })
            .onFailAsync(e => asTask(Either.left<Error, number>(e as Error)))
            .mapAsync(async x => x * 2)
            .bindAsync(x => EitherAsync.right<Error, string>(x.toString()));
        expect(result.isLeft()).toEqual(true);
    });

    it("onFailAsync with a plain handler is typed PromiseLike, matching what it returns", async () => {
        const result = runAsync(success).onFailAsync(() => Promise.resolve(0));
        // @ts-expect-error the returned EitherAsync has no catch
        expect(result.catch).toBeUndefined();
        expect(await result).toEqual(1);
    });

    it("runAsync does not run until consumed", async () => {
        const spy = vi.fn(success);
        const t = runAsync(spy);
        expect(spy).not.toHaveBeenCalled();
        expect((await t).isSuccess()).toEqual(true);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("without memo every consumption re-runs the function", async () => {
        const spy = vi.fn(success);
        const t = runAsync(spy);
        await t;
        await t.onFail(0);
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it("memo runs a success once", async () => {
        const spy = vi.fn(success);
        const t = runAsync(spy).memo();
        expect(spy).not.toHaveBeenCalled();
        await Promise.all([t, t.onFail(0)]);
        expect(await t.onFail(0)).toEqual(1);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("memo retries a failure", async () => {
        let calls = 0;
        const t = runAsync(async () => {
            calls++;
            if (calls === 1) throw new Error("first");
            return 5;
        }).memo();
        expect((await t).isFailure()).toEqual(true);
        expect(await t.onFail(0)).toEqual(5);
        expect(await t.onFail(0)).toEqual(5);
        expect(calls).toEqual(2);
    });

    it("bind chains and short-circuits", async () => {
        expect(await runAsync(success).bind(x => runAsync(async () => x + 1)).onFail(0)).toEqual(2);
        expect((await runAsync(success).bind(() => runAsync(rejectAsync))).isFailure()).toEqual(true);
        expect((await runAsync(success).bind((): TryAsync<number> => { throw new Error("in bind"); })).isFailure()).toEqual(true);
        const spy = vi.fn((x: number) => runAsync(async () => x + 1));
        expect((await runAsync(rejectAsync).bind(spy)).isFailure()).toEqual(true);
        expect(spy).not.toHaveBeenCalled();
    });

    it("bind result is memoized", async () => {
        const spy = vi.fn(success);
        const bound = runAsync(spy).bind(x => runAsync(async () => x + 1));
        expect(spy).not.toHaveBeenCalled();
        expect(await bound.onFail(0)).toEqual(2);
        expect((await bound).isSuccess()).toEqual(true);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("do runs the action on success only and keeps the value", async () => {
        const action = vi.fn((_: number) => {});
        const t = runAsync(success).do(action);
        expect(action).not.toHaveBeenCalled();
        expect(await t.onFail(0)).toEqual(1);
        expect(action).toHaveBeenCalledWith(1);
        const onFailure = vi.fn((_: number) => {});
        expect(await runAsync(rejectAsync).do(onFailure).onFail(0)).toEqual(0);
        expect(onFailure).not.toHaveBeenCalled();
    });

    it("do turns a throwing action into a failure", async () => {
        const t = runAsync(success).do(() => { throw new Error("in do"); });
        expect(await t.match(() => "", e => (e as Error).message)).toEqual("in do");
    });

    it("match with sync/async handlers and a plain fail value", async () => {
        expect(await runAsync(success).match(x => x + 1, () => 0)).toEqual(2);
        expect(await runAsync(success).match(async x => x + 1, async () => 0)).toEqual(2);
        expect(await runAsync(rejectAsync).match(x => x + 1, e => (e as Error).message.length)).toEqual(11);
        expect(await runAsync(rejectAsync).match(x => x + 1, async e => (e as Error).message.length)).toEqual(11);
        expect(await runAsync(throwSync).match(x => x + 1, 0)).toEqual(0);
        const factory = vi.fn(() => 0);
        expect(await runAsync(success).match(x => x, factory)).toEqual(1);
        expect(factory).not.toHaveBeenCalled();
    });

    it("onFail with a value, a factory, a sync handler and an async handler", async () => {
        expect(await runAsync(rejectAsync).onFail(7)).toEqual(7);
        expect(await runAsync(rejectAsync).onFail(() => 8)).toEqual(8);
        expect(await runAsync(rejectAsync).onFail(e => (e as Error).message.length)).toEqual(11);
        expect(await runAsync(rejectAsync).onFail(async e => (e as Error).message.length)).toEqual(11);
        const factory = vi.fn(() => 0);
        expect(await runAsync(success).onFail(factory)).toEqual(1);
        expect(factory).not.toHaveBeenCalled();
    });

    it("toEither gives a chainable EitherAsync", async () => {
        const either = runAsync(rejectAsync).toEither();
        expect(either).toBeInstanceOf(EitherAsync);
        expect(await either.mapLeft(e => (e as Error).message).match(() => "", m => m)).toEqual("async error");
        expect((await runAsync(success).toEither().map(x => x + 1)).unwrapRight()).toEqual(2);
    });

    it("toEither rejects when the success value is null", async () => {
        await expect(runAsync(async () => null).toEither()).rejects.toThrow();
    });

    it("Try.runAsync returns a TryAsync", async () => {
        const spy = vi.fn(success);
        const t = Try.runAsync(spy);
        expect(t).toBeInstanceOf(TryAsync);
        expect(spy).not.toHaveBeenCalled();
        const awaited = await t;
        expect(awaited).toBeInstanceOf(Try);
        expect(awaited.onFail(0)).toEqual(1);
    });
});
