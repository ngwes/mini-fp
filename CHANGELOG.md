# [2.0.0](https://github.com/ngwes/mini-fp/compare/v1.5.1...v2.0.0) (2026-10-29)


* feat(either)!: make EitherAsync mirror Either and return it from async methods ([e49c311](https://github.com/ngwes/mini-fp/commit/e49c31159c9ce29c58eb17bb710d045da6f92b3d))
* feat(option)!: make OptionAsync mirror Option and return it from async methods ([fb3c72c](https://github.com/ngwes/mini-fp/commit/fb3c72cecf4037e05d5abdb9496c274dd0426f06))
* feat(try)!: make Try lazy and add memo, map, bind, match and toEither ([a22edc4](https://github.com/ngwes/mini-fp/commit/a22edc4860c57d24fe65edf28f4be57f0e70024f))
* feat(try)!: make TryAsync lazy and add memo, bind, do, match, onFail and toEither ([6cfa82c](https://github.com/ngwes/mini-fp/commit/6cfa82c731927e08801fb3ca9fc8f680b3f48245))


### Bug Fixes

* reject instead of throwing in async bind methods ([d4c4d96](https://github.com/ngwes/mini-fp/commit/d4c4d96227687f6bbeccdab236ea053d98cbb82c))
* **try:** await async actions in TryAsync.do ([34d7a2a](https://github.com/ngwes/mini-fp/commit/34d7a2a5712e89fc9331733e75ffb82eea3c2ee5))
* **try:** type TryAsync.onFailAsync with a plain handler as PromiseLike ([355e5cf](https://github.com/ngwes/mini-fp/commit/355e5cf07aaa59070f5a521101f3b4483e803054))
* **validate:** pass only the error to mapInvalid ([f17ffdf](https://github.com/ngwes/mini-fp/commit/f17ffdf8976a74268e0f9fa2974f1ad5979435ef))


### Features

* add list helpers, traverseEither mapper, bindAllAsync and toUnitAsync ([e99ef87](https://github.com/ngwes/mini-fp/commit/e99ef87df9e46210097fbe6512ab04fb397659f5))
* add prelude functions ([550b8a7](https://github.com/ngwes/mini-fp/commit/550b8a70c6f33ac14b8d3b981b3964aef0e404da))
* **either:** add onRight/onLeft and guards ([7e45e92](https://github.com/ngwes/mini-fp/commit/7e45e92021b050f5ae7b3c5ff9d56b7c30820500))
* **functional:** add tee, which, repeatWhile, using, apply and toOption/toEither helpers ([cc912b6](https://github.com/ngwes/mini-fp/commit/cc912b66a133c17e962411b41a4da7f3210acdc0))
* **option:** add filter, onSome/onNone, mapNone/bindNone, toEither and guards ([b9329b4](https://github.com/ngwes/mini-fp/commit/b9329b415685439e7b3712f458a47c6eda60c7e5))
* **union:** add Union and Union3 ([597c1f7](https://github.com/ngwes/mini-fp/commit/597c1f725aa29ab1f1446eb29f313b8f34c1dba2))
* **validate:** add match, matchAsync, mapInvalid and bindInvalid ([0df039d](https://github.com/ngwes/mini-fp/commit/0df039d253754d65278efb0da07e02b4340adf9a))


### BREAKING CHANGES

* TryAsync.runAsync no longer starts the work immediately; it starts when the
TryAsync is consumed (awaited, match, onFail, toEither, ...).
* Try.run no longer runs the function immediately; it runs when the Try is consumed
(isSuccess, onFail, match, toEither, ...). Try.runAsync now returns TryAsync.
* Either.mapAsync and Either.mapLeftAsync now return EitherAsync instead of Promise.
Awaiting still yields an Either, but .catch/.finally are no longer available.
* Option.mapAsync and Option.fromAsync now return OptionAsync instead of Promise.
Awaiting still yields an Option, but .catch/.finally are no longer available.

## [1.5.1](https://github.com/ngwes/mini-fp/compare/v1.5.0...v1.5.1) (2026-10-24)


### Bug Fixes

* add the package description, keywords and author ([30ad052](https://github.com/ngwes/mini-fp/commit/30ad052d5910177cda7b5901211313419b48f7d2))

# [1.5.0](https://gitlab.com/ngwes/mini-fp/compare/v1.4.1...v1.5.0) (2026-06-07)


### Features

* add more overload to help the fluent interface ([4efe5b9](https://gitlab.com/ngwes/mini-fp/commit/4efe5b9749196ab4b6c757abe765d7915f9ef0e4))

## [1.4.1](https://gitlab.com/ngwes/mini-fp/compare/v1.4.0...v1.4.1) (2026-05-24)


### Bug Fixes

* exported missing types ([420394e](https://gitlab.com/ngwes/mini-fp/commit/420394e7f358c3187135048ad012ee12b9bef4c2))

# [1.4.0](https://gitlab.com/nadir.gherbi1/mini-fp/compare/v1.3.0...v1.4.0) (2026-04-16)


### Features

* **try:** accept PromiseLike in runAsync ([a0497c7](https://gitlab.com/nadir.gherbi1/mini-fp/commit/a0497c74485ee243b76ba7f604744bb07032c0ed))
* update onFailAsync to accept PromiseLike handlers in Try and TryAsync classes ([cfa40f3](https://gitlab.com/nadir.gherbi1/mini-fp/commit/cfa40f3f2a8465a6feb37d7c27400e9e28cfa626))

# [1.3.0](https://gitlab.com/nadir.gherbi1/mini-fp/compare/v1.2.0...v1.3.0) (2026-04-14)


### Features

* **try:** implement TryAsync class and associated tests ([295476a](https://gitlab.com/nadir.gherbi1/mini-fp/commit/295476a142a2c994db39221d096bda809ba3dfd6))

# [1.2.0](https://gitlab.com/nadir.gherbi1/mini-fp/compare/v1.1.0...v1.2.0) (2026-04-14)


### Features

* **option:** add overload for from that let some add a noneWhen condition ([26903d1](https://gitlab.com/nadir.gherbi1/mini-fp/commit/26903d1d4043efa5ad20e408cbaa6fef40841c38))

# [1.1.0](https://gitlab.com/nadir.gherbi1/mini-fp/compare/v1.0.6...v1.1.0) (2026-04-14)


### Features

* add static methods for EitherAsync creation and enhance bindAsync functionality ([0409c4e](https://gitlab.com/nadir.gherbi1/mini-fp/commit/0409c4ed8554f9a4a5313465dda899bcff02514a))

## [1.0.6](https://gitlab.com/nadir.gherbi1/mini-fp/compare/v1.0.5...v1.0.6) (2026-04-07)


### Bug Fixes

* update imports to fix broken build ([e256d83](https://gitlab.com/nadir.gherbi1/mini-fp/commit/e256d8337bfac84c06571bc4ce4ed37f372a4336))

## [1.0.5](https://gitlab.com/nadir.gherbi1/mini-fp/compare/v1.0.4...v1.0.5) (2026-04-07)


### Bug Fixes

* change the tsconfig to fix exports ([646b6c6](https://gitlab.com/nadir.gherbi1/mini-fp/commit/646b6c606c7d7b3f6226372ea921b39b0b94a7d3))

## [1.0.4](https://gitlab.com/nadir.gherbi1/mini-fp/compare/v1.0.3...v1.0.4) (2026-04-02)


### Bug Fixes

* add readme to the distribution folder ([1da4f78](https://gitlab.com/nadir.gherbi1/mini-fp/commit/1da4f78933a1e5b3e1863748353d9e3363771c68))

## [1.0.3](https://gitlab.com/nadir.gherbi1/mini-fp/compare/v1.0.2...v1.0.3) (2026-04-02)


### Bug Fixes

* trigger new release ([49d0dce](https://gitlab.com/nadir.gherbi1/mini-fp/commit/49d0dcefb5f7e4640f26d16f92567fd81917dbbd))

## [1.0.2](https://gitlab.com/nadir.gherbi1/mini-fp/compare/v1.0.1...v1.0.2) (2026-04-02)


### Bug Fixes

* update npm publishing pipeline ([bf5f574](https://gitlab.com/nadir.gherbi1/mini-fp/commit/bf5f5741a54f5a233e138a5d6645049aa6fcb832))

## [1.0.1](https://gitlab.com/nadir.gherbi1/mini-fp/compare/v1.0.0...v1.0.1) (2026-04-02)


### Bug Fixes

* release updated README ([6c83bde](https://gitlab.com/nadir.gherbi1/mini-fp/commit/6c83bdeeec457829c2ac705484776cc8dbab8f96))

# 1.0.0 (2026-04-02)


### Bug Fixes

* update gitlab yaml ([a3b0550](https://gitlab.com/nadir.gherbi1/mini-fp/commit/a3b055030f41d83ec7ed224b96211def310025d5))


### Features

* initial release ([d794ab6](https://gitlab.com/nadir.gherbi1/mini-fp/commit/d794ab6700b78b6e3d3a961cdd39806c0d278880))
