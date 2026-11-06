/** Successful result containing a value. */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

/** Failed result containing an error value. */
export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

/** Discriminated union of successful and failed results. */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Constructs a successful result.
 * @param value - Value to include in the result.
 * @returns A result marked successful.
 */
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

/**
 * Constructs a failed result.
 * @param error - Error value to include in the result.
 * @returns A result marked unsuccessful.
 */
export const err = <E>(error: E): Err<E> => ({ error, ok: false });
