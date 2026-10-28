import { describe, expect, it, vi } from "vitest";
import { Union, Union3 } from "../src";

describe("Union", () => {
  it("fromT1 sets isT1", () => {
    const u = Union.fromT1<number, string>(1);
    expect(u.isT1()).toBe(true);
    expect(u.isT2()).toBe(false);
  });

  it("fromT2 sets isT2", () => {
    const u = Union.fromT2<number, string>("a");
    expect(u.isT2()).toBe(true);
    expect(u.isT1()).toBe(false);
  });

  it("match calls the handler for the stored case only", () => {
    const onT1 = vi.fn((n: number) => `n ${n}`);
    const onT2 = vi.fn((s: string) => `s ${s}`);

    expect(Union.fromT1<number, string>(1).match(onT1, onT2)).toBe("n 1");
    expect(onT2).not.toHaveBeenCalled();

    expect(Union.fromT2<number, string>("a").match(onT1, onT2)).toBe("s a");
    expect(onT1).toHaveBeenCalledTimes(1);
  });

  it("matchAsync resolves the handler result", async () => {
    expect(
      await Union.fromT1<number, string>(1).matchAsync(
        async (n) => n + 1,
        (s) => s.length,
      ),
    ).toBe(2);
    expect(
      await Union.fromT2<number, string>("abc").matchAsync(
        (n) => n + 1,
        async (s) => s.length,
      ),
    ).toBe(3);
  });

  it("fromT1(null) throws", () => {
    expect(() => Union.fromT1<number | null, string>(null)).toThrow("must contain a value");
  });

  it("fromT2(undefined) throws", () => {
    expect(() => Union.fromT2<number, string | undefined>(undefined)).toThrow("must contain a value");
  });
});

describe("Union3", () => {
  it("fromT1 sets isT1", () => {
    const u = Union3.fromT1<number, string, boolean>(1);
    expect(u.isT1()).toBe(true);
    expect(u.isT2()).toBe(false);
    expect(u.isT3()).toBe(false);
  });

  it("fromT2 sets isT2", () => {
    const u = Union3.fromT2<number, string, boolean>("a");
    expect(u.isT1()).toBe(false);
    expect(u.isT2()).toBe(true);
    expect(u.isT3()).toBe(false);
  });

  it("fromT3 sets isT3", () => {
    const u = Union3.fromT3<number, string, boolean>(false);
    expect(u.isT1()).toBe(false);
    expect(u.isT2()).toBe(false);
    expect(u.isT3()).toBe(true);
  });

  it("match calls the handler for the stored case only", () => {
    const onT1 = vi.fn((n: number) => `n ${n}`);
    const onT2 = vi.fn((s: string) => `s ${s}`);
    const onT3 = vi.fn((b: boolean) => `b ${b}`);

    expect(Union3.fromT3<number, string, boolean>(false).match(onT1, onT2, onT3)).toBe(
      "b false",
    );
    expect(onT1).not.toHaveBeenCalled();
    expect(onT2).not.toHaveBeenCalled();

    expect(Union3.fromT2<number, string, boolean>("a").match(onT1, onT2, onT3)).toBe(
      "s a",
    );
    expect(onT1).not.toHaveBeenCalled();
    expect(onT3).toHaveBeenCalledTimes(1);

    expect(Union3.fromT1<number, string, boolean>(1).match(onT1, onT2, onT3)).toBe(
      "n 1",
    );
    expect(onT2).toHaveBeenCalledTimes(1);
    expect(onT3).toHaveBeenCalledTimes(1);
  });

  it("matchAsync resolves the handler result", async () => {
    const onT1 = async (n: number) => n + 1;
    const onT2 = (s: string) => s.length;
    const onT3 = async (b: boolean) => (b ? 10 : 20);

    expect(await Union3.fromT1<number, string, boolean>(1).matchAsync(onT1, onT2, onT3)).toBe(2);
    expect(await Union3.fromT2<number, string, boolean>("abc").matchAsync(onT1, onT2, onT3)).toBe(
      3,
    );
    expect(await Union3.fromT3<number, string, boolean>(true).matchAsync(onT1, onT2, onT3)).toBe(
      10,
    );
  });

  it("fromT1(null) throws", () => {
    expect(() => Union3.fromT1<number | null, string, boolean>(null)).toThrow("must contain a value");
  });

  it("fromT2(null) and fromT3(undefined) throw", () => {
    expect(() => Union3.fromT2<number, string | null, boolean>(null)).toThrow("must contain a value");
    expect(() =>
      Union3.fromT3<number, string, boolean | undefined>(undefined),
    ).toThrow("must contain a value");
  });
});
