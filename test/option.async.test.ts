import { describe, expect, it } from "vitest";
import { Option } from "../src";
const { some: Some, none, fromAsync} = Option;

describe("Option", () => {
    it("Uses from to instantiate undefined correctly", async () => {
        expect((await fromAsync(Promise.resolve(undefined))).isNone()).toEqual(true);
    });

    it("Uses from to instantiate a value correctly", async () => {
        expect((await fromAsync(Promise.resolve(2))).unwrap()).toEqual(2);
    });

    it("mapsAsync Some correctly", async () => {
        expect((await Some<number>(2).mapAsync(async x => await Promise.resolve(x*2))).unwrap()).toEqual(4);
    });

    it("mapsAsync none correctly", async () => {
        expect((await none<number>().mapAsync(async x => await Promise.resolve(x*2))).isNone()).toEqual(true);
    });

    it("binds Some correctly", async () => {
        expect((await Some<number>(2).bindAsync(x => fromAsync(Promise.resolve(x*2)))).unwrap()).toEqual(4);
    });

    it("binds none correctly", async () => {
        expect((await none<number>().bindAsync(x => fromAsync(Promise.resolve(x*2)))).isNone()).toEqual(true);
    });

    it("matches Some correctly", async () => {
        expect((await Some<number>(2).matchAsync(x => Promise.resolve(x), () => Promise.resolve(4)))).toEqual(2);
    });

    it("matches none correctly", async () => {
        expect((await none<number>().matchAsync(x => Promise.resolve(x), () => Promise.resolve(4)))).toEqual(4);
    });

    it("Runs orElse Some correctly", async () => {
        expect((await Some<number>(2).orElseAsync(() => Promise.resolve(4)))).toEqual(2);
    });

    it("Runs orElse correctly", async () => {
        expect((await none<number>().orElseAsync(() => Promise.resolve(4)))).toEqual(4);
    });

    it("Runs orElse with a value Some correctly",async () => {
        expect((await Some<number>(2).orElseAsync(Promise.resolve(4)))).toEqual(2);
    });

    it("Runs orElse with a value correctly", async() => {
        expect((await none<number>().orElseAsync(Promise.resolve(4)))).toEqual(4);
    });

    it("chains bindAsync on Some without .then()", async () => {
        expect((await
            Some<number>(2)
                .bindAsync(x => fromAsync(Promise.resolve(x * 2)))
                .bindAsync(x => fromAsync(Promise.resolve(x + 1))))
            .unwrap(),
        ).toEqual(5);
    });

    it("chains bindAsync short-circuits on None without .then()", async () => {
        expect((await
            none<number>()
                .bindAsync(x => fromAsync(Promise.resolve(x * 2)))
                .bindAsync(x => fromAsync(Promise.resolve(x + 1))))
            .isNone(),
        ).toEqual(true);
    });

    it("bindAsync accepts a Promise overload on Some", async () => {
        expect((await
            Some<number>(2)
                .bindAsync(fromAsync(Promise.resolve(42))))
            .unwrap(),
        ).toEqual(42);
    });

    it("bindAsync accepts a Promise overload and short-circuits on None", async () => {
        expect((await
            none<number>()
                .bindAsync(fromAsync(Promise.resolve(42))))
            .isNone(),
        ).toEqual(true);
    });

    it("OptionAsync.bindAsync accepts a Promise overload on Some", async () => {
        expect((await
            Some<number>(2)
                .bindAsync(x => fromAsync(Promise.resolve(x * 2)))
                .bindAsync(fromAsync(Promise.resolve(99))))
            .unwrap(),
        ).toEqual(99);
    });
});