export interface BodyPayload {
  number?: number;
}

export interface WorkerData<T = unknown> {
  body: T;
}

export interface WorkerResponse<T = unknown> {
  body: T;
}

export interface CloneCodePayload {
  gitUrl: string;
  currentPath: string;
}
