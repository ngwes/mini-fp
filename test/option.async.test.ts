import { describe, expect, it, vi } from "vitest";
import { Option, OptionAsync } from "../src";
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

    it("matchAsync accepts sync and async handlers", async () => {
        expect(await Some(2).matchAsync(x => x * 2, async () => 0)).toEqual(4);
        expect(await none<number>().matchAsync(async x => x, () => 9)).toEqual(9);
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

describe("OptionAsync", () => {
    it("mapAsync result chains with bindAsync", async () => {
        expect((await Some(2).mapAsync(async x => x + 1).bindAsync(async x => Some(x * 10))).unwrap()).toEqual(30);
    });

    it("fromAsync returns a chainable OptionAsync", async () => {
        expect((await Option.fromAsync(Promise.resolve(3)).map(x => x + 1)).unwrap()).toEqual(4);
        expect((await Option.fromAsync(Promise.resolve(null))).isNone()).toEqual(true);
    });

    it("OptionAsync.some / none create resolved wrappers", async () => {
        expect((await OptionAsync.some(1)).unwrap()).toEqual(1);
        expect((await OptionAsync.none<number>()).isNone()).toEqual(true);
    });

    it("map transforms some and keeps none", async () => {
        expect((await OptionAsync.some(2).map(x => x * 2)).unwrap()).toEqual(4);
        expect((await OptionAsync.none<number>().map(x => x * 2)).isNone()).toEqual(true);
    });

    it("bind chains on some and keeps none", async () => {
        expect((await OptionAsync.some(2).bind(x => Some(x * 2))).unwrap()).toEqual(4);
        expect((await OptionAsync.none<number>().bind(x => Some(x * 2))).isNone()).toEqual(true);
    });

    it("filter keeps some only when the predicate holds", async () => {
        expect((await OptionAsync.some(4).filter(x => x > 2)).unwrap()).toEqual(4);
        expect((await OptionAsync.some(1).filter(x => x > 2)).isNone()).toEqual(true);
        expect((await OptionAsync.none<number>().filter(() => true)).isNone()).toEqual(true);
    });

    it("onSome runs the action only on some", async () => {
        const action = vi.fn();
        expect((await OptionAsync.some(3).onSome(action)).unwrap()).toEqual(3);
        expect(action).toHaveBeenCalledWith(3);

        const spy = vi.fn();
        expect((await OptionAsync.none<number>().onSome(spy)).isNone()).toEqual(true);
        expect(spy).not.toHaveBeenCalled();
    });

    it("onNone runs the action only on none", async () => {
        const action = vi.fn();
        expect((await OptionAsync.none<number>().onNone(action)).isNone()).toEqual(true);
        expect(action).toHaveBeenCalledTimes(1);

        const spy = vi.fn();
        expect((await OptionAsync.some(3).onNone(spy)).unwrap()).toEqual(3);
        expect(spy).not.toHaveBeenCalled();
    });

    it("mapNone replaces none with the produced value", async () => {
        expect((await OptionAsync.none<number>().mapNone(() => 7)).unwrap()).toEqual(7);
        expect((await OptionAsync.some(1).mapNone(() => 7)).unwrap()).toEqual(1);
    });

    it("mapNoneAsync replaces none with the awaited value", async () => {
        expect((await OptionAsync.none<number>().mapNoneAsync(async () => 7)).unwrap()).toEqual(7);
        const spy = vi.fn(async () => 7);
        expect((await OptionAsync.some(1).mapNoneAsync(spy)).unwrap()).toEqual(1);
        expect(spy).not.toHaveBeenCalled();
    });

    it("bindNone replaces none with the produced option", async () => {
        expect((await OptionAsync.none<number>().bindNone(() => Some(7))).unwrap()).toEqual(7);
        expect((await OptionAsync.some(1).bindNone(() => Some(7))).unwrap()).toEqual(1);
        expect((await OptionAsync.none<number>().bindNone(() => none<number>())).isNone()).toEqual(true);
    });

    it("bindNoneAsync replaces none with the awaited option", async () => {
        expect((await OptionAsync.none<number>().bindNoneAsync(async () => Some(7))).unwrap()).toEqual(7);
        const spy = vi.fn(async () => Some(7));
        expect((await OptionAsync.some(1).bindNoneAsync(spy)).unwrap()).toEqual(1);
        expect(spy).not.toHaveBeenCalled();
        expect((await OptionAsync.none<number>().bindNoneAsync(() => OptionAsync.none<number>())).isNone()).toEqual(true);
    });

    it("guardMap applies the first matching guard", async () => {
        expect((await OptionAsync.some(5).guardMap(_ => "default", [x => x > 3, () => "gt3"], [x => x > 1, () => "gt1"])).unwrap()).toEqual("gt3");
        expect((await OptionAsync.some(0).guardMap(_ => "default", [x => x > 3, () => "gt3"])).unwrap()).toEqual("default");
        const when = vi.fn((x: number) => x > 3);
        expect((await OptionAsync.none<number>().guardMap(_ => "default", [when, () => "gt3"])).isNone()).toEqual(true);
        expect(when).not.toHaveBeenCalled();
    });

    it("guardMapAsync applies the first matching async guard", async () => {
        expect((await OptionAsync.some(5).guardMapAsync(async _ => "default", [x => x > 3, async () => "gt3"])).unwrap()).toEqual("gt3");
        expect((await OptionAsync.some(0).guardMapAsync(async _ => "default", [x => x > 3, async () => "gt3"])).unwrap()).toEqual("default");
        const when = vi.fn((x: number) => x > 3);
        expect((await OptionAsync.none<number>().guardMapAsync(async _ => "default", [when, async () => "gt3"])).isNone()).toEqual(true);
        expect(when).not.toHaveBeenCalled();
    });

    it("guardBind applies the first matching guard", async () => {
        expect((await OptionAsync.some(5).guardBind(_ => Some("default"), [x => x > 3, () => Some("gt3")])).unwrap()).toEqual("gt3");
        expect((await OptionAsync.some(0).guardBind(_ => Some("default"), [x => x > 3, () => Some("gt3")])).unwrap()).toEqual("default");
        expect((await OptionAsync.none<number>().guardBind(_ => Some("default"), [x => x > 3, () => Some("gt3")])).isNone()).toEqual(true);
    });

    it("guardBindAsync applies the first matching async guard", async () => {
        expect((await OptionAsync.some(5).guardBindAsync(async _ => Some("default"), [x => x > 3, async () => Some("gt3")])).unwrap()).toEqual("gt3");
        expect((await OptionAsync.some(0).guardBindAsync(async _ => Some("default"), [x => x > 3, async () => Some("gt3")])).unwrap()).toEqual("default");
        expect((await OptionAsync.none<number>().guardBindAsync(async _ => Some("default"), [x => x > 3, async () => Some("gt3")])).isNone()).toEqual(true);
    });

    it("mapAsync and bindAsync chain on some", async () => {
        expect((await OptionAsync.some(2).mapAsync(async x => x * 2)).unwrap()).toEqual(4);
        expect((await OptionAsync.some(2).bindAsync(x => OptionAsync.some(x * 3))).unwrap()).toEqual(6);
    });

    it("Option async methods return a chainable OptionAsync", async () => {
        expect((await Some(5).guardMapAsync(async _ => 0, [x => x > 3, async x => x * 2]).map(x => x + 1)).unwrap()).toEqual(11);
        expect((await Some(5).guardBindAsync(async _ => none<number>(), [x => x > 3, async x => Some(x)]).map(x => x + 1)).unwrap()).toEqual(6);
        expect((await none<number>().mapNoneAsync(async () => 7).map(x => x + 1)).unwrap()).toEqual(8);
        expect((await none<number>().bindNoneAsync(async () => Some(7)).map(x => x + 1)).unwrap()).toEqual(8);
    });

    it("toEither on OptionAsync", async () => {
        expect((await OptionAsync.none<number>().toEither("e")).unwrapLeft()).toEqual("e");
        expect((await OptionAsync.some(1).toEither("e")).unwrapRight()).toEqual(1);
        const factory = vi.fn(() => "e");
        expect((await OptionAsync.some(1).toEither(factory)).unwrapRight()).toEqual(1);
        expect(factory).not.toHaveBeenCalled();
    });

    it("match / matchAsync / orElse / orElseAsync on OptionAsync resolve the plain value", async () => {
        expect(await OptionAsync.some(2).match(x => x * 2, () => 0)).toEqual(4);
        expect(await OptionAsync.none<number>().match(x => x * 2, () => 0)).toEqual(0);
        expect(await OptionAsync.some(2).matchAsync(async x => x * 2, () => 0)).toEqual(4);
        expect(await OptionAsync.none<number>().matchAsync(x => x * 2, async () => 9)).toEqual(9);
        expect(await OptionAsync.none<number>().orElse(5)).toEqual(5);
        expect(await OptionAsync.none<number>().orElse(() => 6)).toEqual(6);
        expect(await OptionAsync.some(1).orElse(5)).toEqual(1);
        expect(await OptionAsync.none<number>().orElseAsync(Promise.resolve(5))).toEqual(5);
        expect(await OptionAsync.none<number>().orElseAsync(async () => 6)).toEqual(6);
        const fallback = vi.fn(async () => 6);
        expect(await OptionAsync.some(1).orElseAsync(fallback)).toEqual(1);
        expect(fallback).not.toHaveBeenCalled();
    });

    it("stops calling async steps after none", async () => {
        const spy = vi.fn(async (x: number) => x + 1);
        const spy2 = vi.fn(async (x: number) => Some(x));
        expect((await OptionAsync.none<number>().mapAsync(spy).bindAsync(spy2)).isNone()).toEqual(true);
        expect(spy).not.toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
    });

    it("rejects when a callback throws", async () => {
        await expect(OptionAsync.some(1).map(() => { throw new Error("boom"); })).rejects.toThrow("boom");
    });
});