// import { cloneBranch } from '../utils';

// /**
//  * 克隆代码
//  * @param gitUrl
//  * @param currentPath
//  */
// export function cloneCode(gitUrl: string, currentPath: string) {
//   cloneBranch(gitUrl, currentPath);
// }

import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { availableParallelism, DynamicThreadPool } from 'poolifier';

import type { BodyPayload, WorkerData, WorkerResponse } from '../work/types.js';

const workerFile = resolve(__dirname, `../work/index.js`);

export const handlerPool = new DynamicThreadPool(
  1,
  availableParallelism(),
  workerFile,
  {
    enableTasksQueue: true,
    errorHandler: (e: Error) => {
      console.error('Thread worker error:', e);
    },
    tasksQueueOptions: {
      concurrency: 8,
    },
  },
);
