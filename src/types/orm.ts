import { ColumnType } from '../defs';

export interface ColumnDefine {
    name: string;
    type: ColumnType;
    autoIncrement?: boolean;
    length?: number | number[];
    required?: boolean;
    primary?: boolean;
    unique?: boolean;
    comment?: string;
    defaultValue?: string;
}
export interface TableDefine {
    name: string;
    charset?: string;
    columnDefines: ColumnDefine[];
}
