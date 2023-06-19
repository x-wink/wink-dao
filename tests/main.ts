import curdFlow from './cases/curd-flow';
import relaction from './cases/relaction';
(async () => {
    await curdFlow();
    await relaction();
    process.exit(0);
})();
