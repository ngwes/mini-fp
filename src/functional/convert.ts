import { Either } from "../either/Either.js";
import { EitherAsync } from "../either/EitherAsync.js";
import { Option, OptionAsync } from "../option/Option.js";

type OptionArgs<A, M> =
  | [noneWhen?: ((value: A) => boolean) | undefined]
  | [map: (value: A) => M, noneWhen: (value: A) => boolean];

type EitherArgs<A, M, L> =
  | [left: L | (() => L)]
  | [map: (value: A) => M, leftWhen: (value: A) => boolean, left: L | (() => L)];

const optionOf = <A>(value: A | null | undefined, noneWhen?: (value: A) => boolean): Option<A> =>
  noneWhen === undefined ? Option.from(value) : Option.from(value).filter(v => !noneWhen(v));

const convertOption = <A, M>(value: A | null | undefined, args: OptionArgs<A, M>): Option<A | M> =>
  args.length === 2 ? optionOf(value, args[1]).map(args[0]) : optionOf(value, args[0]);

const convertEither = <A, M, L>(value: A | null | undefined, args: EitherArgs<A, M, L>): Either<L, A | M> =>
  args.length === 3
    ? convertOption(value, [args[0], args[1]]).toEither(args[2])
    : Option.from(value).toEither(args[0]);

export function toOption<A>(value: A | null | undefined, noneWhen?: (value: A) => boolean): Option<A>;
export function toOption<A, M>(
  value: A | null | undefined,
  map: (value: A) => M,
  noneWhen: (value: A) => boolean,
): Option<M>;
export function toOption<A, M>(value: A | null | undefined, ...args: OptionArgs<A, M>): Option<A | M> {
  return convertOption(value, args);
}

export function toOptionAsync<A>(
  value: PromiseLike<A | null | undefined>,
  noneWhen?: (value: A) => boolean,
): OptionAsync<A>;
export function toOptionAsync<A, M>(
  value: PromiseLike<A | null | undefined>,
  map: (value: A) => M,
  noneWhen: (value: A) => boolean,
): OptionAsync<M>;
export function toOptionAsync<A, M>(
  value: PromiseLike<A | null | undefined>,
  ...args: OptionArgs<A, M>
): OptionAsync<A | M> {
  return OptionAsync.from(Promise.resolve(value).then(v => convertOption(v, args)));
}

export function toEither<L, R>(value: R | null | undefined, left: L | (() => L)): Either<L, R>;
export function toEither<A, M, L>(
  value: A | null | undefined,
  map: (value: A) => M,
  leftWhen: (value: A) => boolean,
  left: L | (() => L),
): Either<L, M>;
export function toEither<A, M, L>(value: A | null | undefined, ...args: EitherArgs<A, M, L>): Either<L, A | M> {
  return convertEither(value, args);
}

export function toEitherAsync<L, R>(
  value: PromiseLike<R | null | undefined>,
  left: L | (() => L),
): EitherAsync<L, R>;
export function toEitherAsync<A, M, L>(
  value: PromiseLike<A | null | undefined>,
  map: (value: A) => M,
  leftWhen: (value: A) => boolean,
  left: L | (() => L),
): EitherAsync<L, M>;
export function toEitherAsync<A, M, L>(
  value: PromiseLike<A | null | undefined>,
  ...args: EitherArgs<A, M, L>
): EitherAsync<L, A | M> {
  return EitherAsync.from(Promise.resolve(value).then(v => convertEither(v, args)));
}
