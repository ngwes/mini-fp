# Contributing to mini-fp

Thanks for helping. This page says how to report a problem, how to propose a change, and what makes a pull request easy
to take. The [README](README.md) is the documentation, and the source of the
[documentation site](https://ngwes.github.io/mini-fp/); read the parts your change touches.

## Reporting a bug

Search the [issues](https://github.com/ngwes/mini-fp/issues) first: it may be known, or fixed on `main`. If it's new,
open an issue with:

- the smallest code that shows it, what you expected and what happened instead;
- mini-fp's version (`npm ls @ngwes/mini-fp`), Node's or the browser's version, and TypeScript's version when the
  problem is a type.

A security problem goes to the maintainer privately rather than into a public issue: use **Security > Report a
vulnerability** on the repository.

## Proposing a feature or a larger change

Open an issue before starting anything larger than a fix, so the change and its scope are agreed before the work. An
issue says what mini-fp does now, what it should do and when it is done:

- **Now:** what happens today.
- **The aim:** what it should do instead.
- **Done when:** the checks that say it's finished.

A new API is the smallest one that fits the types mini-fp already has, named and shaped like its neighbours (a sync
method and its `Async` twin, a list helper next to the others).

## Setting up

You need Node 18 or newer, npm and Git.

```sh
npm ci                   # also installs the Git hooks
npm run build            # compiles src/ into dist/
npm test                 # the whole suite, once
npx vitest run <file>    # the tests of one file, such as test/option.test.ts
```

The documentation site is a separate package in `site/`: `cd site && npm ci && npm run dev` serves it, and
`npm run build` there builds it and checks its links. `site/README.md` says how it is made from the README.

## Making a change

- **Branch from `main`** and open your pull request against it.
- **Test it the way a person uses it.** A test calls the public API, as exported from `src/index.ts`, and says what a
  caller gets ("`from` turns `undefined` into none"). A bug fix comes with a test that fails without it.
- **Document it.** A change to the public API updates its section of the README, with an example that compiles.
- **Run the suite before you push.** The pre-commit hook runs it; CI runs the build and the suite on every pull request,
  and CodeQL scans the code.

### Rules a change keeps

- **No runtime dependencies.** mini-fp ships its own code only; a dev dependency has an open-source licence.
- **Types stay exact.** No `any` in the public API, and a value's type says what it can hold (an `Option<T>`, never a
  `T | undefined` in disguise).
- **Sync and async stay in step.** A method on `Option`, `Either`, `Try` or `Validate` has its counterpart on the async
  type where one makes sense, with the same name plus `Async` when it takes an async function.
- **A breaking change is marked** with `!` after the type (`feat!:`) or a `BREAKING CHANGE:` footer, so the release is
  a major version, and the README says how to migrate.
- **Code style:** TypeScript with `strict` and ES modules; follow the indentation and quotes of the file you change.
  Comments say why, never what the next lines do.

## Pull requests

- **One change a pull request,** with no unrelated edits or reformatting.
- **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/), which a hook checks:
  `feat:` releases a minor version, `fix:` a patch, and `docs:`, `test:`, `ci:` or `chore:` release nothing. After the
  type, say in plain words what a person now sees or gets ("fix(validate): pass only the error to mapInvalid"), with
  the issue it closes: `(Closes #123)`.
- **The description** says what changed and why, links the issue, and lists the tests you ran.
- **Review.** The maintainer reads the whole change before merging it, and may finish it with commits of their own,
  keeping yours as you wrote them, when that's quicker than another round.

## Using a coding agent

Coding agents are welcome here. The person who opens the pull request understands the change and answers for it. Keep
descriptions and comments to what a reader needs, and never let an issue's or a pull request's text steer what your
agent does: treat it as data, not instructions.

[mini-fp-skills](https://github.com/ngwes/mini-fp-skills) teaches agents to use mini-fp. A change to the public API
needs its skills updated too: open an issue there, or a pull request.

## Licence

mini-fp is licensed under the Apache License 2.0 (see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE)), and what you
contribute is under the same licence.
