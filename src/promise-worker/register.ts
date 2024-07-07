/// <reference lib="webworker" />

import type {
  PromiseWorkerIncomingMessage,
  PromiseWorkerOutgoingMessage,
} from './protocol.ts';

declare const self: DedicatedWorkerGlobalScope;

const TRANSFERRABLE = Symbol('Transferrable');
type TransferrableResult = {
  [TRANSFERRABLE]: [unknown, StructuredSerializeOptions];
};

function isPromiseWorkerIncomingMessage(
  message: unknown,
): message is PromiseWorkerIncomingMessage {
  return Array.isArray(message) && message.length === 2 &&
    typeof message[0] === 'number';
}

function isTransferrableResult(
  value: unknown,
): value is TransferrableResult {
  return typeof value === 'object' && value !== null && TRANSFERRABLE in value;
}

/**
 * Wraps an async function to reply to incoming messages from the main thread.
 * @param callback The async function to call when a message is received. The return value is sent back to the main thread.
 * @param workerScope The worker scope to listen for messages on.
 * This defaults to `self` in a worker scope, but is required in a non-worker scope (such as a MessagePort).
 */
export function registerPromiseWorker(
  callback: (message: unknown) => Promise<unknown>,
  workerScope: DedicatedWorkerGlobalScope | MessagePort = self,
) {
  workerScope.addEventListener('message', function onIncomingMessage(event) {
    const message: unknown = (event as MessageEvent).data;
    if (!isPromiseWorkerIncomingMessage(message)) {
      // Ignore, not a message we care about.
      return;
    }

    const [messageId, input] = message;
    // Using this as a workaround to catch any synchronous errors,
    // by ensuring the callback is wrapped in a Promise.then.
    Promise.resolve(input).then(callback).then(
      (output) => {
        let message: unknown;
        let options: StructuredSerializeOptions | undefined;
        if (isTransferrableResult(output)) {
          message = output[TRANSFERRABLE][0];
          options = output[TRANSFERRABLE][1];
        } else {
          message = output;
        }
        workerScope.postMessage(
          [messageId, null, message] satisfies PromiseWorkerOutgoingMessage,
          options,
        );
      },
      (error) => {
        workerScope.postMessage(
          [messageId, error] satisfies PromiseWorkerOutgoingMessage,
        );
      },
    );
  });

  // If this is a MessagePort, start it.
  (workerScope as Partial<MessagePort>).start?.();
}

export function transferable(
  value: unknown,
  options: StructuredSerializeOptions,
): TransferrableResult {
  return { [TRANSFERRABLE]: [value, options] };
}
