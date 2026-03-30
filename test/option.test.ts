import { describe, expect, it } from "vitest";
import { Option } from "../src";
const { Some, None, From} = Option.Option;

describe("Option", () => {
    it("Uses From to instantiate undefined correctly", () => {
        expect(From(undefined).isNone()).toEqual(true);
    });

    it("Uses From to instantiate a value correctly", () => {
        expect(From(2).Unwrap()).toEqual(2);
    });

    it("Unwraps correctly", () => {
        expect(Some<number>(2).Unwrap()).toEqual(2);
    });

    it("Uses IsSome correctly", () => {
        expect(Some<number>(2).isSome()).toEqual(true);
    });

    it("Uses IsNone correctly", () => {
        expect(None<number>().isNone()).toEqual(true);
    });

    it("maps Some correctly", () => {
        expect(Some<number>(2).map(x => x*2).Unwrap()).toEqual(4);
    });

    it("maps None correctly", () => {
        expect(None<number>().map(x => x*2).isNone()).toEqual(true);
    });

    it("binds Some correctly", () => {
        expect(Some<number>(2).bind(x => From(x*2)).Unwrap()).toEqual(4);
    });

    it("binds None correctly", () => {
        expect(None<number>().bind(x => From(x*2)).isNone()).toEqual(true);
    });

    it("matches Some correctly", () => {
        expect(Some<number>(2).match(x => x, () => 4)).toEqual(2);
    });

    it("matches None correctly", () => {
        expect(None<number>().match(x => x, () => 4)).toEqual(4);
    });

    it("Runs orElse Some correctly", () => {
        expect(Some<number>(2).orElse(() => 4)).toEqual(2);
    });

    it("Runs orElse correctly", () => {
        expect(None<number>().orElse(() => 4)).toEqual(4);
    });

    it("Runs orElse with a value Some correctly", () => {
        expect(Some<number>(2).orElse(4)).toEqual(2);
    });

    it("Runs orElse with a value correctly", () => {
        expect(None<number>().orElse(4)).toEqual(4);
    });
});