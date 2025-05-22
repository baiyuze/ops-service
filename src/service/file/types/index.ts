export interface Page {
  pageNum: number;
  pageSize: number;
  name?: string;
}

export interface CurrentHeaderType extends Headers {
  token: string;
}
