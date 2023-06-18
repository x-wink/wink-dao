/**
 * 创建一个异步初始化函数，多次调用只会执行一次
 * @example const init = createInitFunc(async () => { ... }); await init.run();
 */
export const createAsyncInitFunc = <T>(fn: () => Promise<T>) => {
    let done = false,
        task: Promise<T> | undefined,
        res: T;
    return {
        isDone: () => done,
        run: async (): Promise<T> => {
            if (!done) {
                if (!task) {
                    task = fn();
                    res = await task;
                    done = true;
                } else {
                    await task;
                }
            }
            return res;
        },
    };
};
