import { Validate } from "./Validate";

export function sequenceValidate<L, R>(
  validates: Validate<L, R>[],
): Validate<L, R[]> {
  const results = [] as R[];
  const errors = [] as L[];

  validates.forEach((v) => {
    if (v.isValid()) results.push(v.unwrap());
    else {
      errors.push(...v.unwrapInvalid());
    }
  });

  return errors.length == 0 ?  Validate.valid<L, R[]>(results) :  Validate.invalid<L, R[]>(errors);
}
