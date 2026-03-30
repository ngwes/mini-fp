import { describe, expect, it } from "vitest";
import { Option } from "../src";
const { Some, None, FromAsync} = Option.Option;

describe("Option", () => {
    it("Uses From to instantiate undefined correctly", async () => {
        expect((await FromAsync(Promise.resolve(undefined))).isNone()).toEqual(true);
    });

    it("Uses From to instantiate a value correctly", async () => {
        expect((await FromAsync(Promise.resolve(2))).Unwrap()).toEqual(2);
    });

    it("mapsAsync Some correctly", async () => {
        expect((await Some<number>(2).mapAsync(async x => await Promise.resolve(x*2))).Unwrap()).toEqual(4);
    });

    it("mapsAsync None correctly", async () => {
        expect((await None<number>().mapAsync(async x => await Promise.resolve(x*2))).isNone()).toEqual(true);
    });

    it("binds Some correctly", async () => {
        expect((await Some<number>(2).bindAsync(x => FromAsync(Promise.resolve(x*2)))).Unwrap()).toEqual(4);
    });

    it("binds None correctly", async () => {
        expect((await None<number>().bindAsync(x => FromAsync(Promise.resolve(x*2)))).isNone()).toEqual(true);
    });

    it("matches Some correctly", async () => {
        expect((await Some<number>(2).matchAsync(x => Promise.resolve(x), () => Promise.resolve(4)))).toEqual(2);
    });

    it("matches None correctly", async () => {
        expect((await None<number>().matchAsync(x => Promise.resolve(x), () => Promise.resolve(4)))).toEqual(4);
    });

    it("Runs orElse Some correctly", async () => {
        expect((await Some<number>(2).orElseAsync(() => Promise.resolve(4)))).toEqual(2);
    });

    it("Runs orElse correctly", async () => {
        expect((await None<number>().orElseAsync(() => Promise.resolve(4)))).toEqual(4);
    });

    it("Runs orElse with a value Some correctly",async () => {
        expect((await Some<number>(2).orElseAsync(Promise.resolve(4)))).toEqual(2);
    });

    it("Runs orElse with a value correctly", async() => {
        expect((await None<number>().orElseAsync(Promise.resolve(4)))).toEqual(4);
    });
});