/**
 * 获取一个自增ID生成器
 * @example const autoId = useAutoIncrementId(); const id = autoId();
 */
export const useAutoIncrementId = () => {
    let id = 0;
    return () => ++id;
};
