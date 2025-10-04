
export type Status = 'pending' | 'running' | 'success' | 'failed' | 'fixing';

export interface BuildStep {
  name: string;
  status: Status;
}

export interface FileContent {
  name:string;
  language: string;
  content: string;
}
