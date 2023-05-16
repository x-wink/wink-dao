export class DaoError extends Error {
    constructor(err: string, ...args: unknown[]) {
        super('[DaoError] ' + err, ...args);
    }
}
