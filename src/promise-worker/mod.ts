import type {
  PromiseWorkerIncomingMessage,
  PromiseWorkerOutgoingMessage,
} from './protocol.ts';

let messageIds = 0;

interface Resolvers {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

function isPromiseWorkerOutgoingMessage(
  message: unknown,
): message is PromiseWorkerOutgoingMessage {
  return Array.isArray(message) && message.length >= 2 &&
    typeof message[0] === 'number';
}

type PromisableWorker = Worker | MessagePort;

/**
 * Make it easier to communicate with Web Workers, using Promises.
 * Post a message to a worker, get a message back as a Promise.
 *
 * Unlike https://github.com/nolanlawson/promise-worker, this implementation
 * supports transferrable objects, serializable objects like Dates, and is even tinier by using newer syntax.
 */
export class PromiseWorker {
  #worker: PromisableWorker;
  #resolvers = new Map<number, Resolvers>();

  constructor(worker: PromisableWorker) {
    this.#worker = worker;
    this.#worker.addEventListener('message', (event) => {
      const message: unknown = (event as MessageEvent).data;
      if (!isPromiseWorkerOutgoingMessage(message)) {
        // Ignore, not a message we care about.
        return;
      }

      const [messageId, error, data] = message;
      const resolvers = this.#resolvers.get(messageId);
      if (!resolvers) {
        // Ignore, no resolver for this message.
        return;
      }

      this.#resolvers.delete(messageId);
      if (error) {
        resolvers.reject(error);
      } else {
        resolvers.resolve(data);
      }
    });

    // If this is a MessagePort, start it.
    (this.#worker as Partial<MessagePort>).start?.();
  }

  postMessage(
    message: unknown,
    options?: StructuredSerializeOptions,
  ): Promise<unknown> {
    const messageId = messageIds++;
    const messageToSend: PromiseWorkerIncomingMessage = [messageId, message];

    return new Promise((resolve, reject) => {
      this.#resolvers.set(messageId, { resolve, reject });
      this.#worker.postMessage(messageToSend, options);
    });
  }
}
