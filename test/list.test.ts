import { describe, expect, it } from "vitest";
import {
  Either,
  Option,
  Unit,
  filterLeft,
  filterRight,
  filterSome,
  foldAsync,
  mapLeft,
  mapRight,
  mapSome,
  toUnitAsync,
} from "../src";

const { some, none } = Option;
const { right, left } = Either;

const options = (): Option<number>[] => [some(1), none<number>(), some(3)];
const eithers = (): Either<string, number>[] => [right(1), left("a"), right(3), left("bc")];

describe("list helpers", () => {
  it("filterSome keeps only some values", () => {
    expect(filterSome(options())).toEqual([1, 3]);
    expect(filterSome(options(), x => x > 1)).toEqual([3]);
  });

  it("filterRight keeps only right values", () => {
    expect(filterRight(eithers())).toEqual([1, 3]);
    expect(filterRight(eithers(), x => x > 1)).toEqual([3]);
  });

  it("filterLeft keeps only left values", () => {
    expect(filterLeft(eithers())).toEqual(["a", "bc"]);
    expect(filterLeft(eithers(), e => e.length > 1)).toEqual(["bc"]);
  });

  it("mapSome maps only some values", () => {
    expect(mapSome(options(), x => x * 10)).toEqual([10, 30]);
  });

  it("mapRight maps only right values", () => {
    expect(mapRight(eithers(), x => x * 10)).toEqual([10, 30]);
  });

  it("mapLeft maps only left values", () => {
    expect(mapLeft(eithers(), e => e.length)).toEqual([1, 2]);
  });

  it("foldAsync folds sequentially", async () => {
    const order: number[] = [];
    const folder = async (acc: number, item: number): Promise<number> => {
      await new Promise(resolve => setTimeout(resolve, (4 - item) * 5));
      order.push(item);
      return acc + item;
    };

    const result = await foldAsync([1, 2, 3], Promise.resolve(0), folder);

    expect(result).toBe(6);
    expect(order).toEqual([1, 2, 3]);
  });

  it("foldAsync accepts a plain seed and a sync folder", async () => {
    expect(await foldAsync(["a", "b"], "", (acc, s) => acc + s)).toBe("ab");
  });
});

describe("toUnitAsync", () => {
  it("toUnitAsync resolves to Unit.default", async () => {
    expect(await toUnitAsync(Promise.resolve(42))).toBe(Unit.default);
  });
});
