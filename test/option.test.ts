import { describe, expect, it, vi } from "vitest";
import { Option } from "../src";
const { some, none, from} = Option;

describe("Option", () => {
    it("Uses from to instantiate undefined correctly", () => {
        expect(from(undefined).isNone()).toEqual(true);
    });

    it("Uses from to instantiate a value correctly", () => {
        expect(from(2).unwrap()).toEqual(2);
    });

    it("Uses from to instantiate undefined correctly using noneWhen", () => {
        expect(from(undefined, _ => true).isNone()).toEqual(true);
    });

    it("Uses from to instantiate a value correctly using noneWhen", () => {
        expect(from(2, _ => _ > 2).unwrap()).toEqual(2);
    });

    it("Uses from to instantiate a value correctly using noneWhen", () => {
        expect(from(2, _ => _ === 2).isNone()).toEqual(true);
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

    it("filter keeps some when the predicate holds", () => {
        expect(some(4).filter(x => x > 2).unwrap()).toEqual(4);
        expect(some(1).filter(x => x > 2).isNone()).toEqual(true);
        expect(none<number>().filter(() => true).isNone()).toEqual(true);
    });

    it("onSome runs the action only on some and returns the same option", () => {
        const action = vi.fn();
        const option = some(3);
        expect(option.onSome(action)).toBe(option);
        expect(action).toHaveBeenCalledWith(3);

        const spy = vi.fn();
        const empty = none<number>();
        expect(empty.onSome(spy)).toBe(empty);
        expect(spy).not.toHaveBeenCalled();
    });

    it("onNone runs the action only on none", () => {
        const action = vi.fn();
        const empty = none<number>();
        expect(empty.onNone(action)).toBe(empty);
        expect(action).toHaveBeenCalledTimes(1);

        const spy = vi.fn();
        const option = some(3);
        expect(option.onNone(spy)).toBe(option);
        expect(spy).not.toHaveBeenCalled();
    });

    it("mapNone replaces none with the produced value", () => {
        expect(none<number>().mapNone(() => 7).unwrap()).toEqual(7);
        expect(some(1).mapNone(() => 7).unwrap()).toEqual(1);
    });

    it("bindNone replaces none with the produced option", () => {
        expect(none<number>().bindNone(() => some(7)).unwrap()).toEqual(7);
        const spy = vi.fn(() => some(7));
        expect(some(1).bindNone(spy).unwrap()).toEqual(1);
        expect(spy).not.toHaveBeenCalled();
    });

    it("toEither turns some into right and none into left", () => {
        expect(some(1).toEither("e").unwrapRight()).toEqual(1);
        expect(none<number>().toEither("e").unwrapLeft()).toEqual("e");
    });

    it("toEither calls the left factory only on none", () => {
        const factory = vi.fn(() => "e");
        expect(some(1).toEither(factory).unwrapRight()).toEqual(1);
        expect(factory).not.toHaveBeenCalled();
        expect(none<number>().toEither(() => "e").unwrapLeft()).toEqual("e");
    });

    it("guardMap applies the first matching guard", () => {
        expect(some(5).guardMap(_ => "default", [x => x > 3, () => "gt3"], [x => x > 1, () => "gt1"]).unwrap()).toEqual("gt3");
    });

    it("guardMap applies otherwise when no guard matches", () => {
        expect(some(0).guardMap(_ => "default", [x => x > 3, () => "gt3"], [x => x > 1, () => "gt1"]).unwrap()).toEqual("default");
    });

    it("guardMap does not evaluate guards on none", () => {
        const when = vi.fn((x: number) => x > 3);
        expect(none<number>().guardMap(_ => "default", [when, () => "gt3"]).isNone()).toEqual(true);
        expect(when).not.toHaveBeenCalled();
    });

    it("guardBind applies the first matching guard", () => {
        expect(some(5).guardBind(_ => some("default"), [x => x > 3, () => some("gt3")], [x => x > 1, () => some("gt1")]).unwrap()).toEqual("gt3");
        expect(some(0).guardBind(_ => some("default"), [x => x > 3, () => some("gt3")]).unwrap()).toEqual("default");
        expect(some(5).guardBind(_ => some("default"), [x => x > 3, () => none<string>()]).isNone()).toEqual(true);
    });
});