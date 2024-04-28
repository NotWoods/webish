/// <reference lib="webworker" />

import type {
  PromiseWorkerIncomingMessage,
  PromiseWorkerOutgoingMessage,
} from './protocol.ts';

function isPromiseWorkerIncomingMessage(
  message: unknown,
): message is PromiseWorkerIncomingMessage {
  return Array.isArray(message) && message.length === 2 &&
    typeof message[0] === 'number';
}

type PromisableWorkerScope = Pick<
  DedicatedWorkerGlobalScope | MessagePort,
  'onmessage' | 'postMessage'
>;

/**
 * Wraps an async function to reply to incoming messages from the main thread.
 * @param callback The async function to call when a message is received. The return value is sent back to the main thread.
 * @param workerScope The worker scope to listen for messages on.
 * This defaults to `self` in a worker scope, but is required in a non-worker scope (such as a MessagePort).
 */
export function registerPromiseWorker(
  callback: (message: unknown) => Promise<unknown>,
  workerScope: PromisableWorkerScope = self,
) {
  workerScope.onmessage = function onIncomingMessage(event) {
    const message: unknown = event.data;
    if (!isPromiseWorkerIncomingMessage(message)) {
      // Ignore, not a message we care about.
      return;
    }

    const [messageId, input] = message;
    // Using this as a workaround to catch any synchronous errors,
    // by ensuring the callback is wrapped in a Promise.then.
    Promise.resolve(input).then(callback).then(
      (output) => {
        workerScope.postMessage(
          [messageId, null, output] satisfies PromiseWorkerOutgoingMessage,
        );
      },
      (error) => {
        workerScope.postMessage(
          [messageId, error] satisfies PromiseWorkerOutgoingMessage,
        );
      },
    );
  };
}
