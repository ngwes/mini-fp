import { describe, expect, it } from "vitest";
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
});