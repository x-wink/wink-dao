/* eslint-disable no-console */
import { userRepository, accountRepository } from '../repository';
export default async () => {
    await userRepository.init.run();
    await accountRepository.init.run();

    console.info('依赖关系流程全部测试通过\n----------\n');
};
