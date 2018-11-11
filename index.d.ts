
export declare interface ILookupPipeline {
    from: string;
    let?: any;
    pipeline: IQueryable,
    alias: string
}
export declare interface IBucketParam {
    groupBy: string | any;
    boundaries: any[];
    default?: any;
    output?: string;
}
export declare interface IBucketAuto {
    groupBy: string | any;
    buckets: any[];
    output?: string;
}
export declare interface IGroupParam {
    _id: any,
    [key: string]: any
}
export declare interface IFacetParam {
    [key: string]: IQueryable
}
export declare interface IEntity {
    insert(data: any): IEntity;
    update(data: any): IEntity;
    pull(expr: string, ...params: any[]): IEntity;
    push(data: any): IEntity;
    pullAll(data: any): IEntity;
    delete(): any;
    pop(data: any): IEntity;
    mul(data: any): IEntity;
    inc(data: any): IEntity;
    rename(data: any): IEntity;
    unset(fields: any): IEntity;
    set(data: any): IEntity;
    items<T>(): Array<T>;
    item<T>(): T;
    items(): any[];
    item(): any;
    commit(): any;
}
export declare interface IIndexConfigFields {
    [key: string]: number;
}
export declare interface IIndexConfigOptionsCollation {
    locale: string;
    strength: number;
}
export declare interface IIndexConfigOptions {
    collation?: IIndexConfigOptionsCollation;
    unique?: boolean;
    partialFilterExpression?: any;
    sparse?: boolean;
}
export enum BSONTypes {
    ObjectId = "objectId",
    Boolean = "bool",
    Date = "date",
    Null = "null",
    RegularExpression = "regex",
    Int32 = "int",
    Timestamp = "timestamp",
    Int64 = "long",
    Decimal = "decimal",
    MinKey = "minKey",
    MaxKey = "maxKey",
    String = "string",
    Array = "array",
    Object = "object"
}
export enum FieldTypes {
    ObjectId = "objectId",
    Boolean = "bool",
    Date = "date",
    Null = "null",
    RegularExpression = "regex",
    Int32 = "int",
    Timestamp = "timestamp",
    Int64 = "long",
    Decimal = "decimal",
    MinKey = "minKey",
    MaxKey = "maxKey",
    String = "string",
    Array = "array",
    Object = "object"
}
export interface IFieldObject {
    bsonType: BSONTypes;
    required?: string[];
    items?: IProperty
}
export interface IProperty {
    required?: string[];
    properties: IMongoValidatorField;
}
export interface IMongoValidatorField {
    [x: string]: IFieldObject
}
export interface IMongoValidatorFields {
    required?: Array<string>
    properties: IMongoValidatorField
}

export interface IIndexConfig {
    fields: IIndexConfigFields;
    options?: IIndexConfigOptions;
}
export interface IQueryable {
    project(selecttors: any, ...params: any[]): IQueryable;
    match(expr, ...params: any[]): IQueryable;
    sort(data: any): IQueryable;
    unwind(fields: string): IQueryable;
    lookup(from: string, localField: string, foreignField: string, alias: string): IQueryable
    lookup(config: ILookupPipeline, ...params: any[]): IQueryable;
    replaceRoot(field: string): IQueryable;
    replaceRoot(selectors: any, ...params: any[]): IQueryable;
    where(expr, ...args: any[]): IEntity;
    insert(data: any): IEntity;
    update(data: any): IEntity;
    pull(expr: string, ...params: any[]): IEntity;
    push(data: any): IEntity;
    pullAll(data: any): IEntity;
    pop(data: any): IEntity;
    mul(data: any): IEntity;
    inc(data: any): IEntity;
    rename(data: any): IEntity;
    unset(fields: any): IEntity;
    set(data: any): IEntity;
    items<T>(): Array<T>;
    item<T>(): T;
    items(): any[];
    item(): any;
    stages(...args: any[]): IQueryable;
    addFields(selector: any, ...params: any[]): IQueryable;
    limit(num: Number): IQueryable;
    skip(number): IQueryable;
    count(field?: string): IQueryable;
    sortByCount(expr: any, ...params: any[]): IQueryable;
    bucket(config: IBucketParam, ...params: any[]): IQueryable;
    bucketAuto(config: IBucketAuto, ...params: any[]): IQueryable;
    facet(...args: IFacetParam[]): IQueryable;
    group(config: IGroupParam, ...params: any[]): IQueryable;
    out(collectionName: string): IQueryable;
    redact(expr: string, ...params: any[]): IQueryable;
    createView(name: string): void;
    pipeline: any[];
    parse: (data: any) => any
}

export declare function query(db?: any, collectionName?: string): IQueryable;

export declare function model(collectionName: string, indexes: Array<IIndexConfig>, fields: IMongoValidatorFields);

