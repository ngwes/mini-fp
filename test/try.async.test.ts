import { describe, expect, it } from "vitest";
import { Either, EitherAsync, TryAsync, asTask } from "../src";

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
});
