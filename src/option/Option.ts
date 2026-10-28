import { Either } from "../either/Either.js";
import { EitherAsync } from "../either/EitherAsync.js";
import { pickGuard } from "../utils/guard.js";
import type { Guard } from "../utils/guard.js";

export class OptionAsync<T> implements PromiseLike<Option<T>> {
    private constructor(private readonly promise: Promise<Option<T>>) {}

    static from<T>(promise: PromiseLike<Option<T>>): OptionAsync<T> {
        return new OptionAsync(Promise.resolve(promise));
    }

    static some<T>(value: T): OptionAsync<T> {
        return OptionAsync.from(Promise.resolve(Option.some(value)));
    }

    static none<T>(): OptionAsync<T> {
        return OptionAsync.from(Promise.resolve(Option.none<T>()));
    }

    map<U>(fn: (value: T) => U): OptionAsync<U> {
        return OptionAsync.from(this.promise.then(o => o.map(fn)));
    }

    mapAsync<U>(fn: (value: T) => PromiseLike<U>): OptionAsync<U> {
        return OptionAsync.from(this.promise.then(o => o.mapAsync(fn)));
    }

    bind<U>(fn: (value: T) => Option<U>): OptionAsync<U> {
        return OptionAsync.from(this.promise.then(o => o.bind(fn)));
    }

    bindAsync<U>(fn: (value: T) => PromiseLike<Option<U>>): OptionAsync<U>;
    bindAsync<U>(promise: PromiseLike<Option<U>>): OptionAsync<U>;
    bindAsync<U>(
        fnOrPromise: ((value: T) => PromiseLike<Option<U>>) | PromiseLike<Option<U>>,
    ): OptionAsync<U> {
        return OptionAsync.from(this.promise.then(o =>
            typeof fnOrPromise === "function" ? o.bindAsync(fnOrPromise) : o.bindAsync(fnOrPromise),
        ));
    }

    filter(predicate: (value: T) => boolean): OptionAsync<T> {
        return OptionAsync.from(this.promise.then(o => o.filter(predicate)));
    }

    onSome(action: (value: T) => void): OptionAsync<T> {
        return OptionAsync.from(this.promise.then(o => o.onSome(action)));
    }

    onNone(action: () => void): OptionAsync<T> {
        return OptionAsync.from(this.promise.then(o => o.onNone(action)));
    }

    mapNone(fn: () => T): OptionAsync<T> {
        return OptionAsync.from(this.promise.then(o => o.mapNone(fn)));
    }

    mapNoneAsync(fn: () => PromiseLike<T>): OptionAsync<T> {
        return OptionAsync.from(this.promise.then(o => o.mapNoneAsync(fn)));
    }

    bindNone(fn: () => Option<T>): OptionAsync<T> {
        return OptionAsync.from(this.promise.then(o => o.bindNone(fn)));
    }

    bindNoneAsync(fn: () => PromiseLike<Option<T>>): OptionAsync<T> {
        return OptionAsync.from(this.promise.then(o => o.bindNoneAsync(fn)));
    }

    guardMap<U>(otherwise: (value: T) => U, ...guards: Guard<T, U>[]): OptionAsync<U> {
        return OptionAsync.from(this.promise.then(o => o.guardMap(otherwise, ...guards)));
    }

    guardMapAsync<U>(otherwise: (value: T) => PromiseLike<U>, ...guards: Guard<T, PromiseLike<U>>[]): OptionAsync<U> {
        return OptionAsync.from(this.promise.then(o => o.guardMapAsync(otherwise, ...guards)));
    }

    guardBind<U>(otherwise: (value: T) => Option<U>, ...guards: Guard<T, Option<U>>[]): OptionAsync<U> {
        return OptionAsync.from(this.promise.then(o => o.guardBind(otherwise, ...guards)));
    }

    guardBindAsync<U>(
        otherwise: (value: T) => PromiseLike<Option<U>>,
        ...guards: Guard<T, PromiseLike<Option<U>>>[]
    ): OptionAsync<U> {
        return OptionAsync.from(this.promise.then(o => o.guardBindAsync(otherwise, ...guards)));
    }

    toEither<L>(left: L | (() => L)): EitherAsync<L, T> {
        return EitherAsync.from(this.promise.then(o => o.toEither(left)));
    }

    match<U>(onSome: (value: T) => U, onNone: () => U): Promise<U> {
        return this.promise.then(o => o.match(onSome, onNone));
    }

    matchAsync<U>(onSome: (value: T) => U | PromiseLike<U>, onNone: () => U | PromiseLike<U>): Promise<U> {
        return this.promise.then(o => o.matchAsync(onSome, onNone));
    }

    orElse(fallback: T | (() => T)): Promise<T> {
        return this.promise.then(o => o.orElse(fallback));
    }

    orElseAsync(fallback: PromiseLike<T> | (() => PromiseLike<T>)): Promise<T> {
        return this.promise.then(o => o.orElseAsync(fallback));
    }

    then<TResult1 = Option<T>, TResult2 = never>(
        onfulfilled?: ((value: Option<T>) => TResult1 | PromiseLike<TResult1>) | null | undefined,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined,
    ): PromiseLike<TResult1 | TResult2> {
        return this.promise.then(onfulfilled, onrejected);
    }
}

export class Option<T>{

    private constructor(private readonly value: T | null | undefined){}

    static some<T>(value: T): Option<T>{
        if(value === null || value == undefined)
            throw new Error("Cannot create Some with null or undefined");

        return new Option(value);
    }

    static none<T>() : Option<T>{
        return new Option<T>(undefined);
    }

    static fromAsync<T>(value: PromiseLike<T | null | undefined> | null | undefined): OptionAsync<T>{
        return OptionAsync.from(Promise.resolve(value).then(v => Option.from<T>(v)));
    }

    unwrap(): T{
        if(this.value === null || this.value === undefined)
         throw new Error("Invalid state of the object");

        return this.value;
    }

    isSome() : boolean{
        return this.value === null || this.value === undefined ?
            false:true;
    }

    isNone() : boolean{
        return !this.isSome();
    }

    map<U>(fn: (value: T) => U) : Option<U>{
        return this.isSome()? Option.from(fn(this.value!)): Option.none<U>();
    }

    mapAsync<U>(fn: (value: T) => PromiseLike<U>) : OptionAsync<U>{
        return this.bindAsync(async value => Option.from<U>(await fn(value)));
    }

    bind<U>(fn: (value: T) => Option<U>) : Option<U>{
        return this.isSome()? fn(this.value!): Option.none<U>();
    }

    bindAsync<U>(fn: (value: T) => PromiseLike<Option<U>>): OptionAsync<U>;
    bindAsync<U>(promise: PromiseLike<Option<U>>): OptionAsync<U>;
    bindAsync<U>(
        fnOrPromise: ((value: T) => PromiseLike<Option<U>>) | PromiseLike<Option<U>>,
    ): OptionAsync<U> {
        if (this.isNone()) return OptionAsync.none<U>();
        const fn = typeof fnOrPromise === "function" ? fnOrPromise : () => fnOrPromise;
        return OptionAsync.from((async () => fn(this.value!))());
    }

    match<U>(onSome: (value: T) => U,
             onNone: () => U) : U{
        return this.isSome()? onSome(this.value!) : onNone();
    }

    async matchAsync<U>(
        onSome: (value: T) => U | PromiseLike<U>,
        onNone: () => U | PromiseLike<U>) : Promise<U>{
        return this.isSome()? onSome(this.value!) : onNone();
    }

    filter(predicate: (value: T) => boolean) : Option<T>{
        return this.isSome() && predicate(this.value!)? this : Option.none<T>();
    }

    onSome(action: (value: T) => void) : Option<T>{
        if(this.isSome()) action(this.value!);
        return this;
    }

    onNone(action: () => void) : Option<T>{
        if(this.isNone()) action();
        return this;
    }

    mapNone(fn: () => T) : Option<T>{
        return this.isSome()? this : Option.from(fn());
    }

    mapNoneAsync(fn: () => PromiseLike<T>) : OptionAsync<T>{
        return this.bindNoneAsync(async () => Option.from<T>(await fn()));
    }

    bindNone(fn: () => Option<T>) : Option<T>{
        return this.isSome()? this : fn();
    }

    bindNoneAsync(fn: () => PromiseLike<Option<T>>) : OptionAsync<T>{
        return OptionAsync.from((async () => this.isSome()? this : fn())());
    }

    toEither<L>(left: L | (() => L)) : Either<L, T>{
        if(this.isSome())
            return Either.right<L, T>(this.value!);

        return Either.left<L, T>(typeof left === 'function' ? (left as (() => L))() : left);
    }

    guardMap<U>(otherwise: (value: T) => U, ...guards: Guard<T, U>[]) : Option<U>{
        return this.map(value => pickGuard(value, otherwise, guards)(value));
    }

    guardMapAsync<U>(otherwise: (value: T) => PromiseLike<U>, ...guards: Guard<T, PromiseLike<U>>[]) : OptionAsync<U>{
        return this.mapAsync(value => pickGuard(value, otherwise, guards)(value));
    }

    guardBind<U>(otherwise: (value: T) => Option<U>, ...guards: Guard<T, Option<U>>[]) : Option<U>{
        return this.bind(value => pickGuard(value, otherwise, guards)(value));
    }

    guardBindAsync<U>(
        otherwise: (value: T) => PromiseLike<Option<U>>,
        ...guards: Guard<T, PromiseLike<Option<U>>>[]) : OptionAsync<U>{
        return this.bindAsync(value => pickGuard(value, otherwise, guards)(value));
    }

    orElse(onNone: T | (() => T)) : T{
        if(this.isSome())
            return this.value!;

        if(typeof onNone === 'function')
            return (onNone as (() => T))();

        return onNone;
    }

    async orElseAsync(onNone: PromiseLike<T> | (() => PromiseLike<T>)) : Promise<T>{
        if(this.isSome())
            return this.value!;

        return typeof onNone === 'function' ? onNone() : onNone;
    }

    static from<T>(value: T, noneWhen: (value: T) => boolean): Option<T>
    static from<T>(value: T | null | undefined): Option<T>
    static from<T>(value: T | null | undefined, noneWhen?: (value: T) => boolean): Option<T> {
        if(value === null || value === undefined )
            return Option.none<T>();
        if (noneWhen) 
            {
                let result:Option<T>;
                if(noneWhen(value as T)) 
                    result =  Option.none<T>()
                else
                    result = Option.some<T>(value as T);
                return result;
            }
        return Option.some<T>(value);
    }
}
