
export interface Query {
    (db: any, collection: string):IQueyable
}
export interface IQueyableProject {
    (selector: any, ...args: any[]): IQueyable;
}
export interface IQueyable {
    project: IQueyableProject
}

declare module "n-qr" {
    export var query: Query
}