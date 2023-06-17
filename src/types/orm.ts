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
export interface TableDefine {
    name: string;
    charset?: string;
    columns: Record<string, ColumnDefine>;
}
