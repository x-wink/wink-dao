import curdFlow from './cases/curd-flow';
import relaction from './cases/relaction';
import queryBuilder from './cases/query-builder';
(async () => {
    // await curdFlow();
    // await relaction();
    await queryBuilder();
    process.exit(0);
})();
