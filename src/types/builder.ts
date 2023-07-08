export interface ConditionFunction {
    (): boolean;
}
export type ConditionKeyword = 'where' | 'on' | 'having' | '';
