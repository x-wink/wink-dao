/* eslint-disable no-console */
import { userRepository, accountRepository } from '../repository';
import { init } from '../dao';
export default async () => {
    await init.run();

    await userRepository.select({});
    await accountRepository.select({});

    console.info('依赖关系流程全部测试通过\n----------\n');
};
