export type PromiseWorkerIncomingMessage = [id: number, input: unknown];

export type PromiseWorkerOutgoingMessage =
  | [id: number, error: unknown]
  | [id: number, error: null, output: unknown];
