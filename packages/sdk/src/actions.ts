import type { ActionRef } from "./model.js";

export type TypedActionWithMap = Readonly<Partial<Record<string, string>>>;

export interface TypedActionStep<TWith extends TypedActionWithMap = TypedActionWithMap> {
  readonly uses: ActionRef;
  readonly with?: TWith;
}

export function typedActionStep<TWith extends TypedActionWithMap>(
  uses: ActionRef,
  withInputs: TWith
): TypedActionStep<TWith>;
export function typedActionStep(uses: ActionRef): TypedActionStep;
export function typedActionStep<TWith extends TypedActionWithMap>(
  uses: ActionRef,
  withInputs?: TWith
): TypedActionStep<TWith> {
  if (withInputs === undefined || Object.keys(withInputs).length === 0) {
    return { uses };
  }

  return { uses, with: withInputs };
}
