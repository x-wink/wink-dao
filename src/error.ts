export class DaoError extends Error {
    constructor(err: string, cause?: unknown) {
        super('[DaoError] ' + err);
        this.cause = cause;
    }
}
