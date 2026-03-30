# mini-fp

A minimal TypeScript functional programming library inspired by [language-ext](https://github.com/louthy/language-ext) for .NET. Provides monadic types to handle absence, errors, and async flows without null checks or exceptions.

**Zero production dependencies. Node >= 18.**

---

## Installation

```bash
npm install mini-fp
```

---

## Option\<T\>

`Option<T>` represents a value that may or may not exist. It is either `Some<T>` (a value is present) or `None` (no value).

### Import

```typescript
import { Option } from 'mini-fp';
const { Option: O } = Option;
// or destructure constructors directly:
const { Some, None, From } = Option.Option;
```

### Creating an Option

```typescript
// Some: wraps a value (throws if null/undefined)
const a = Some(42);          // Option<number> — Some(42)

// None: represents absence of a value
const b = None<number>();    // Option<number> — None

// From: safe constructor, converts null/undefined to None
const c = From(null);        // None
const d = From("hello");     // Some("hello")

// FromAsync: wraps a Promise, converts null/undefined resolve to None
const e = await Option.Option.FromAsync(fetch('/api/user').then(r => r.json()));
```

### Transforming values

#### `map` — apply a function to the inner value

```typescript
Some(2).map(x => x * 3);       // Some(6)
None<number>().map(x => x * 3); // None
```

#### `bind` — chain operations that return Option

```typescript
const parsePositive = (n: number) => n > 0 ? Some(n) : None<number>();

Some(5).bind(parsePositive);    // Some(5)
Some(-1).bind(parsePositive);   // None
None<number>().bind(parsePositive); // None
```

### Pattern matching

```typescript
const result = Some(42).match(
    value => `Got ${value}`,
    ()    => "Nothing here"
);
// "Got 42"

const fallback = None<number>().match(
    value => value * 2,
    ()    => 0
);
// 0
```

### Fallback values

```typescript
// With a default value
Some(1).orElse(99);       // 1
None<number>().orElse(99); // 99

// With a factory function
None<number>().orElse(() => computeDefault()); // computeDefault()
```

### Unwrapping

```typescript
Some(42).Unwrap();        // 42
None<number>().Unwrap();  // throws Error
```

Use `isSome()` / `isNone()` to guard before unwrapping:

```typescript
const opt = From(maybeValue);
if (opt.isSome()) {
    console.log(opt.Unwrap());
}
```

---

## Async API

Every operation has an async counterpart that works with `Promise`s.

```typescript
// FromAsync
const opt = await Option.Option.FromAsync(asyncGetUser(id));

// mapAsync
const upper = await From("hello").mapAsync(async s => s.toUpperCase());
// Some("HELLO")

// bindAsync
const user = await From(userId).bindAsync(async id => {
    const u = await db.findUser(id);
    return From(u); // None if not found
});

// matchAsync
const label = await opt.matchAsync(
    async user => `Welcome, ${user.name}`,
    async ()   => "Guest"
);

// orElseAsync
const value = await None<User>().orElseAsync(async () => guestUser());
```

---

## API Reference

### Static methods

| Method | Signature | Description |
|---|---|---|
| `Some` | `Some<T>(value: T): Option<T>` | Creates a Some; throws if value is null/undefined |
| `None` | `None<T>(): Option<T>` | Creates a None |
| `From` | `From<T>(value: T \| null \| undefined): Option<T>` | Safe constructor from nullable |
| `FromAsync` | `FromAsync<T>(value: Promise<T> \| null \| undefined): Promise<Option<T>>` | Safe constructor from nullable Promise |

### Instance methods

| Method | Signature | Description |
|---|---|---|
| `isSome` | `isSome(): boolean` | True if value is present |
| `isNone` | `isNone(): boolean` | True if no value |
| `Unwrap` | `Unwrap(): T` | Returns value; throws if None |
| `map` | `map<U>(fn: (v: T) => U): Option<U>` | Transforms the inner value |
| `mapAsync` | `mapAsync<U>(fn: (v: T) => Promise<U>): Promise<Option<U>>` | Async map |
| `bind` | `bind<U>(fn: (v: T) => Option<U>): Option<U>` | Chains Option-returning functions |
| `bindAsync` | `bindAsync<U>(fn: (v: T) => Promise<Option<U>>): Promise<Option<U>>` | Async bind |
| `match` | `match<U>(onSome, onNone): U` | Pattern match on Some/None |
| `matchAsync` | `matchAsync<U>(onSome, onNone): Promise<U>` | Async pattern match |
| `orElse` | `orElse(defaultValue: T \| (() => T)): T` | Returns value or fallback |
| `orElseAsync` | `orElseAsync(defaultValue: Promise<T> \| (() => Promise<T>)): Promise<T>` | Async fallback |

---

## Development

```bash
# Run tests
npm test

# Build
npm run build
```
