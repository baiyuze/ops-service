import { Worker } from 'worker_threads';
const WORKER_SIGTERM = 'WORKER-SIGTERM';
export class WorkMap {
  private workMap: Map<string | number, Worker> = new Map();
  private killMap: Record<number, string> = {};

  setKillMap(key) {
    this.killMap[key] = WORKER_SIGTERM;
  }

  checkKill(key) {
    return this.killMap[key] === WORKER_SIGTERM;
  }

  delKill(key) {
    this.killMap[key];
  }

  public getWork(key: string | number): Worker {
    return this.workMap.get(key);
  }

  public setWork(key: string | number, worker: Worker) {
    this.workMap.set(key, worker);
  }

  public deleteWork(key: string | number) {
    this.workMap.delete(key);
  }

  public getWorkMap() {
    return this.workMap;
  }
}
