import { describe, expect, it, vi } from "vitest";
import {
  apply,
  repeatWhile,
  repeatWhileAsync,
  tee,
  teeAsync,
  teeWhen,
  teeWhenAsync,
  toEither,
  toEitherAsync,
  toOption,
  toOptionAsync,
  using,
  usingAsync,
  which,
} from "../src";
import type { DisposableResource } from "../src";

describe("tee", () => {
  it("tee calls the action and returns the original value", () => {
    const action = vi.fn();

    expect(tee(5, action)).toBe(5);
    expect(action).toHaveBeenCalledWith(5);
  });

  it("teeWhen calls the action only when the predicate holds", () => {
    const action = vi.fn();

    expect(teeWhen(5, action, x => x > 3)).toBe(5);
    expect(teeWhen(1, action, x => x > 3)).toBe(1);
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith(5);
  });

  it("teeAsync waits for an async action before resolving", async () => {
    const order: string[] = [];
    const action = async (x: number) => {
      await Promise.resolve();
      order.push(`action ${x}`);
    };

    const result = await teeAsync(Promise.resolve(5), action);
    order.push("resolved");

    expect(result).toBe(5);
    expect(order).toEqual(["action 5", "resolved"]);
  });

  it("teeWhenAsync calls the action only when the predicate holds", async () => {
    const action = vi.fn(async () => {});

    expect(await teeWhenAsync(Promise.resolve(5), action, x => x > 3)).toBe(5);
    expect(await teeWhenAsync(Promise.resolve(1), action, x => x > 3)).toBe(1);
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith(5);
  });
});

describe("which", () => {
  it("calls onTrue or onFalse depending on the condition", () => {
    expect(which(() => true, () => "yes", () => "no")).toBe("yes");
    expect(which(() => false, () => "yes", () => "no")).toBe("no");
  });

  it("passes the value to the condition and to the chosen branch", () => {
    const onFalse = vi.fn((x: number) => `small ${x}`);

    expect(which(5, x => x > 3, x => `big ${x}`, onFalse)).toBe("big 5");
    expect(onFalse).not.toHaveBeenCalled();
    expect(which(1, x => x > 3, x => `big ${x}`, onFalse)).toBe("small 1");
  });
});

describe("repeatWhile", () => {
  it("steps the accumulator while the condition holds", () => {
    expect(repeatWhile(() => 1, x => x < 100, x => x * 2)).toBe(128);
  });

  it("returns the initial value when the condition is false from the start", () => {
    const step = vi.fn((x: number) => x + 1);

    expect(repeatWhile(() => 10, x => x < 5, step)).toBe(10);
    expect(step).not.toHaveBeenCalled();
  });

  it("repeatWhileAsync awaits an async init and step", async () => {
    const result = await repeatWhileAsync(
      async () => 1,
      x => x < 100,
      async x => x * 2,
    );

    expect(result).toBe(128);
  });
});

describe("using", () => {
  const resource = (name: string, log: string[]): DisposableResource & { name: string } => ({
    name,
    dispose: () => log.push(name),
  });

  it("disposes the resource after fn and returns its result", () => {
    const log: string[] = [];

    const result = using(resource("r", log), r => {
      log.push(`use ${r.name}`);
      return 42;
    });

    expect(result).toBe(42);
    expect(log).toEqual(["use r", "r"]);
  });

  it("disposes the resource when fn throws and rethrows", () => {
    const log: string[] = [];

    expect(() => using(resource("r", log), () => {
      throw new Error("boom");
    })).toThrow("boom");
    expect(log).toEqual(["r"]);
  });

  it("usingAsync disposes the resource after the async fn", async () => {
    const log: string[] = [];

    const result = await usingAsync(resource("r", log), async r => {
      await Promise.resolve();
      log.push(`use ${r.name}`);
      return 42;
    });

    expect(result).toBe(42);
    expect(log).toEqual(["use r", "r"]);
  });

  it("usingAsync disposes the resource when the async fn rejects", async () => {
    const log: string[] = [];

    await expect(usingAsync(resource("r", log), () => Promise.reject(new Error("boom"))))
      .rejects.toThrow("boom");
    expect(log).toEqual(["r"]);
  });

  it("usingAsync with two resources disposes the second, then the first", async () => {
    const log: string[] = [];

    const result = await usingAsync(
      resource("first", log),
      first => resource(`second of ${first.name}`, log),
      async (first, second) => `${first.name} + ${second.name}`,
    );

    expect(result).toBe("first + second of first");
    expect(log).toEqual(["second of first", "first"]);
  });

  it("usingAsync with two resources still disposes both when fn rejects", async () => {
    const log: string[] = [];

    await expect(usingAsync(
      resource("first", log),
      () => resource("second", log),
      () => Promise.reject(new Error("boom")),
    )).rejects.toThrow("boom");
    expect(log).toEqual(["second", "first"]);
  });
});

describe("apply", () => {
  it("fixes the first argument", () => {
    expect(apply((a: number, b: number) => a - b, 10)(3)).toBe(7);
  });

  it("keeps the remaining arguments", () => {
    const greet = apply((greeting: string, name: string, mark: string) => `${greeting} ${name}${mark}`, "Hi");

    expect(greet("Ann", "!")).toBe("Hi Ann!");
  });
});

describe("convert", () => {
  it("toOption returns none for null or undefined", () => {
    expect(toOption(null).isNone()).toBe(true);
    expect(toOption(undefined).isNone()).toBe(true);
    expect(toOption(5).unwrap()).toBe(5);
  });

  it("toOption returns none when noneWhen holds", () => {
    expect(toOption(5, x => x > 3).isNone()).toBe(true);
    expect(toOption(1, x => x > 3).unwrap()).toBe(1);
  });

  it("toOption with map applies noneWhen to the original value, then maps", () => {
    expect(toOption(" a ", s => s.trim(), s => s === "").unwrap()).toBe("a");
    expect(toOption("", s => s.trim(), s => s === "").isNone()).toBe(true);
    expect(toOption<string, string>(null, s => s.trim(), s => s === "").isNone()).toBe(true);
  });

  it("toEither returns left for null or undefined", () => {
    expect(toEither(null, "missing").unwrapLeft()).toBe("missing");
    expect(toEither(5, "missing").unwrapRight()).toBe(5);
  });

  it("toEither calls a left factory only when needed", () => {
    const left = vi.fn(() => "missing");

    expect(toEither(5, left).unwrapRight()).toBe(5);
    expect(left).not.toHaveBeenCalled();
    expect(toEither(undefined, left).unwrapLeft()).toBe("missing");
  });

  it("toEither with map returns left when leftWhen holds", () => {
    expect(toEither([1], a => a.length, a => a.length === 0, "empty").unwrapRight()).toBe(1);
    expect(toEither([], a => a.length, a => a.length === 0, "empty").unwrapLeft()).toBe("empty");
    expect(toEither<number[], number, string>(null, a => a.length, a => a.length === 0, "empty").unwrapLeft())
      .toBe("empty");
  });

  it("toOptionAsync resolves both overloads and is chainable", async () => {
    expect((await toOptionAsync(Promise.resolve(null))).isNone()).toBe(true);
    expect((await toOptionAsync(Promise.resolve(5), x => x > 3)).isNone()).toBe(true);
    expect((await toOptionAsync(Promise.resolve(2)).map(x => x + 1)).unwrap()).toBe(3);
    expect((await toOptionAsync(Promise.resolve(" a "), s => s.trim(), s => s === "")).unwrap()).toBe("a");
  });

  it("toEitherAsync resolves both overloads and is chainable", async () => {
    expect((await toEitherAsync(Promise.resolve(2), "e").map(x => x + 1)).unwrapRight()).toBe(3);
    expect((await toEitherAsync(Promise.resolve(null), "e")).unwrapLeft()).toBe("e");
    expect((await toEitherAsync(Promise.resolve([] as number[]), a => a.length, a => a.length === 0, "empty"))
      .unwrapLeft()).toBe("empty");
    expect((await toEitherAsync(Promise.resolve([1, 2]), a => a.length, a => a.length === 0, "empty"))
      .unwrapRight()).toBe(2);
  });
});
