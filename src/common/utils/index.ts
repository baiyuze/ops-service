const crypto = require('crypto');
const crossSpawn = require('cross-spawn');
const slash = require('slash');
import * as fs from 'fs-extra';
import * as path from 'path';
import { BuildService } from 'src/service/build/build.service';
import { QueueService } from 'src/service/queue/queue.service';
import { writeFile } from 'node:fs/promises';
import { WorkMap } from './workMap';
const workMap = new WorkMap();

interface Body {
  branch: string;
  variablesMap: Record<string, string>;
  environment: string;
}

export function sha256(v) {
  const sha256 = crypto.createHash('sha256');
  sha256.update(v);
  return sha256.digest('hex');
}
/**
 *
 * @param command
 * @param cwd
 * @param options
 * @returns
 */
export function spawn(command, cwd, options?: any) {
  const commandName = command.split(' ')[0];
  let args = command.split(' ').slice(1);
  const child = crossSpawn.sync(commandName, args, {
    stdio: 'inherit',
    cwd: slash(cwd),
    shell: true,
    ...options,
  });
  return child;
}

/**
 * 设置git全局账号密码
 * @param username git用户名
 * @param password git密码
 */
export function setGitCredentials(
  username: string,
  password: string,
  email: string,
) {
  try {
    spawn(`git config --global credential.helper store`, '/home');
    spawn(`git config --global user.name "${username}"`, '/home');
    spawn(`git config --global user.password "${password}"`, '/home');
    spawn(`git config --global user.email "${email}"`, '/home');
    console.log('设置git凭证成功');
  } catch (error) {
    console.error('设置git凭证失败:', error);
    throw new Error(error);
  }
}

export function pushCode(filesDir: string) {
  try {
    spawn('git add .', filesDir);
    spawn('git commit -m "feat:更新静态资源"', filesDir);
    spawn('git pull origin develop', filesDir);
    spawn('git push', filesDir);
    console.log(filesDir, 'filesDir');
  } catch (error) {
    console.error(error, 'filesDir');
    throw new Error(error);
  }
}

/**
 * 克隆分支
 * @param gitUrl
 * @param dir
 */
export function cloneBranch(gitUrl: string, dir: string) {
  spawn(`git clone ${gitUrl} --depth 1`, dir);
}

/**
 * 拉取分支
 * @param dir
 */
export function pullBranch(branch: string, dir: string) {
  spawn(`git pull origin ${branch}`, dir);
}

/**
 * 创建临时脚本文件
 * @param content 脚本内容
 * @param ext 文件扩展名
 * @returns 临时文件路径
 */
export function createTempScript(
  content: string,
  ext: string = '.sh',
  projectId: number,
): string {
  const tempDir = slash(
    path.resolve(`${process.env.NAMESPACE}/${projectId}`, '.temp'),
  );
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // 根据扩展名添加对应的脚本前缀，默认使用bash
  let scriptPrefix = '#!/bin/bash\n\n';
  if (ext.toLowerCase() === '.ps1') {
    // PowerShell脚本
    scriptPrefix = ''; // PowerShell不需要前缀
  } else if (ext.toLowerCase() === '.cmd' || ext.toLowerCase() === '.bat') {
    // Windows批处理脚本
    scriptPrefix = '@echo off\n\n';
  }
  const scriptContent = scriptPrefix + content;

  const tempFile = slash(path.join(tempDir, `script-${Date.now()}${ext}`));
  fs.writeFileSync(tempFile, scriptContent);
  fs.chmodSync(tempFile, '755');

  return tempFile;
}

/**
 * 脚本执行环境类型
 */
export type ScriptMode = 'ShellBash' | 'CMD' | 'PowerShell';

/**
 * 获取脚本文件扩展名
 * @param mode 脚本执行环境类型
 * @returns 对应的脚本扩展名
 */
export function getScriptExt(mode: string): string {
  switch (mode) {
    case 'ShellBash':
      return '.sh';
    case 'CMD':
      return '.cmd';
    case 'PowerShell':
      return '.ps1';
    default:
      return '.sh'; // 默认返回shell脚本扩展名
  }
}

export function deleteTempScript(scriptFile: string) {
  fs.unlinkSync(scriptFile);
}

export function deleteTempDir(dir: string) {
  try {
    // Use fs-extra's removeSync which can handle non-empty directories
    fs.removeSync(dir);
  } catch (error) {
    console.error('Failed to delete temp directory:', error);
    // Optionally throw or handle the error
  }
}

/**
 * 创建 worker 文件内容
 */
function createWorkerContent(
  scriptFile: string,
  namespaceDir: string,
  body: Body,
  projectId: number,
  buildLogName: string,
): string {
  return `
    const { spawn } = require('child_process');
    const { parentPort } = require('worker_threads');
    const fs = require('fs');
    
    // 在开始时清除现有日志文件
    const logPath = \`${process.env.NAMESPACE}/${projectId}/${buildLogName}\`;
    fs.writeFileSync(logPath, ''); // 清除文件
    
    // 为日志创建缓冲区
    let logBuffer = '';
    const LOG_BUFFER_SIZE = 10;
    
    // 通过缓冲保存日志的辅助函数
    const saveLog = (content) => {
      // 创建北京时间时间戳 (UTC+8)
      const date = new Date();
      date.setHours(date.getHours() + 8);
      const timestamp = date.toISOString();
      
      logBuffer += \`[\${timestamp}] \${content}\n\`;
      
      // Write to file when buffer exceeds size limit
      if (logBuffer.length >= LOG_BUFFER_SIZE) {
        const logPath = \`${process.env.NAMESPACE}/${projectId}/${buildLogName}\`;
        fs.appendFileSync(logPath, logBuffer);
        logBuffer = '';
      }
    };

    const child = spawn('bash', ['${scriptFile}'], {
      cwd: '${namespaceDir}',
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      env: {
        ...process.env,
        BRANCH: '${body.branch}',
        ENV_CONFIG: '${body.environment}',
        ...${body.variablesMap}
      }
    });

    child.stdout.on('data', (data) => {
      const output = data.toString();
      saveLog(output);
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      saveLog(output);
    });

    child.on('error', (error) => {
      saveLog(\`Error: \${error.message}\`);
      // 刷新剩余日志
      if (logBuffer) {
        const logPath = \`${process.env.NAMESPACE}/${projectId}/${buildLogName}\`;
        logBuffer += '\\n===脚本执行完毕===\\n';
        fs.appendFileSync(logPath, logBuffer);
      }
      parentPort.postMessage({ type: 'error', error: error.message });
    });

    child.on('exit', (code) => {
      // 刷新剩余日志 退出前
      if (logBuffer) {
        const logPath = \`${process.env.NAMESPACE}/${projectId}/${buildLogName}\`;
        logBuffer += '\\n===脚本执行完毕===\\n';
        fs.appendFileSync(logPath, logBuffer);
      }
      
      if (code === 0) {
        saveLog(\`Process completed successfully with code \${code}\`);
        saveLog('\\n===脚本执行完毕===\\n');
        parentPort.postMessage({ type: 'exit', code });
        process.exit(0);
      } else {
        saveLog(\`Process failed with code \${code}\`);
        saveLog('\\n===脚本执行失败===\\n');
        parentPort.postMessage({
          type: 'error',
          error: \`脚本执行失败 code: \${code}\`,
        });
        process.exit(1);
      }
    });
  `;
}

/**
 * 清理临时文件
 */
function cleanupTempFiles(
  scriptFile: string,
  workerFile: string,
  tempDir: string,
) {
  deleteTempScript(scriptFile);
  fs.unlinkSync(workerFile);
}

/**
 * 创建并设置 Worker
 */
function setupWorker(
  workerFile: string,
  scriptFile: string,
  tempDir: string,
  id: number, // 队列id
  queueService: QueueService,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const { Worker } = require('worker_threads');
    const worker = new Worker(workerFile);
    // 存储work
    workMap.setWork(id, worker);

    worker.on('error', async (err) => {
      console.error('进程执行失败:', err);
      await queueService.updateStatus(id, 3);
      workMap.deleteWork(id);

      try {
        cleanupTempFiles(scriptFile, workerFile, tempDir);
      } catch (error) {
        console.error(`${scriptFile}文件删除失败:`, error);
      }
      await queueService.updateRunning();
      reject(err);
    });

    worker.on('exit', async (code) => {
      // 更新打包状态
      //
      const check = workMap.checkKill(id);
      if (check) {
        // 构建终止
        await queueService.updateStatus(id, 4);
        workMap.delKill(id);
      } else {
        await queueService.updateStatus(id, 2);
      }
      workMap.deleteWork(id);
      try {
        cleanupTempFiles(scriptFile, workerFile, tempDir);
      } catch (error) {
        console.error(`${scriptFile}文件删除失败:`, error);
      }
      await queueService.updateRunning();
      if (code === 0) {
        resolve(true);
      }
    });
  });
}

/**
 * 执行临时脚本
 * @param scriptFile 脚本文件路径
 * @param projectId 项目ID
 */
export async function actionTempScript({
  params,
  queueService,
}: {
  params: {
    scriptFile: string;
    projectId: number;
    id: number;
    data: Body;
    queueId: number;
    buildLogName: string;
  };
  queueService: QueueService;
}) {
  const { scriptFile, projectId, id, data, queueId, buildLogName } = params;
  const tempDir = slash(
    path.resolve(`${process.env.NAMESPACE}/${projectId}/.temp`),
  );
  const namespaceDir = slash(
    path.resolve(`${process.env.NAMESPACE}/${projectId}`),
  );

  const logsDir = slash(path.resolve(`${process.env.NAMESPACE}/logs`));
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const workerFile = slash(path.join(tempDir, `worker-${Date.now()}.js`));
  const workerContent = createWorkerContent(
    scriptFile,
    namespaceDir,
    data,
    projectId,
    buildLogName,
  );
  await fs.ensureDir(tempDir);
  await writeFile(workerFile, workerContent);
  return setupWorker(workerFile, scriptFile, tempDir, queueId, queueService);
}

export const buildStopWork = async (queueId: number) => {
  const worker = workMap.getWork(queueId);
  if (worker) {
    try {
      // 设置当前work为杀死标记
      workMap.setKillMap(queueId);
      await worker.terminate();
      workMap.deleteWork(queueId);
      return true;
    } catch (error) {
      console.log(error, 'error');
      return false;
    }
  }
  return false;
};
