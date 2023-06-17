import { ColumnType } from '../defs';

export interface ColumnDefine {
    type: ColumnType;
    autoIncrement?: boolean;
    length?: number | number[];
    required?: boolean;
    primary?: boolean;
    unique?: boolean;
    comment?: string;
    defaultValue?: string;
}
export type TableDefine = Record<string, ColumnDefine>;
