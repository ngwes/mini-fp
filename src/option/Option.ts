import { Either } from "../either/Either.js";
import { pickGuard } from "../utils/guard.js";
import type { Guard } from "../utils/guard.js";

export class OptionAsync<T> implements PromiseLike<Option<T>> {
    private constructor(private readonly promise: Promise<Option<T>>) {}

    static from<T>(promise: Promise<Option<T>>): OptionAsync<T> {
        return new OptionAsync(promise);
    }

    bindAsync<U>(fn: (value: T) => Promise<Option<U>>): OptionAsync<U>;
    bindAsync<U>(promise: Promise<Option<U>>): OptionAsync<U>;
    bindAsync<U>(
        fnOrPromise: ((value: T) => Promise<Option<U>>) | Promise<Option<U>>,
    ): OptionAsync<U> {
        if (fnOrPromise instanceof Promise) {
            return new OptionAsync<U>(
                this.promise.then(o =>
                    o.isNone() ? Promise.resolve(Option.none<U>()) : fnOrPromise,
                ),
            );
        }
        return new OptionAsync<U>(
            this.promise.then(o => {
                if (o.isSome()) return fnOrPromise(o.unwrap());
                return Promise.resolve(Option.none<U>());
            }),
        );
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

    static async fromAsync<T>(value: Promise<T> | null | undefined): Promise<Option<T>>{
        const promiseValue = await value;
        return promiseValue === null || promiseValue === undefined ?
             Option.none<T>() : Option.some<T>(promiseValue);
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

    async mapAsync<U>(fn: (value: T) => Promise<U>) : Promise<Option<U>>{
        return this.isSome()? Option.from(await fn(this.value!)): Option.none<U>();
    }

    bind<U>(fn: (value: T) => Option<U>) : Option<U>{
        return this.isSome()? fn(this.value!): Option.none<U>();
    }

    bindAsync<U>(fn: (value: T) => Promise<Option<U>>): OptionAsync<U>;
    bindAsync<U>(promise: Promise<Option<U>>): OptionAsync<U>;
    bindAsync<U>(
        fnOrPromise: ((value: T) => Promise<Option<U>>) | Promise<Option<U>>,
    ): OptionAsync<U> {
        if (fnOrPromise instanceof Promise) {
            if (this.isNone()) return OptionAsync.from(Promise.resolve(Option.none<U>()));
            return OptionAsync.from(fnOrPromise);
        }
        if (this.isSome()) return OptionAsync.from(fnOrPromise(this.value!));
        return OptionAsync.from(Promise.resolve(Option.none<U>()));
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

    bindNone(fn: () => Option<T>) : Option<T>{
        return this.isSome()? this : fn();
    }

    toEither<L>(left: L | (() => L)) : Either<L, T>{
        if(this.isSome())
            return Either.right<L, T>(this.value!);

        return Either.left<L, T>(typeof left === 'function' ? (left as (() => L))() : left);
    }

    guardMap<U>(otherwise: (value: T) => U, ...guards: Guard<T, U>[]) : Option<U>{
        return this.map(value => pickGuard(value, otherwise, guards)(value));
    }

    guardBind<U>(otherwise: (value: T) => Option<U>, ...guards: Guard<T, Option<U>>[]) : Option<U>{
        return this.bind(value => pickGuard(value, otherwise, guards)(value));
    }

    orElse(onNone: () => T) : T;
    orElse(defaultValue: T) : T;
    orElse(onNone: T | (() => T)) : T{
        if(this.isSome())
            return this.value!;

        if(typeof onNone === 'function')
            return (onNone as (() => T))();

        return onNone;
    }

    orElseAsync(onNone: () => Promise<T>) : Promise<T>;
    orElseAsync(defaultValue: Promise<T>) : Promise<T>;
    orElseAsync(onNone: Promise<T> | (() => Promise<T>)) : Promise<T>{
        if(this.isSome())
            return Promise.resolve(this.value!);

        if(typeof onNone === 'function')
            return (onNone as (() => Promise<T>))();

        return onNone;
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
