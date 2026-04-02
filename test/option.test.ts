import { describe, expect, it } from "vitest";
import { Option } from "../src";
const { some, none, from} = Option;

describe("Option", () => {
    it("Uses from to instantiate undefined correctly", () => {
        expect(from(undefined).isNone()).toEqual(true);
    });

    it("Uses from to instantiate a value correctly", () => {
        expect(from(2).unwrap()).toEqual(2);
    });

    it("Unwraps correctly", () => {
        expect(some<number>(2).unwrap()).toEqual(2);
    });

    it("Uses IsSome correctly", () => {
        expect(some<number>(2).isSome()).toEqual(true);
    });

    it("Uses IsNone correctly", () => {
        expect(none<number>().isNone()).toEqual(true);
    });

    it("maps some correctly", () => {
        expect(some<number>(2).map(x => x*2).unwrap()).toEqual(4);
    });

    it("maps none correctly", () => {
        expect(none<number>().map(x => x*2).isNone()).toEqual(true);
    });

    it("binds some correctly", () => {
        expect(some<number>(2).bind(x => from(x*2)).unwrap()).toEqual(4);
    });

    it("binds none correctly", () => {
        expect(none<number>().bind(x => from(x*2)).isNone()).toEqual(true);
    });

    it("matches some correctly", () => {
        expect(some<number>(2).match(x => x, () => 4)).toEqual(2);
    });

    it("matches none correctly", () => {
        expect(none<number>().match(x => x, () => 4)).toEqual(4);
    });

    it("Runs orElse some correctly", () => {
        expect(some<number>(2).orElse(() => 4)).toEqual(2);
    });

    it("Runs orElse correctly", () => {
        expect(none<number>().orElse(() => 4)).toEqual(4);
    });

    it("Runs orElse with a value some correctly", () => {
        expect(some<number>(2).orElse(4)).toEqual(2);
    });

    it("Runs orElse with a value correctly", () => {
        expect(none<number>().orElse(4)).toEqual(4);
    });
});