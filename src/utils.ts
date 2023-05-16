export const convertFieldName = (name: string) => {
    return name.replace(/[A-Z]/g, (sub, index) => {
        return (index ? '_' : '') + sub.toLowerCase();
    });
};
