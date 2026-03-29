export declare const brandSymbol: unique symbol;

export type Brand<TValue, TName extends string> = TValue & {
  readonly [brandSymbol]: TName;
};
