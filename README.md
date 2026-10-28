# mini-fp

A minimal TypeScript functional programming library inspired by [language-ext](https://github.com/louthy/language-ext) for .NET. Provides monadic types to handle absence, errors, and async flows without null checks or exceptions.

**Zero production dependencies.**

<!-- docs-site:skip-start -->
**Documentation:** <https://ngwes.github.io/mini-fp/>
<!-- docs-site:skip-end -->

---

## Table of Contents

- [Installation](#installation)
- [Agent Skills](#agent-skills)
- [Quick Start](#quick-start)
- [Option\<T\>](#optiont)
- [Either\<L, R\>](#eitherl-r)
- [Try\<T\>](#tryt)
- [TryAsync\<T\>](#tryasynct)
- [Validate\<L, R\>](#validatel-r)
- [Unit](#unit)
- [Traversal Utilities](#traversal-utilities)
- [Real-World Recipes](#real-world-recipes)
- [API Reference](#api-reference)
  - [Option\<T\>](#optiont-1)
  - [OptionAsync\<T\>](#optionasync-t)
  - [Either\<L, R\>](#eitherl-r-1)
  - [EitherAsync\<L, R\>](#eitherasyncl-r)
  - [Try\<T\>](#tryt-1)
  - [TryAsync\<T\>](#tryasynct-1)
  - [Validate\<L, R\>](#validatel-r-1)

---

## Installation

```bash
npm i @ngwes/mini-fp
```

---

## Agent Skills

[`mini-fp-skills`](https://github.com/ngwes/mini-fp-skills) is a Claude Code plugin with skills that teach coding agents how to use this library: a router skill, a reference skill for each type (`Option`, `Either`, `Try`, `Validate`, utilities) and pattern skills for typed error handling, validation and async pipelines.

Install it from within Claude Code:

```text
/plugin marketplace add ngwes/mini-fp-skills
/plugin install mini-fp@mini-fp-skills
```

See the [mini-fp-skills README](https://github.com/ngwes/mini-fp-skills#readme) for the other install options and for how to point your agent at the skills.

---

## Quick Start

```typescript
import { Option, Either, Try, Validate, traverseOption } from '@ngwes/mini-fp';

const { some, none, from } = Option;
const { left, right } = Either;
const { run } = Try;
const { valid, invalid } = Validate;
```

Each type is a plain class with static constructors. You can call static methods directly (`Option.some(42)`) or destructure them for a terser style (`const { some } = Option`).

---

## Option\<T\>

`Option<T>` represents a value that may or may not be present. It is either `some(value)` (a value exists) or `none()` (nothing). Use it instead of returning `null` or `undefined`.

### Constructors

```typescript
import { Option } from '@ngwes/mini-fp';
const { some, none, from } = Option;

// some: wraps a non-null value (throws if null/undefined is passed)
const a = some(42);           // Option<number>

// none: represents the absence of a value
const b = none<number>();     // Option<number>

// from: safe constructor — converts null/undefined to none, anything else to some
const c = from(null);         // none
const d = from(undefined);    // none
const e = from("hello");      // some("hello")

// from with noneWhen: treats a value as none when the predicate returns true
const h = from(-1, n => n < 0);   // none
const i = from(5,  n => n < 0);   // some(5)

// fromAsync: awaits a Promise, then applies from; returns a chainable OptionAsync
const f = await Option.fromAsync(fetchUserOrNull(id)); // Option<User>
```

### Checking the state

```typescript
some(1).isSome();  // true
some(1).isNone();  // false
none().isSome();   // false
none().isNone();   // true
```

### Transforming: `map`

`map` applies a function to the inner value if present, leaving `none` untouched.

```typescript
some(5).map(x => x * 2);         // some(10)
none<number>().map(x => x * 2);  // none

// Chaining
some("  hello  ")
  .map(s => s.trim())
  .map(s => s.toUpperCase());    // some("HELLO")
```

### Chaining: `bind`

`bind` (also called `flatMap`) is for operations that themselves return an `Option`. It prevents nesting (`Option<Option<T>>`).

```typescript
const parsePositive = (n: number): Option<number> =>
  n > 0 ? some(n) : none();

some(5).bind(parsePositive);     // some(5)
some(-1).bind(parsePositive);    // none
none<number>().bind(parsePositive); // none

// Real example: safe dictionary lookup
const users = new Map([["alice", { age: 30 }]]);
const lookup = (name: string): Option<{ age: number }> => from(users.get(name));

from("alice")
  .bind(lookup)
  .map(u => u.age);  // some(30)

from("bob")
  .bind(lookup)
  .map(u => u.age);  // none
```

### Pattern matching: `match`

`match` forces you to handle both cases explicitly, eliminating the need for null checks.

```typescript
const greeting = some("Alice").match(
  name => `Hello, ${name}!`,
  ()   => "Hello, stranger!"
);
// "Hello, Alice!"

const fallback = none<string>().match(
  name => `Hello, ${name}!`,
  ()   => "Hello, stranger!"
);
// "Hello, stranger!"
```

### Fallback values: `orElse`

```typescript
// With a plain value
some(1).orElse(99);        // 1
none<number>().orElse(99); // 99

// With a factory function (lazy — only called when none)
none<string>().orElse(() => computeExpensiveDefault()); // result of factory

// Common pattern: provide a default user
const user = from(sessionUser).orElse(guestUser);
```

### Filtering: `filter`

`filter` keeps `some` only when the predicate holds; otherwise it returns `none`.

```typescript
some(4).filter(x => x > 2);         // some(4)
some(1).filter(x => x > 2);         // none
none<number>().filter(() => true);  // none
```

### Side effects: `onSome` and `onNone`

`onSome` and `onNone` run an action on one branch and return the same option, so the chain continues unchanged.

```typescript
from(user)
  .onSome(u => logger.info(`found ${u.name}`))
  .onNone(() => logger.warn("user not found"))
  .map(u => u.email);
```

### Recovering from `none`: `mapNone` and `bindNone`

`mapNone` replaces `none` with a produced value (wrapped with `Option.from`, so a `null`/`undefined` result stays `none`). `bindNone` replaces `none` with a produced `Option`. Both leave `some` untouched and never call the function on `some`.

```typescript
none<number>().mapNone(() => 7);              // some(7)
some(1).mapNone(() => 7);                     // some(1)

from(cache.get(key)).bindNone(() => from(db.get(key))); // cache first, then the database
```

### Converting to Either: `toEither`

`toEither` turns `some` into `right` and `none` into `left`. The left value can be a plain value or a factory, which is called only on `none`.

```typescript
some(1).toEither("missing");                           // right(1)
none<number>().toEither("missing");                    // left("missing")
from(user).toEither(() => new NotFoundError(userId));  // factory runs only on none
```

### Guards: `guardMap` and `guardBind`

A `Guard<T, U>` is a `[when, then]` pair. `guardMap` applies the `then` of the first guard whose `when` holds, or `otherwise` when no guard matches. `guardBind` does the same with functions that return an `Option`. On `none`, no guard is evaluated.

```typescript
import type { Guard } from '@ngwes/mini-fp';

const large: Guard<number, string> = [x => x > 3, () => "large"];

some(5).guardMap(
  x => "small",
  large,
  [x => x > 1, () => "medium"],
);                                   // some("large")

some(0).guardMap(x => "small", [x => x > 3, () => "large"]); // some("small")

some(5).guardBind(
  x => some("small"),
  [x => x > 3, () => none<string>()],
);                                   // none
```

### Unwrapping

Only unwrap when you have already confirmed the option is `some`:

```typescript
const opt = from(maybeValue);

if (opt.isSome()) {
  console.log(opt.unwrap()); // safe
}

// Unsafe — throws if none:
some(42).unwrap();   // 42
none().unwrap();     // throws Error
```

### Async API

`fromAsync`, `mapAsync`, `bindAsync`, `mapNoneAsync`, `bindNoneAsync`, `guardMapAsync` and `guardBindAsync` return an `OptionAsync<T>`. It wraps a `Promise<Option<T>>`, has the same methods as `Option` (`map`, `bind`, `filter`, `onSome`, `toEither`, ...) and can be awaited to get the `Option` back, so a pipeline mixes sync and async steps without any `.then()`. On `none`, the later steps are skipped; if a callback throws, the awaited result rejects.

```typescript
import { Option, OptionAsync } from '@ngwes/mini-fp';

// fromAsync: wraps a nullable Promise
const user = await Option.fromAsync(db.findUser(id)); // Option<User>

// mapAsync
const upper = await from("hello").mapAsync(async s => s.toUpperCase());
// some("HELLO")

// bindAsync: the function may return a Promise<Option<U>> or an OptionAsync<U>
const profile = await from(userId).bindAsync(async id => {
  const row = await db.query("SELECT * FROM profiles WHERE id = ?", [id]);
  return from(row ?? null); // none if not found
});

// Chain sync and async steps directly — no .then() unwrapping needed
const email = await Option.fromAsync(db.findUser(id))
  .filter(u => u.active)
  .bindAsync(u => Option.fromAsync(db.findProfile(u.id)))
  .map(p => p.email)
  .orElse("unknown"); // Promise<string>

// bindAsync also accepts a Promise<Option<U>> directly
const fromPromise = await from(value).bindAsync(fetchOptionFromSomewhere());

// mapNoneAsync / bindNoneAsync: recover from none asynchronously
const cached = await from(cache.get(key)).bindNoneAsync(() => Option.fromAsync(db.get(key)));

// OptionAsync.some / OptionAsync.none: already-resolved wrappers
const start = OptionAsync.some(42);

// matchAsync — each handler may be sync or async
const response = await from(user).matchAsync(
  async u  => ({ status: 200, body: u }),
  async () => ({ status: 404, body: "Not found" })
);

// orElseAsync
const config = await from(process.env.API_URL).orElseAsync(async () => {
  const val = await remoteConfigService.get("API_URL");
  return val;
});
```

On an `OptionAsync`, `match`, `matchAsync`, `orElse` and `orElseAsync` return a `Promise` of the plain value, and `toEither` returns an `EitherAsync`.

### Worked example: safe navigation through nested objects

```typescript
type Address = { city: string; zip: string };
type User    = { name: string; address: Address | null };

const getCity = (userId: string): Option<string> => {
  const user: User | null = userRepository.findById(userId);

  return from(user)
    .bind(u  => from(u.address))
    .map(a   => a.city);
};

getCity("u1").orElse("Unknown city");
```

---

## Either\<L, R\>

`Either<L, R>` represents a computation that can succeed with a `right` value or fail with a `left` value. By convention, `Left` carries the error and `Right` carries the success. Use it when you need to propagate structured error information alongside success values.

### Constructors

```typescript
import { Either } from '@ngwes/mini-fp';
const { left, right } = Either;

const ok  = right<string, number>(42);          // Either<string, number>
const err = left<string, number>("not found");   // Either<string, number>
```

### Checking the state

```typescript
right(1).isRight(); // true
right(1).isLeft();  // false
left("e").isLeft(); // true
```

### Transforming: `map` and `mapLeft`

```typescript
// map transforms the right (success) side
right<string, number>(10).map(n => n * 2);  // right(20)
left<string, number>("err").map(n => n * 2); // left("err") — untouched

// mapLeft transforms the left (error) side
left<string, number>("not_found").mapLeft(code => ({ code, label: "Not Found" }));
// left({ code: "not_found", label: "Not Found" })
```

### Chaining: `bind` and `bindLeft`

```typescript
const parseAge = (s: string): Either<string, number> => {
  const n = parseInt(s, 10);
  return isNaN(n) ? left("invalid number") : right(n);
};

const validateAge = (n: number): Either<string, number> =>
  n >= 0 && n <= 150 ? right(n) : left("age out of range");

// Pipeline — each step only runs if the previous succeeded
right<string, string>("25")
  .bind(parseAge)
  .bind(validateAge);  // right(25)

right<string, string>("abc")
  .bind(parseAge)
  .bind(validateAge);  // left("invalid number")

right<string, string>("200")
  .bind(parseAge)
  .bind(validateAge);  // left("age out of range")
```

### Pattern matching: `match`

```typescript
const message = right<string, number>(42).match(
  value => `Success: ${value}`,
  error => `Error: ${error}`
);
// "Success: 42"

const httpStatus = left<string, number>("unauthorized").match(
  _     => 200,
  code  => code === "unauthorized" ? 401 : 400
);
// 401
```

### Side effects: `onRight` and `onLeft`

`onRight` and `onLeft` run an action on one side and return the same either, so the chain continues unchanged.

```typescript
parseAge(input)
  .onRight(age => logger.info(`parsed ${age}`))
  .onLeft(error => logger.warn(error))
  .map(age => age + 1);
```

### Guards: `guardMap` and `guardBind`

A `Guard<R, U>` is a `[when, then]` pair. `guardMap` applies the `then` of the first guard whose `when` holds, or `otherwise` when no guard matches. `guardBind` does the same with functions that return an `Either`. On `left`, no guard is evaluated and the left value is kept.

```typescript
right<string, number>(5).guardMap(
  x => "small",
  [x => x > 3, () => "large"],
  [x => x > 1, () => "medium"],
);                                   // right("large")

right<string, number>(5).guardBind(
  x => right<string, string>("ok"),
  [x => x > 3, () => left<string, string>("too large")],
);                                   // left("too large")
```

`guardBind` also accepts an `onLeft` function as its first argument. It handles the left side, so both sides can move to a new `Either<A, B>`:

```typescript
left<string, number>("e").guardBind(
  error => right<number, string>(`recovered from ${error}`),
  value => right<number, string>(String(value)),
  [x => x < 0, () => left<number, string>(-1)],
);                                   // right("recovered from e")
```

### Unwrapping

```typescript
right(5).unwrapRight(); // 5
left("oops").unwrapLeft(); // "oops"

right(5).unwrapLeft();  // throws
left("oops").unwrapRight(); // throws
```

### Async API

`mapAsync`, `mapLeftAsync`, `bindAsync`, `bindLeftAsync`, `guardMapAsync` and `guardBindAsync` return an `EitherAsync<L, R>`. It wraps a `Promise<Either<L, R>>`, has the same methods as `Either` (`map`, `bind`, `mapLeft`, `onRight`, `guardMap`, ...) and can be awaited to get the `Either` back, so a pipeline mixes sync and async steps without any `.then()`. On `left`, the later right-side steps are skipped; if a callback throws, the awaited result rejects.

```typescript
import { Either, EitherAsync } from '@ngwes/mini-fp';

// mapAsync / mapLeftAsync
const upper = await right<string, string>("hello")
  .mapAsync(async s => s.toUpperCase()); // right("HELLO")

// bindAsync: the function may return a Promise<Either<L, U>> or an EitherAsync<L, U>
const user = await right<ApiError, string>("user-123")
  .bindAsync(async id => {
    const row = await db.users.findById(id);
    return row ? right(row) : left({ code: "NOT_FOUND", message: "User not found" });
  });

// Chain sync and async steps directly — no .then() unwrapping needed
const result = await right<ApiError, string>("user-123")
  .bindAsync(id => fetchUser(id))
  .bind(requireAdmin)
  .onLeft(error => logger.warn(error.message))
  .bindAsync(user => fetchPermissions(user));

// bindLeftAsync — chains on the left (error) side
const recovered = await left<string, number>("not_found")
  .bindLeftAsync(code => EitherAsync.from(fallbackLookup(code)));

// bindAsync / bindLeftAsync also accept a Promise<Either<L, U>> directly
const fromPromise = await right<string, string>(id).bindAsync(fetchEitherFromSomewhere());

// guardMapAsync / guardBindAsync: async guards; guardBindAsync also accepts an onLeft first
const plan = await right<string, number>(seats).guardMapAsync(
  async n => pricing.standard(n),
  [n => n > 100, async n => pricing.enterprise(n)],
);

// EitherAsync.right / EitherAsync.left — create an already-resolved EitherAsync directly
const asyncRight = EitherAsync.right<string, number>(42);   // EitherAsync<string, number>
const asyncLeft  = EitherAsync.left<string, number>("err"); // EitherAsync<string, number>

// matchAsync — handlers may be sync or async
const response = await result.matchAsync(
  async value => ({ status: 200, data: value }),
  error => ({ status: 500, data: error })
);
```

On an `EitherAsync`, `match` and `matchAsync` return a `Promise` of the plain value.

### Worked example: HTTP request handler pipeline

```typescript
type ApiError = { code: string; message: string };
type User     = { id: string; email: string; role: string };

const authenticate = (token: string): Either<ApiError, string> =>
  token === "valid"
    ? right("user-123")
    : left({ code: "UNAUTHORIZED", message: "Invalid token" });

const fetchUser = async (id: string): Promise<Either<ApiError, User>> => {
  const user = await db.users.findById(id);
  return user
    ? right(user)
    : left({ code: "NOT_FOUND", message: "User not found" });
};

const requireAdmin = (user: User): Either<ApiError, User> =>
  user.role === "admin"
    ? right(user)
    : left({ code: "FORBIDDEN", message: "Admin access required" });

// Compose the pipeline
const handleRequest = async (token: string): Promise<Either<ApiError, User>> =>
  authenticate(token)
    .bindAsync(id   => fetchUser(id))
    .bindAsync(user => Promise.resolve(requireAdmin(user)));

const result = await handleRequest("valid");

result.match(
  admin => console.log(`Welcome, admin ${admin.email}`),
  err   => console.error(`${err.code}: ${err.message}`)
);
```

---

## Try\<T\>

`Try<T>` wraps a computation that might throw an exception. It captures the exception instead of letting it propagate, giving you a controlled way to handle failures — especially when calling third-party code you don't control.

**`Try` is lazy.** `Try.run(fn)` does not call `fn`. Nothing runs until the `Try` is consumed by `match`, `onFail`, `onFailAsync`, `toEither`, `isSuccess` or `isFailure`, and each consumption runs the function again. Call `memo()` when it should run only once.

Any thrown value is a failure, including `throw null` and `throw undefined`.

### Constructors

```typescript
import { Try } from '@ngwes/mini-fp';
const { run, runAsync } = Try;

// run: wraps a synchronous function; nothing runs yet
const result = Try.run(() => JSON.parse(rawInput));

// runAsync: wraps an async function, catches any throw or rejection
// returns TryAsync<T> for fluent error handling
const asyncResult = await Try.runAsync(() => fetch(url).then(r => r.json()));
```

### Checking the state

```typescript
Try.run(() => 42).isSuccess();                    // true
Try.run(() => { throw new Error() }).isFailure(); // true
Try.run(() => { throw null }).isFailure();        // true
```

Both run the function.

### Running once: `memo`

Without `memo`, every consumption calls the function again. `memo()` returns a `Try` that keeps the first **successful** outcome. A failure is not kept: the next consumption calls the function again, so a memoized `Try` retries until it succeeds.

```typescript
const config = Try.run(() => loadConfig()).memo();

config.isSuccess();           // calls loadConfig
config.onFail(defaultConfig); // reuses the value if the first call succeeded
```

### Transforming: `map` and `bind`

`map` transforms the success value. `bind` chains a function that returns another `Try`. Both are lazy, and a throw inside the function becomes a failure. On a failure the function is not called. The result is memoized, so its source runs once even if you consume the result several times.

```typescript
Try.run(() => "42").map(s => Number(s)).onFail(0);           // 42
Try.run(() => "{").map(s => JSON.parse(s)).isFailure();       // true

const parse = (raw: string) => Try.run(() => JSON.parse(raw) as { port: number });
Try.run(() => readFileSync(path, "utf-8"))
  .bind(parse)
  .map(c => c.port)
  .onFail(8080);
```

### Pattern matching: `match`

`match` runs the `Try` and calls `onSuccess` with the value or `onFail` with the error. `onFail` can also be a plain value:

```typescript
Try.run(() => 42).match(n => `got ${n}`, err => `failed: ${err}`); // "got 42"
Try.run((): number => { throw 1 }).match(n => n, 0);              // 0
```

### Handling failures: `onFail` and `onFailAsync`

`onFail` returns the success value, or the fallback on failure. The fallback can be a value, a zero-argument factory or a function of the error. A function is only called on failure:

```typescript
Try.run(() => 42).onFail(0);                                  // 42
Try.run((): number => { throw new Error("oops") }).onFail(0); // 0
Try.run((): number => { throw new Error("oops") }).onFail(() => computeDefault());
Try.run((): number => { throw new Error("oops") }).onFail(err => {
  console.error(err);
  return -1;
});                                                           // -1
```

`onFailAsync` is the async counterpart and accepts any `PromiseLike<T>` — including `EitherAsync<L, T>` when `T` is `Either<L, R>`:

```typescript
await Try.run(() => 42).onFailAsync(async _err => 0); // 42

// Async recovery — use TryAsync.runAsync for a fluent API
const data = await TryAsync.runAsync(() => fetchRemote())
  .onFailAsync(async err => {
    await logError(err);
    return fallbackData;
  });
```

### Converting to Either: `toEither`

`toEither` runs the `Try` and returns `right(value)` on success or `left(error)` with the thrown error on failure. The left is `unknown`; use `mapLeft` to turn it into a typed error:

```typescript
Try.run(() => 42).toEither();                         // right(42)
Try.run(() => JSON.parse("{")).toEither()
  .mapLeft(e => (e as Error).name);                    // left("SyntaxError")
```

### Worked example: safe JSON parsing

```typescript
type Config = { apiUrl: string; timeout: number };

const parseConfig = (raw: string): Config =>
  Try.run<Config>(() => JSON.parse(raw))
    .onFail({ apiUrl: "http://localhost", timeout: 5000 });

parseConfig('{"apiUrl":"https://api.example.com","timeout":3000}');
// { apiUrl: "https://api.example.com", timeout: 3000 }

parseConfig("not valid json {{");
// { apiUrl: "http://localhost", timeout: 5000 }  ← default
```

### Worked example: wrapping unreliable third-party code

```typescript
import { Try } from '@ngwes/mini-fp';

const readConfigFile = (path: string): Promise<string> =>
  Try.runAsync(() => fs.promises.readFile(path, "utf-8"))
    .onFailAsync(async err => {
      console.warn(`Could not read ${path}:`, err);
      return "{}";
    });
```

### Worked example: converting exceptions to Either

```typescript
import { Try, Either } from '@ngwes/mini-fp';

const tryToEither = <T>(fn: () => T): Either<Error, T> =>
  Try.run(fn)
    .toEither()
    .mapLeft(e => (e instanceof Error ? e : new Error(String(e))));
```

---

## TryAsync\<T\>

`TryAsync<T>` is the async counterpart of `Try<T>`. It wraps an async computation that might throw or return a rejected promise, and provides a fluent `.onFailAsync()` method so you can handle the error in a single expression — no `await` + separate `then` needed.

### Constructor

```typescript
import { TryAsync } from '@ngwes/mini-fp';

const result = TryAsync.runAsync(() => fetch(url).then(r => r.json()));
```

`Try.runAsync` also returns a `TryAsync<T>`, so both entry points are equivalent.

### Handling failures: `onFailAsync`

`.onFailAsync(handler)` returns the success value directly, or calls your async handler with the error:

```typescript
const data = await TryAsync.runAsync(() => fetchRemote())
  .onFailAsync(async err => {
    await logError(err);
    return fallbackData;
  });
```

### Awaiting the underlying `Try<T>`

`TryAsync<T>` implements `PromiseLike<Try<T>>`, so you can `await` it to get back a `Try<T>` and inspect or transform it manually:

```typescript
const t = await TryAsync.runAsync(() => fetchRemote());
t.isSuccess(); // true / false
```

### Worked example: fetching with fallback

```typescript
import { TryAsync } from '@ngwes/mini-fp';

const fetchConfig = (url: string): Promise<Config> =>
  TryAsync.runAsync(() => fetch(url).then(r => r.json()))
    .onFailAsync(_err => defaultConfig);
```

---

## Validate\<L, R\>

`Validate<L, R>` is designed for validation scenarios where you want to collect **all** errors rather than short-circuiting on the first one. Unlike `Either`, combining two invalid `Validate` instances accumulates their errors.

- `valid(value)` — the value passed all validations
- `invalid(errors)` — one or more validation rules failed (errors is an array)

### Constructors

```typescript
import { Validate } from '@ngwes/mini-fp';
const { valid, invalid } = Validate;

const ok  = valid<string, number>(42);       // Validate<string, number>
const err = invalid<string, number>(["must be positive"]); // Validate<string, number>
```

### Transforming and chaining

```typescript
// map — transform the valid value
valid<string, number>(5).map(x => x * 2).unwrap();  // 10
invalid<string, number>(["err"]).map(x => x * 2);   // still invalid(["err"])

// bind — chain a validation that itself returns a Validate
valid<string, number>(10)
  .bind(n => n > 0 ? valid(n) : invalid(["must be positive"]));
// valid(10)
```

### Combining: `combine` and `combineAsync`

This is the key feature of `Validate`. When both sides are invalid, **all errors are merged**:

```typescript
// Both valid → keeps first value
valid<string, number>(1).combine(valid(2)).unwrap(); // 1

// One invalid → collects all errors
valid<string, number>(10).combine(invalid(["too large"]));
// invalid(["too large"])

// Both invalid → accumulates errors
invalid<string, number>(["required"])
  .combine(invalid(["must be a number", "must be positive"]));
// invalid(["required", "must be a number", "must be positive"])

// Async combine
const r = await valid<string, number>(5)
  .combineAsync(Promise.resolve(invalid<string, number>(["async error"])));
// invalid(["async error"])
```

### Unwrapping

```typescript
valid(42).unwrap();               // 42
valid(42).unwrapInvalid();        // throws

invalid(["oops"]).unwrapInvalid(); // ["oops"]
invalid(["oops"]).unwrap();       // throws
```

### Worked example: form field validation

```typescript
import { Validate } from '@ngwes/mini-fp';
const { valid, invalid } = Validate;

type FieldError = { field: string; message: string };

const validateName = (name: string): Validate<FieldError, string> =>
  name.trim().length > 0
    ? valid(name.trim())
    : invalid([{ field: "name", message: "Name is required" }]);

const validateEmail = (email: string): Validate<FieldError, string> => {
  if (!email.includes("@"))
    return invalid([{ field: "email", message: "Invalid email address" }]);
  if (email.length > 254)
    return invalid([{ field: "email", message: "Email too long" }]);
  return valid(email);
};

const validateAge = (age: number): Validate<FieldError, number> => {
  const errors: FieldError[] = [];
  if (age < 0)   errors.push({ field: "age", message: "Age cannot be negative" });
  if (age > 150) errors.push({ field: "age", message: "Age is unrealistic" });
  return errors.length > 0 ? invalid(errors) : valid(age);
};

// Run all validations and collect every error
const result = validateName("")
  .combine(validateEmail("not-an-email"))
  .combine(validateAge(-5));

if (result.isInvalid()) {
  result.unwrapInvalid().forEach(e =>
    console.error(`[${e.field}] ${e.message}`)
  );
}
// [name] Name is required
// [email] Invalid email address
// [age] Age cannot be negative
```

### Worked example: validating a DTO before persistence

```typescript
import { Validate } from '@ngwes/mini-fp';
const { valid, invalid } = Validate;

interface CreateUserDto { username: string; password: string; email: string }
type ValidationError = string;

const validateUsername = (s: string): Validate<ValidationError, string> => {
  if (s.length < 3)  return invalid(["username: min 3 characters"]);
  if (s.length > 20) return invalid(["username: max 20 characters"]);
  if (!/^[a-z0-9_]+$/.test(s)) return invalid(["username: only lowercase letters, digits and underscores"]);
  return valid(s);
};

const validatePassword = (s: string): Validate<ValidationError, string> => {
  const errors: string[] = [];
  if (s.length < 8)        errors.push("password: min 8 characters");
  if (!/[A-Z]/.test(s))    errors.push("password: needs an uppercase letter");
  if (!/[0-9]/.test(s))    errors.push("password: needs a digit");
  return errors.length ? invalid(errors) : valid(s);
};

const validateDto = (dto: CreateUserDto): Validate<ValidationError, CreateUserDto> =>
  validateUsername(dto.username)
    .combine(validatePassword(dto.password))
    .map(() => dto);  // if all valid, return the original DTO

const result = validateDto({
  username: "ab",
  password: "weakpass",
  email: "user@example.com"
});

result.match(
  dto    => saveUser(dto),
  errors => res.status(400).json({ errors })
);
```

---

## Unit

`Unit` represents the absence of a meaningful return value — the functional equivalent of `void`. It avoids polluting your types with `void` in generic contexts.

```typescript
import { Unit } from '@ngwes/mini-fp';

// Use when an operation succeeds but has nothing to return
const performSideEffect = (): Either<string, Unit> => {
  try {
    doSomething();
    return Either.right(Unit.default);
  } catch {
    return Either.left("operation failed");
  }
};

performSideEffect().match(
  _unit => console.log("done"),
  err   => console.error(err)
);
```

---

## Traversal Utilities

Traversal functions flip a collection of monadic values into a single monad containing a collection. All traversals are fail-fast (returning `none`/`left`) except `sequenceValidate`, which accumulates.

### `traverseOption`

Converts `Option<T>[]` → `Option<T[]>`. Returns `none` as soon as any element is `none`.

```typescript
import { Option, traverseOption } from '@ngwes/mini-fp';
const { some, none, from } = Option;

traverseOption([some(1), some(2), some(3)]); // some([1, 2, 3])
traverseOption([some(1), none(),  some(3)]); // none  ← short-circuits
traverseOption([]);                          // some([])

// Practical use: look up several keys that must all exist
const getRequiredEnvVars = (keys: string[]): Option<string[]> =>
  traverseOption(keys.map(k => from(process.env[k])));

getRequiredEnvVars(["DB_HOST", "DB_PORT", "API_KEY"]);
// none if any variable is missing, some([...values]) if all present
```

### `traverseOptionAsync`

Converts `Option<Promise<T>>[]` → `Promise<Option<T[]>>`. Awaits all inner promises.

```typescript
import { Option, traverseOptionAsync } from '@ngwes/mini-fp';
const { some, none } = Option;

const results = await traverseOptionAsync([
  some(Promise.resolve(1)),
  some(Promise.resolve(2)),
]);
// some([1, 2])

const withMissing = await traverseOptionAsync([
  some(Promise.resolve(1)),
  none<Promise<number>>(),
]);
// none
```

### `traverseEither`

Converts `Either<L, R>[]` → `Either<L, R[]>`. Returns the first `left` encountered.

```typescript
import { Either, traverseEither } from '@ngwes/mini-fp';
const { left, right } = Either;

traverseEither([right(1), right(2), right(3)]); // right([1, 2, 3])
traverseEither([right(1), left("oops"), right(3)]); // left("oops")

// Practical use: parse a batch of inputs
const parseAll = (inputs: string[]): Either<string, number[]> =>
  traverseEither(
    inputs.map(s => {
      const n = Number(s);
      return isNaN(n) ? Either.left(`"${s}" is not a number`) : Either.right(n);
    })
  );

parseAll(["1", "2", "3"]); // right([1, 2, 3])
parseAll(["1", "abc", "3"]); // left('"abc" is not a number')
```

### `traverseEitherAsync`

Converts `Either<L, Promise<R>>[]` → `Promise<Either<L, R[]>>`.

```typescript
import { Either, traverseEitherAsync } from '@ngwes/mini-fp';
const { left, right } = Either;

const results = await traverseEitherAsync([
  right(Promise.resolve(10)),
  right(Promise.resolve(20)),
]);
// right([10, 20])

const withError = await traverseEitherAsync([
  right(Promise.resolve(10)),
  left("fetch failed"),
]);
// left("fetch failed")
```

### `sequenceValidate`

Converts `Validate<L, R>[]` → `Validate<L, R[]>`. Unlike `traverseEither`, it **does not short-circuit** — all validations run and all errors are collected.

```typescript
import { Validate, sequenceValidate } from '@ngwes/mini-fp';
const { valid, invalid } = Validate;

// All valid
sequenceValidate([valid(1), valid(2), valid(3)]).unwrap();
// [1, 2, 3]

// Collects all errors — not just the first
sequenceValidate([
  invalid(["e1"]),
  valid(5),
  invalid(["e2", "e3"]),
]).unwrapInvalid();
// ["e1", "e2", "e3"]

// Practical: validate every item in an array
const validatePositive = (n: number): Validate<string, number> =>
  n > 0 ? valid(n) : invalid([`${n} is not positive`]);

sequenceValidate([-1, 2, -3, 4].map(validatePositive));
// invalid(["-1 is not positive", "-3 is not positive"])
```

### `sequenceValidateAsync`

```typescript
import { sequenceValidateAsync, Validate } from '@ngwes/mini-fp';
const { valid, invalid } = Validate;

const result = await sequenceValidateAsync(
  Promise.resolve([
    valid<string, number>(1),
    invalid<string, number>(["async error"]),
    valid<string, number>(3),
  ])
);
// invalid(["async error"])
```

---

## Real-World Recipes

### Recipe 1: Config loading with fallbacks

Load config from environment, fall back to file, fall back to defaults.

```typescript
import { Option } from '@ngwes/mini-fp';
const { from } = Option;

interface AppConfig { dbUrl: string; port: number; logLevel: string }

const fromEnv = (): Option<AppConfig> => {
  const dbUrl    = process.env.DATABASE_URL;
  const port     = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
  const logLevel = process.env.LOG_LEVEL;

  return from(dbUrl)
    .bind(db => from(port).map(p => ({ dbUrl: db, port: p })))
    .bind(partial => from(logLevel).map(l => ({ ...partial, logLevel: l })));
};

const fromFile = async (): Promise<Option<AppConfig>> => {
  const text = await Option.fromAsync(
    import("fs/promises").then(fs =>
      fs.readFile("config.json", "utf-8").catch(() => null)
    )
  );
  return text.bind(t => {
    try { return Option.from<AppConfig>(JSON.parse(t)); }
    catch { return Option.none(); }
  });
};

const defaults: AppConfig = { dbUrl: "postgres://localhost/dev", port: 3000, logLevel: "info" };

const loadConfig = async (): Promise<AppConfig> => {
  const envConfig = fromEnv();
  if (envConfig.isSome()) return envConfig.unwrap();

  const fileConfig = await fromFile();
  return fileConfig.orElse(defaults);
};
```

### Recipe 2: User registration pipeline

Validate input, check for duplicates, hash the password, persist — each step can fail with a typed error.

```typescript
import { Either, Try } from '@ngwes/mini-fp';
const { left, right } = Either;

type RegistrationError =
  | { type: "VALIDATION";  field: string; message: string }
  | { type: "CONFLICT";    message: string }
  | { type: "PERSISTENCE"; message: string };

interface RegisterDto  { email: string; password: string }
interface User         { id: string; email: string; passwordHash: string }

const validateEmail = (email: string): Either<RegistrationError, string> =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? right(email)
    : left({ type: "VALIDATION", field: "email", message: "Invalid email format" });

const validatePassword = (password: string): Either<RegistrationError, string> =>
  password.length >= 8
    ? right(password)
    : left({ type: "VALIDATION", field: "password", message: "Min 8 characters" });

const checkNotTaken = async (email: string): Promise<Either<RegistrationError, string>> => {
  const existing = await db.users.findByEmail(email);
  return existing
    ? left({ type: "CONFLICT", message: `${email} is already registered` })
    : right(email);
};

const hashPassword = (password: string): Either<RegistrationError, string> =>
  Try.run(() => bcrypt.hashSync(password, 10))
    .toEither()
    .mapLeft((): RegistrationError => ({ type: "PERSISTENCE", message: "Failed to hash password" }));

const register = async (dto: RegisterDto): Promise<Either<RegistrationError, User>> =>
  validateEmail(dto.email)
    .bind(() => validatePassword(dto.password))
    .bindAsync(() => checkNotTaken(dto.email))
    .bindAsync(_email => Promise.resolve(hashPassword(dto.password)))
    .bindAsync(async hash => {
      const user = await db.users.create({ email: dto.email, passwordHash: hash });
      return right<RegistrationError, User>(user);
    });

// Usage
const result = await register({ email: "alice@example.com", password: "Secure1234" });

result.match(
  user  => res.status(201).json({ id: user.id }),
  error => {
    const status = error.type === "CONFLICT" ? 409
                 : error.type === "VALIDATION" ? 422
                 : 500;
    res.status(status).json(error);
  }
);
```

### Recipe 3: Batch processing with full error collection

Process a list of items and collect all failures, without stopping on the first one.

```typescript
import { Validate, sequenceValidate } from '@ngwes/mini-fp';
const { valid, invalid } = Validate;

interface ProductRow { sku: string; price: string; stock: string }
interface Product    { sku: string; price: number; stock: number }

const parseProduct = (row: ProductRow, index: number): Validate<string, Product> => {
  const price = parseFloat(row.price);
  const stock = parseInt(row.stock, 10);

  const priceV: Validate<string, number> =
    isNaN(price) || price < 0
      ? invalid([`Row ${index}: invalid price "${row.price}"`])
      : valid(price);

  const stockV: Validate<string, number> =
    isNaN(stock) || stock < 0
      ? invalid([`Row ${index}: invalid stock "${row.stock}"`])
      : valid(stock);

  return priceV
    .combine(stockV)
    .map(() => ({ sku: row.sku, price, stock }));
};

const importProducts = (rows: ProductRow[]): Validate<string, Product[]> =>
  sequenceValidate(rows.map((row, i) => parseProduct(row, i)));

const csvRows: ProductRow[] = [
  { sku: "A1", price: "9.99",  stock: "100"  },
  { sku: "A2", price: "-1",    stock: "50"   },  // bad price
  { sku: "A3", price: "4.99",  stock: "abc"  },  // bad stock
];

const outcome = importProducts(csvRows);

if (outcome.isInvalid()) {
  console.error("Import failed:", outcome.unwrapInvalid());
  // ["Row 1: invalid price \"-1\"", "Row 2: invalid stock \"abc\""]
} else {
  await productService.bulkInsert(outcome.unwrap());
}
```

### Recipe 4: Optional chaining across async boundaries

```typescript
import { Option } from '@ngwes/mini-fp';

const getRecommendations = async (sessionToken: string | null): Promise<string[]> => {
  return Option.from(sessionToken)
    .bindAsync(async token => {
      const userId = await auth.validateToken(token);
      return Option.from(userId);
    })
    .bindAsync(async id => {
      const prefs = await db.preferences.findByUser(id);
      return Option.from(prefs);
    })
    .mapAsync(async prefs => recommendations.forPreferences(prefs))
    .orElseAsync(async () => recommendations.trending());
};
```

---

## API Reference

### `Option<T>`

| | Signature | Description |
|---|---|---|
| `Option.some` | `some<T>(value: T): Option<T>` | Creates `some`; throws if value is `null`/`undefined` |
| `Option.none` | `none<T>(): Option<T>` | Creates `none` |
| `Option.from` | `from<T>(value: T \| null \| undefined): Option<T>`<br>`from<T>(value: T, noneWhen: (v: T) => boolean): Option<T>` | Safe constructor from nullable; or use `noneWhen` to treat a value as absent based on a predicate |
| `Option.fromAsync` | `fromAsync<T>(value: PromiseLike<T \| null \| undefined> \| null \| undefined): OptionAsync<T>` | Safe async constructor; returns chainable `OptionAsync` |
| `.isSome()` | `(): boolean` | `true` if value is present |
| `.isNone()` | `(): boolean` | `true` if no value |
| `.unwrap()` | `(): T` | Returns value; throws if `none` |
| `.map()` | `<U>(fn: (v: T) => U): Option<U>` | Transforms the inner value |
| `.mapAsync()` | `<U>(fn: (v: T) => PromiseLike<U>): OptionAsync<U>` | Async map; returns chainable `OptionAsync` |
| `.bind()` | `<U>(fn: (v: T) => Option<U>): Option<U>` | Chains `Option`-returning functions |
| `.bindAsync()` | `<U>(fn: (v: T) => PromiseLike<Option<U>>): OptionAsync<U>`<br>`<U>(promise: PromiseLike<Option<U>>): OptionAsync<U>` | Async bind; the function may return an `OptionAsync`; returns chainable `OptionAsync` |
| `.match()` | `<U>(onSome, onNone): U` | Pattern match on `some`/`none` |
| `.matchAsync()` | `<U>(onSome: (v: T) => U \| PromiseLike<U>, onNone: () => U \| PromiseLike<U>): Promise<U>` | Async pattern match; handlers may be sync or async |
| `.orElse()` | `(defaultValue: T \| (() => T)): T` | Returns value or fallback |
| `.orElseAsync()` | `(defaultValue: PromiseLike<T> \| (() => PromiseLike<T>)): Promise<T>` | Async fallback |
| `.filter()` | `(predicate: (v: T) => boolean): Option<T>` | Keeps `some` only when the predicate holds |
| `.onSome()` | `(action: (v: T) => void): Option<T>` | Runs the action on `some`; returns the same option |
| `.onNone()` | `(action: () => void): Option<T>` | Runs the action on `none`; returns the same option |
| `.mapNone()` | `(fn: () => T): Option<T>` | Replaces `none` with `Option.from(fn())` |
| `.mapNoneAsync()` | `(fn: () => PromiseLike<T>): OptionAsync<T>` | Async `mapNone`; returns chainable `OptionAsync` |
| `.bindNone()` | `(fn: () => Option<T>): Option<T>` | Replaces `none` with the produced option |
| `.bindNoneAsync()` | `(fn: () => PromiseLike<Option<T>>): OptionAsync<T>` | Async `bindNone`; returns chainable `OptionAsync` |
| `.toEither()` | `<L>(left: L \| (() => L)): Either<L, T>` | `some` becomes `right`, `none` becomes `left`; a factory is called only on `none` |
| `.guardMap()` | `<U>(otherwise: (v: T) => U, ...guards: Guard<T, U>[]): Option<U>` | Maps with the first matching guard, else `otherwise`; no guard runs on `none` |
| `.guardMapAsync()` | `<U>(otherwise: (v: T) => PromiseLike<U>, ...guards: Guard<T, PromiseLike<U>>[]): OptionAsync<U>` | Async `guardMap`; returns chainable `OptionAsync` |
| `.guardBind()` | `<U>(otherwise: (v: T) => Option<U>, ...guards: Guard<T, Option<U>>[]): Option<U>` | Binds with the first matching guard, else `otherwise`; no guard runs on `none` |
| `.guardBindAsync()` | `<U>(otherwise: (v: T) => PromiseLike<Option<U>>, ...guards: Guard<T, PromiseLike<Option<U>>>[]): OptionAsync<U>` | Async `guardBind`; returns chainable `OptionAsync` |

### `Either<L, R>`

| | Signature | Description |
|---|---|---|
| `Either.left` | `left<L, R>(value: L): Either<L, R>` | Creates `left`; throws if `null`/`undefined` |
| `Either.right` | `right<L, R>(value: R): Either<L, R>` | Creates `right`; throws if `null`/`undefined` |
| `.isLeft()` | `(): boolean` | `true` if left |
| `.isRight()` | `(): boolean` | `true` if right |
| `.unwrapLeft()` | `(): L` | Returns left value; throws if right |
| `.unwrapRight()` | `(): R` | Returns right value; throws if left |
| `.map()` | `<U>(fn: (v: R) => U): Either<L, U>` | Transforms the right value |
| `.mapLeft()` | `<U>(fn: (v: L) => U): Either<U, R>` | Transforms the left value |
| `.bind()` | `<U>(fn: (v: R) => Either<L, U>): Either<L, U>` | Chains on the right side |
| `.bindLeft()` | `<U>(fn: (v: L) => Either<U, R>): Either<U, R>` | Chains on the left side |
| `.match()` | `<U>(onRight, onLeft): U` | Pattern match on `right`/`left` |
| `.onRight()` | `(action: (v: R) => void): Either<L, R>` | Runs the action on `right`; returns the same either |
| `.onLeft()` | `(action: (v: L) => void): Either<L, R>` | Runs the action on `left`; returns the same either |
| `.guardMap()` | `<U>(otherwise: (v: R) => U, ...guards: Guard<R, U>[]): Either<L, U>` | Maps with the first matching guard, else `otherwise`; no guard runs on `left` |
| `.guardBind()` | `<U>(otherwise: (v: R) => Either<L, U>, ...guards: Guard<R, Either<L, U>>[]): Either<L, U>`<br>`<A, B>(onLeft: (v: L) => Either<A, B>, otherwise: (v: R) => Either<A, B>, ...guards: Guard<R, Either<A, B>>[]): Either<A, B>` | Binds with the first matching guard, else `otherwise`; no guard runs on `left`, which is kept or passed to `onLeft` |
| `.mapAsync()` | `<U>(fn: (v: R) => PromiseLike<U>): EitherAsync<L, U>` | Async map right; returns chainable `EitherAsync` |
| `.mapLeftAsync()` | `<U>(fn: (v: L) => PromiseLike<U>): EitherAsync<U, R>` | Async map left; returns chainable `EitherAsync` |
| `.bindAsync()` | `<U>(fn: (v: R) => PromiseLike<Either<L, U>>): EitherAsync<L, U>`<br>`<U>(promise: PromiseLike<Either<L, U>>): EitherAsync<L, U>` | Async bind right; the function may return an `EitherAsync`; returns chainable `EitherAsync` |
| `.bindLeftAsync()` | `<U>(fn: (v: L) => PromiseLike<Either<U, R>>): EitherAsync<U, R>`<br>`<U>(promise: PromiseLike<Either<U, R>>): EitherAsync<U, R>` | Async bind left; the function may return an `EitherAsync`; returns chainable `EitherAsync` |
| `.guardMapAsync()` | `<U>(otherwise: (v: R) => PromiseLike<U>, ...guards: Guard<R, PromiseLike<U>>[]): EitherAsync<L, U>` | Async `guardMap`; returns chainable `EitherAsync` |
| `.guardBindAsync()` | `<U>(otherwise: (v: R) => PromiseLike<Either<L, U>>, ...guards: Guard<R, PromiseLike<Either<L, U>>>[]): EitherAsync<L, U>`<br>`<A, B>(onLeft: (v: L) => PromiseLike<Either<A, B>>, otherwise: (v: R) => PromiseLike<Either<A, B>>, ...guards: Guard<R, PromiseLike<Either<A, B>>>[]): EitherAsync<A, B>` | Async `guardBind`; returns chainable `EitherAsync` |
| `.matchAsync()` | `<U>(onRight: (v: R) => U \| PromiseLike<U>, onLeft: (v: L) => U \| PromiseLike<U>): Promise<U>` | Async pattern match; handlers may be sync or async |

### `OptionAsync<T>`

Returned by `Option.fromAsync()` and by the `Async` methods of `Option`. Wraps a `Promise<Option<T>>` and implements `PromiseLike`, so it can be awaited directly or chained further. It mirrors `Option`: each method takes the same parameters and returns an `OptionAsync`, except the terminal methods, which return a `Promise`. On `none`, later callbacks are never called; if a callback throws, the awaited result rejects.

| | Signature | Description |
|---|---|---|
| `OptionAsync.from` | `from<T>(promise: PromiseLike<Option<T>>): OptionAsync<T>` | Wraps an existing promise |
| `OptionAsync.some` | `some<T>(value: T): OptionAsync<T>` | Creates an already-resolved `some`; throws if value is `null`/`undefined` |
| `OptionAsync.none` | `none<T>(): OptionAsync<T>` | Creates an already-resolved `none` |
| `.map()` | `<U>(fn: (v: T) => U): OptionAsync<U>` | Transforms the inner value |
| `.mapAsync()` | `<U>(fn: (v: T) => PromiseLike<U>): OptionAsync<U>` | Async map |
| `.bind()` | `<U>(fn: (v: T) => Option<U>): OptionAsync<U>` | Chains `Option`-returning functions |
| `.bindAsync()` | `<U>(fn: (v: T) => PromiseLike<Option<U>>): OptionAsync<U>`<br>`<U>(promise: PromiseLike<Option<U>>): OptionAsync<U>` | Chains on `some`; short-circuits on `none`; the function may return an `OptionAsync` |
| `.filter()` | `(predicate: (v: T) => boolean): OptionAsync<T>` | Keeps `some` only when the predicate holds |
| `.onSome()` | `(action: (v: T) => void): OptionAsync<T>` | Runs the action on `some` |
| `.onNone()` | `(action: () => void): OptionAsync<T>` | Runs the action on `none` |
| `.mapNone()` | `(fn: () => T): OptionAsync<T>` | Replaces `none` with `Option.from(fn())` |
| `.mapNoneAsync()` | `(fn: () => PromiseLike<T>): OptionAsync<T>` | Async `mapNone` |
| `.bindNone()` | `(fn: () => Option<T>): OptionAsync<T>` | Replaces `none` with the produced option |
| `.bindNoneAsync()` | `(fn: () => PromiseLike<Option<T>>): OptionAsync<T>` | Async `bindNone` |
| `.guardMap()` | `<U>(otherwise: (v: T) => U, ...guards: Guard<T, U>[]): OptionAsync<U>` | Maps with the first matching guard, else `otherwise` |
| `.guardMapAsync()` | `<U>(otherwise: (v: T) => PromiseLike<U>, ...guards: Guard<T, PromiseLike<U>>[]): OptionAsync<U>` | Async `guardMap` |
| `.guardBind()` | `<U>(otherwise: (v: T) => Option<U>, ...guards: Guard<T, Option<U>>[]): OptionAsync<U>` | Binds with the first matching guard, else `otherwise` |
| `.guardBindAsync()` | `<U>(otherwise: (v: T) => PromiseLike<Option<U>>, ...guards: Guard<T, PromiseLike<Option<U>>>[]): OptionAsync<U>` | Async `guardBind` |
| `.toEither()` | `<L>(left: L \| (() => L)): EitherAsync<L, T>` | `some` becomes `right`, `none` becomes `left`; a factory is called only on `none` |
| `.match()` | `<U>(onSome: (v: T) => U, onNone: () => U): Promise<U>` | Pattern match on `some`/`none` |
| `.matchAsync()` | `<U>(onSome: (v: T) => U \| PromiseLike<U>, onNone: () => U \| PromiseLike<U>): Promise<U>` | Async pattern match; handlers may be sync or async |
| `.orElse()` | `(defaultValue: T \| (() => T)): Promise<T>` | Resolves to the value or the fallback |
| `.orElseAsync()` | `(defaultValue: PromiseLike<T> \| (() => PromiseLike<T>)): Promise<T>` | Resolves to the value or the async fallback |
| `.then()` | `PromiseLike.then` | Allows `await` and `.then()` interop |

### `EitherAsync<L, R>`

Returned by the `Async` methods of `Either`. Wraps a `Promise<Either<L, R>>` and implements `PromiseLike`, so it can be awaited directly or chained further. It mirrors `Either`: each method takes the same parameters and returns an `EitherAsync`, except the terminal methods, which return a `Promise`. On `left`, later right-side callbacks are never called; if a callback throws, the awaited result rejects.

| | Signature | Description |
|---|---|---|
| `EitherAsync.from` | `from<L, R>(promise: PromiseLike<Either<L, R>>): EitherAsync<L, R>` | Wraps an existing promise |
| `EitherAsync.right` | `right<L, R>(value: R): EitherAsync<L, R>` | Creates an already-resolved `right` |
| `EitherAsync.left` | `left<L, R>(value: L): EitherAsync<L, R>` | Creates an already-resolved `left` |
| `.map()` | `<U>(fn: (v: R) => U): EitherAsync<L, U>` | Transforms the right value |
| `.mapLeft()` | `<U>(fn: (v: L) => U): EitherAsync<U, R>` | Transforms the left value |
| `.bind()` | `<U>(fn: (v: R) => Either<L, U>): EitherAsync<L, U>` | Chains on the right side |
| `.bindLeft()` | `<U>(fn: (v: L) => Either<U, R>): EitherAsync<U, R>` | Chains on the left side |
| `.mapAsync()` | `<U>(fn: (v: R) => PromiseLike<U>): EitherAsync<L, U>` | Async map right |
| `.mapLeftAsync()` | `<U>(fn: (v: L) => PromiseLike<U>): EitherAsync<U, R>` | Async map left |
| `.bindAsync()` | `<U>(fn: (v: R) => PromiseLike<Either<L, U>>): EitherAsync<L, U>`<br>`<U>(promise: PromiseLike<Either<L, U>>): EitherAsync<L, U>` | Chains on `right`; short-circuits on `left`; the function may return an `EitherAsync` |
| `.bindLeftAsync()` | `<U>(fn: (v: L) => PromiseLike<Either<U, R>>): EitherAsync<U, R>`<br>`<U>(promise: PromiseLike<Either<U, R>>): EitherAsync<U, R>` | Chains on `left`; short-circuits on `right`; the function may return an `EitherAsync` |
| `.onRight()` | `(action: (v: R) => void): EitherAsync<L, R>` | Runs the action on `right` |
| `.onLeft()` | `(action: (v: L) => void): EitherAsync<L, R>` | Runs the action on `left` |
| `.guardMap()` | `<U>(otherwise: (v: R) => U, ...guards: Guard<R, U>[]): EitherAsync<L, U>` | Maps with the first matching guard, else `otherwise` |
| `.guardMapAsync()` | `<U>(otherwise: (v: R) => PromiseLike<U>, ...guards: Guard<R, PromiseLike<U>>[]): EitherAsync<L, U>` | Async `guardMap` |
| `.guardBind()` | `<U>(otherwise: (v: R) => Either<L, U>, ...guards: Guard<R, Either<L, U>>[]): EitherAsync<L, U>`<br>`<A, B>(onLeft: (v: L) => Either<A, B>, otherwise: (v: R) => Either<A, B>, ...guards: Guard<R, Either<A, B>>[]): EitherAsync<A, B>` | Binds with the first matching guard, else `otherwise`; the left is kept or passed to `onLeft` |
| `.guardBindAsync()` | `<U>(otherwise: (v: R) => PromiseLike<Either<L, U>>, ...guards: Guard<R, PromiseLike<Either<L, U>>>[]): EitherAsync<L, U>`<br>`<A, B>(onLeft: (v: L) => PromiseLike<Either<A, B>>, otherwise: (v: R) => PromiseLike<Either<A, B>>, ...guards: Guard<R, PromiseLike<Either<A, B>>>[]): EitherAsync<A, B>` | Async `guardBind` |
| `.match()` | `<U>(onRight: (v: R) => U, onLeft: (v: L) => U): Promise<U>` | Pattern match on `right`/`left` |
| `.matchAsync()` | `<U>(onRight: (v: R) => U \| PromiseLike<U>, onLeft: (v: L) => U \| PromiseLike<U>): Promise<U>` | Async pattern match; handlers may be sync or async |
| `.then()` | `PromiseLike.then` | Allows `await` and `.then()` interop |

### `Try<T>`

| | Signature | Description |
|---|---|---|
| `Try.run` | `run<T>(fn: () => T): Try<T>` | Wraps a sync function lazily; it runs (and exceptions are caught) when the `Try` is consumed |
| `Try.runAsync` | `runAsync<T>(fn: () => PromiseLike<T>): TryAsync<T>` | Runs an async function (or any `PromiseLike`), catches exceptions — returns `TryAsync` |
| `.isSuccess()` | `(): boolean` | Runs the function; `true` if nothing was thrown |
| `.isFailure()` | `(): boolean` | Runs the function; `true` if anything was thrown (including `null`/`undefined`) |
| `.memo()` | `(): Try<T>` | Keeps the first successful outcome; a failure runs the function again next time |
| `.map()` | `<U>(fn: (value: T) => U): Try<U>` | Lazily transforms the success value; a throw in `fn` is a failure; memoized |
| `.bind()` | `<U>(fn: (value: T) => Try<U>): Try<U>` | Lazily chains a `Try`-returning function; skipped on failure; memoized |
| `.match()` | `<U>(onSuccess: (value: T) => U, onFail: ((error: unknown) => U) \| U): U` | Runs the function and calls `onSuccess` or `onFail` (a function or a plain value) |
| `.onFail()` | `(fallback: T \| ((error: unknown) => T)): T` | Returns the value on success, or the fallback (a value, a factory or an error handler) on failure |
| `.onFailAsync()` | `(fn: (error: unknown) => PromiseLike<T>): Promise<T>` | Async failure handler — accepts any `PromiseLike<T>`, including `EitherAsync<L, T>` when `T` is `Either<L, R>` |
| `.toEither()` | `(): Either<unknown, T>` | `right(value)` on success, `left(error)` with the thrown error on failure |

### `TryAsync<T>`

| | Signature | Description |
|---|---|---|
| `TryAsync.runAsync` | `runAsync<T>(fn: () => Promise<T>): TryAsync<T>` | Runs an async function, catches throws and rejections |
| `.onFailAsync()` | `(fn: (error: unknown) => PromiseLike<T>): Promise<T>` | Returns the value on success, calls async handler on failure — accepts any `PromiseLike<T>`, including `EitherAsync<L, T>` when `T` is `Either<L, R>` |
| `.then()` | `PromiseLike.then` | Allows `await` interop — resolves to `Try<T>` |

### `Validate<L, R>`

| | Signature | Description |
|---|---|---|
| `Validate.valid` | `valid<L, R>(value: R): Validate<L, R>` | Creates valid; throws if value is `null` |
| `Validate.invalid` | `invalid<L, R>(errors: L[]): Validate<L, R>` | Creates invalid; throws if `null` |
| `.isValid()` | `(): boolean` | `true` if valid |
| `.isInvalid()` | `(): boolean` | `true` if invalid |
| `.unwrap()` | `(): R` | Returns value; throws if invalid |
| `.unwrapInvalid()` | `(): L[]` | Returns errors; throws if valid |
| `.map()` | `<U>(fn: (v: R) => U): Validate<L, U>` | Transforms the valid value |
| `.bind()` | `<U>(fn: (v: R) => Validate<L, U>): Validate<L, U>` | Chains on valid |
| `.combine()` | `(other: Validate<L, R>): Validate<L, R>` | Merges two validations, accumulating errors |
| `.combineAsync()` | `(other: Promise<Validate<L, R>>): Promise<Validate<L, R>>` | Async combine |

### Traversal functions

| Function | Signature | Description |
|---|---|---|
| `traverseOption` | `<T>(items: Option<T>[]): Option<T[]>` | Collects all `some` values; returns `none` on first `none` |
| `traverseOptionAsync` | `<T>(items: Option<Promise<T>>[]): Promise<Option<T[]>>` | Async version |
| `traverseEither` | `<L, R>(items: Either<L, R>[]): Either<L, R[]>` | Collects all `right` values; returns first `left` |
| `traverseEitherAsync` | `<L, R>(items: Either<L, Promise<R>>[]): Promise<Either<L, R[]>>` | Async version |
| `sequenceValidate` | `<L, R>(validates: Validate<L, R>[]): Validate<L, R[]>` | Sequences, accumulating all errors |
| `sequenceValidateAsync` | `<L, R>(validates: Promise<Validate<L, R>[]>): Promise<Validate<L, R[]>>` | Async version |

### `Unit`

```typescript
import { Unit } from '@ngwes/mini-fp';
Unit.default; // the singleton Unit value
```

---

## Design notes

`mini-fp` follows the same conventions as `language-ext`:

- **Right-biased Either** — `map` and `bind` operate on the right (success) side by default; `mapLeft`/`bindLeft` let you work on the left side when needed.
- **Fail-fast vs. error-harvesting** — `Either` and `Option` short-circuit on the first failure; `Validate` accumulates all failures. Choose based on whether you want to stop early or report everything.
- **No null leakage** — constructors throw on `null`/`undefined` inputs (except `from` and `fromAsync` which are the safe entry points). Once inside a monad, the value is guaranteed non-null.
- **Async transparency** — every synchronous operation has an `Async` counterpart with the same semantics, so you can mix sync and async pipelines freely.

---

## Development

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Build
npm run build
```

## Thanks

A special thanks to Franco, who developed [Tiny-FP](https://github.com/FrancoMelandri/tiny-fp), from which this repository borrows its name and through which I was introduced to functional programming for the first time.

If you're interested in functional programming and Railway-oriented programming, here are the first two resources I used when studying these paradigms — written for C#, but the concepts translate directly.

[Functional Programming in C#, by Enrico Buonanno](https://www.manning.com/books/functional-programming-in-c-sharp)

[F# for fun and profit](https://fsharpforfunandprofit.com/)