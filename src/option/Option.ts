export class Option<T>{

    private constructor(private readonly value: T | null | undefined){}

    static Some<T>(value: T): Option<T>{
        if(value === null || value == undefined)
            throw new Error("Cannot create Some with null or undefined");

        return new Option(value);
    }

    static None<T>() : Option<T>{
        return new Option<T>(undefined);
    }

    static From<T>(value: T | null | undefined): Option<T>{
        return value === null || value === undefined ?
             Option.None<T>() : Option.Some<T>(value);
    }

    static async FromAsync<T>(value: Promise<T> | null | undefined): Promise<Option<T>>{
        const promiseValue = await value;
        return promiseValue === null || promiseValue === undefined ?
             Option.None<T>() : Option.Some<T>(promiseValue);
    }

    Unwrap(): T{
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
        return this.isSome()? Option.From(fn(this.value!)): Option.None<U>();
    }

    async mapAsync<U>(fn: (value: T) => Promise<U>) : Promise<Option<U>>{
        return this.isSome()? Option.From(await fn(this.value!)): Option.None<U>();
    }

    bind<U>(fn: (value: T) => Option<U>) : Option<U>{
        return this.isSome()? fn(this.value!): Option.None<U>();
    }

    async bindAsync<U>(fn: (value: T) => Promise<Option<U>>) : Promise<Option<U>>{
        return this.isSome()? await fn(this.value!): Option.None<U>();
    }

    match<U>(onSome: (value: T) => U,
             onNone: () => U) : U{
        return this.isSome()? onSome(this.value!) : onNone();
    }

    matchAsync<U>(
        onSome: (value: T) => Promise<U>,
        onNone: () => Promise<U>) : Promise<U>{
        return this.isSome()? onSome(this.value!) : onNone();
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
}