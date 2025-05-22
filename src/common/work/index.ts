import { ThreadWorker } from 'poolifier';

import { cloneBranch } from '../utils/index.js';
import * as fs from 'fs-extra';
import * as path from 'path';
const slash = require('slash');

class RequestHandlerWorker extends ThreadWorker<any, any> {
  public constructor() {
    super({
      clone: (workerData) => {
        return RequestHandlerWorker.clone(
          workerData.gitUrl,
          workerData.currentPath,
        );
      },
    });
  }
  /**
   * 克隆代码
   * @param gitUrl
   * @param currentPath
   */
  private static readonly clone = (gitUrl: string, currentPath: string) => {
    cloneBranch(gitUrl, currentPath);
    const repoName = gitUrl.split('/').pop().replace('.git', '');
    const newPath = slash(path.resolve(currentPath, repoName, '.git'));
    if (!fs.existsSync(newPath) || fs.readdirSync(newPath).length === 0) {
      return new Error('克隆失败');
    }
    return '克隆成功';
  };
}

export const requestHandlerWorker = new RequestHandlerWorker();
