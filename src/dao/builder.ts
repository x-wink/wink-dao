import { joinSql, secureName } from '../utils';

export abstract class SqlBuilder {
    abstract toSql(): string;
}
export abstract class SqlBuilderWithValues extends SqlBuilder {
    abstract getValues(): unknown[];
}
export class Field implements SqlBuilder {
    private table?: string;
    private name: string;
    constructor(name = '*', table?: string) {
        this.name = name;
        this.table = table;
    }
    toSql(): string {
        return joinSql([secureName(this.table), secureName(this.name)], '.');
    }
}
export class Table implements SqlBuilder {
    private alias?: string;
    private name: string;
    constructor(name: string, alias?: string) {
        this.name = name;
        this.alias = alias;
    }
    toSql(): string {
        return joinSql([secureName(this.name), secureName(this.alias)], ' as ');
    }
}
export enum JoinTableType {
    PRIMARY = 'from',
    LEFT = 'left join',
    RIGHT = 'right join',
    INNER = 'inner join',
    FULL = 'full join',
}
export class JoinTable extends Table {
    private joinType: JoinTableType;
    private condition?: Condition;
    constructor(name: string, alias?: string, joinType = JoinTableType.INNER, condition?: Condition) {
        super(name, alias);
        this.joinType = joinType;
        this.condition = condition;
    }
    toSql(): string {
        return joinSql(
            [
                this.joinType,
                super.toSql(),
                this.joinType !== JoinTableType.PRIMARY && this.condition
                    ? joinSql(['on', this.condition.toSql()], false)
                    : '',
            ],
            false
        );
    }
}
// TODO 支持单字符模糊匹配
export enum ConditionOperator {
    Equal = '=',
    NotEqual = '<>',
    GreaterThan = '>',
    GreaterThanOrEqual = '>=',
    LessThan = '<',
    LessThanOrEqual = '<=',
    Like = 'like',
    StartsWith = 'like',
    EndsWith = 'like',
    In = 'in',
    NotIn = 'not in',
    IsNull = 'is null',
    IsNotNull = 'is not null',
    Between = 'between',
    NotBetween = 'not between',
}
export enum LogicOperator {
    And = 'and',
    Or = 'or',
}
export class ConditionItem implements SqlBuilderWithValues {
    private field: Field;
    private operator: ConditionOperator;
    private value: unknown;
    constructor(field: Field, operator: ConditionOperator, value: unknown) {
        this.field = field;
        this.operator = operator;
        this.value = value;
    }
    toSql(): string {
        let placeholder = '',
            error: never;
        switch (this.operator) {
            case ConditionOperator.Equal:
            case ConditionOperator.NotEqual:
            case ConditionOperator.GreaterThan:
            case ConditionOperator.GreaterThanOrEqual:
            case ConditionOperator.LessThan:
            case ConditionOperator.LessThanOrEqual:
                placeholder = `?`;
                break;
            case ConditionOperator.IsNull:
            case ConditionOperator.IsNotNull:
                break;
            case ConditionOperator.StartsWith:
                placeholder = `?%`;
                break;
            case ConditionOperator.EndsWith:
                placeholder = `%?`;
                break;
            case ConditionOperator.Like:
                placeholder = `%?%`;
                break;
            case ConditionOperator.In:
            case ConditionOperator.NotIn:
                placeholder = `( ${joinSql(
                    this.getValues().map(() => '?'),
                    ', ',
                    false
                )} )`;
                break;
            case ConditionOperator.Between:
            case ConditionOperator.NotBetween:
                placeholder = `( ? and ? )`;
                break;
            default:
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                error = this.operator;
                break;
        }
        return joinSql([this.field.toSql(), this.operator, placeholder]);
    }
    getValues(): unknown[] {
        return this.value instanceof Array ? this.value : [this.value];
    }
}
export class Condition implements SqlBuilderWithValues {
    private children = [] as (ConditionItem | Condition)[];
    private logic: LogicOperator;
    constructor(logic: LogicOperator = LogicOperator.And) {
        this.logic = logic;
    }
    toSql(): string {
        return joinSql(
            this.children.map((item) => (item instanceof Condition ? `( ${item.toSql()} )` : item.toSql())),
            ` ${this.logic} `,
            false
        );
    }
    getValues(): unknown[] {
        return this.children.flatMap((item) => item.getValues());
    }
}
export class GroupBy implements SqlBuilderWithValues {
    private fields = [] as Field[];
    private condition?: Condition;
    toSql(): string {
        return joinSql(
            [
                'group by',
                joinSql(
                    this.fields.map((item) => item.toSql()),
                    ', ',
                    false
                ),
            ],
            false
        );
    }
    getValues(): unknown[] {
        return this.condition?.getValues() ?? [];
    }
}
export enum OrderSort {
    ASC = 'asc',
    DESC = 'desc',
}
export class OrderBy implements SqlBuilder {
    private field: Field;
    private sort: OrderSort;
    constructor(field: Field, sort: OrderSort = OrderSort.ASC) {
        this.field = field;
        this.sort = sort;
    }
    toSql(): string {
        return joinSql([this.field.toSql(), this.sort], false);
    }
}
export class Limit implements SqlBuilderWithValues {
    private start: number;
    private end: number;
    constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
    }
    static page(pageNo: number, pageSize: number) {
        const start = pageSize * (pageNo - 1),
            end = start + pageSize;
        return new Limit(start, end);
    }
    toSql(): string {
        return joinSql(['limit', '?,?'], false);
    }
    getValues(): unknown[] {
        return [this.start, this.end];
    }
}
export interface ConditionFunction {
    (): boolean;
}
export class SelectBuilder implements SqlBuilder {
    private fields = [] as Field[];
    select(field?: string, table?: string, condition?: ConditionFunction) {
        if (!condition || condition()) {
            this.fields.push(new Field(field, table));
        }
        return this;
    }
    toSql(): string {
        return joinSql(
            [
                'select',
                joinSql(
                    this.fields.map((item) => item.toSql()),
                    ', ',
                    false
                ),
            ],
            false
        );
    }
}
export class TableBuilder implements SqlBuilder {
    private tables = [] as JoinTable[];
    constructor(table: string, alias?: string) {
        this.from(table, alias);
    }
    private join(
        table: string,
        alias?: string,
        joinType?: JoinTableType,
        on?: Condition,
        condition?: ConditionFunction
    ) {
        if (!condition || condition()) {
            this.tables.push(new JoinTable(table, alias, joinType, on));
        }
        return this;
    }
    private from(table: string, alias?: string) {
        return this.join(table, alias, JoinTableType.PRIMARY);
    }
    innerJoin(table: string, alias?: string, on?: Condition, condition?: ConditionFunction) {
        return this.join(table, alias, JoinTableType.INNER, on, condition);
    }
    leftJoin(table: string, alias?: string, on?: Condition, condition?: ConditionFunction) {
        return this.join(table, alias, JoinTableType.LEFT, on, condition);
    }
    rightJoin(table: string, alias?: string, on?: Condition, condition?: ConditionFunction) {
        return this.join(table, alias, JoinTableType.RIGHT, on, condition);
    }
    fullJoin(table: string, alias?: string, on?: Condition, condition?: ConditionFunction) {
        return this.join(table, alias, JoinTableType.FULL, on, condition);
    }
    toSql(): string {
        return joinSql(
            this.tables.map((item) => item.toSql()),
            false
        );
    }
}
export class QueryBuilder implements SqlBuilderWithValues {
    private selectBuilder: SelectBuilder;
    private tableBuilder: TableBuilder;
    private conditions?: Condition;
    private groupBy?: GroupBy;
    private orderBy?: OrderBy[];
    private limit?: Limit;
    constructor(table: string) {
        this.selectBuilder = new SelectBuilder();
        this.tableBuilder = new TableBuilder(table);
    }
    // 代理SelectBuilder
    select(field?: string, table?: string, condition?: ConditionFunction) {
        this.selectBuilder.select(field, table, condition);
        return this;
    }
    // 代理TableBuilder
    innerJoin(table: string, alias?: string, on?: Condition, condition?: ConditionFunction) {
        this.tableBuilder.innerJoin(table, alias, on, condition);
        return this;
    }
    leftJoin(table: string, alias?: string, on?: Condition, condition?: ConditionFunction) {
        this.tableBuilder.leftJoin(table, alias, on, condition);
        return this;
    }
    rightJoin(table: string, alias?: string, on?: Condition, condition?: ConditionFunction) {
        this.tableBuilder.rightJoin(table, alias, on, condition);
        return this;
    }
    fullJoin(table: string, alias?: string, on?: Condition, condition?: ConditionFunction) {
        this.tableBuilder.fullJoin(table, alias, on, condition);
        return this;
    }
    // 实现SqlBuilderWithValues
    toSql(): string {
        return [this.selectBuilder.toSql(), this.tableBuilder.toSql()].filter(Boolean).join(' ');
    }
    getValues(): unknown[] {
        return [];
    }
}
