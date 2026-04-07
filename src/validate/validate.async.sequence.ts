import { Validate } from "./Validate.js";

export async function sequenceValidateAsync<L, R>(
    validates: Promise<Validate<L, R>[]>
): Promise<Validate<L, R[]>> {
    const results = [] as R[];
    const errors = [] as L[];

    (await validates).forEach((v) => {
        if (v.isValid()) results.push(v.unwrap());
        else {
            errors.push(...v.unwrapInvalid());
        }
    });

    return errors.length == 0 ? Validate.valid<L, R[]>(results) : Validate.invalid<L, R[]>(errors);
}