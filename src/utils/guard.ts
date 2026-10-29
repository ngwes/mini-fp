export type Guard<T, U> = [when: (value: T) => boolean, then: (value: T) => U];

export function pickGuard<T, U>(
    value: T,
    otherwise: (value: T) => U,
    guards: Guard<T, U>[],
): (value: T) => U {
    const match = guards.find(([when]) => when(value));
    return match ? match[1] : otherwise;
}
