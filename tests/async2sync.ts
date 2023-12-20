/* eslint-disable no-console */
interface User {
    id: string;
}
const getUserInfo = (name: string) => {
    console.info('开始获取用户信息', name);
    return new Promise<User>((resolve) => {
        setTimeout(() => {
            console.info('获取用户信息成功');
            resolve({
                id: '1',
            });
        }, 1000);
    });
};

type AsyncFunction<R, P extends unknown[]> = (...args: P) => Promise<R>;
const run = <R, P extends unknown[]>(fn: AsyncFunction<R, P>) => {
    let task: Promise<void>, res: R;
    const proxy = (...args: P): R => {
        if (!task) {
            task = fn(...args).then((val) => {
                res = val;
            });
        }
        if (!res) {
            throw task;
        }
        return res;
    };
    return (...args: P) => {
        try {
            return proxy(...args);
        } catch (e) {
            if (e instanceof Promise) {
                //
                const reRun = () => {
                    proxy(...args);
                };
                e.then(reRun, reRun);
            } else {
                throw e;
            }
        }
    };
};

const runGetUserInfo = run<User, [string]>(getUserInfo);
const getId = () => {
    console.info('获取用户ID');
    return runGetUserInfo('test')?.id;
};
console.info(getId());
