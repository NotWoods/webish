// deno-lint-ignore-file require-await
import { assertEquals, assertInstanceOf, assertRejects } from '@std/assert';
import { PromiseWorker } from './mod.ts';
import { registerPromiseWorker, transferable } from './register.ts';

function getMessageChannel() {
  const channel = new MessageChannel();
  return {
    port1: channel.port1,
    port2: channel.port2,
    [Symbol.dispose]() {
      channel.port1.close();
      channel.port2.close();
    },
  };
}

async function echo(msg: unknown) {
  return msg;
}

Deno.test('PromiseWorker for MessageChannel sends a message back and forth', async () => {
  using channel = getMessageChannel();
  registerPromiseWorker(async function pong() {
    return 'pong';
  }, channel.port2);

  const promiseWorker = new PromiseWorker(channel.port1);
  const result = await promiseWorker.postMessage('ping');
  assertEquals(result, 'pong');
});

Deno.test('PromiseWorker for MessageChannel echoes a message', async () => {
  using channel = getMessageChannel();
  registerPromiseWorker(echo, channel.port2);

  const promiseWorker = new PromiseWorker(channel.port1);
  const result = await promiseWorker.postMessage('ping');
  assertEquals(result, 'ping');
});

Deno.test('PromiseWorker for MessageChannel echoes a message multiple times', async () => {
  using channel = getMessageChannel();
  registerPromiseWorker(echo, channel.port2);

  const promiseWorker = new PromiseWorker(channel.port1);

  const words = [
    'foo',
    'bar',
    'baz',
    'quux',
    'toto',
    'bongo',
    'haha',
    'flim',
    'foob',
    'foobar',
    'bazzy',
    'fifi',
    'kiki',
  ];

  await Promise.all(words.map(async (word) => {
    const result = await promiseWorker.postMessage(word);
    assertEquals(result, word);
  }));
});

Deno.test('Can have two PromiseWorkers for MessageChannel', async () => {
  using channel = getMessageChannel();
  registerPromiseWorker(echo, channel.port2);

  const promiseWorker1 = new PromiseWorker(channel.port1);
  const promiseWorker2 = new PromiseWorker(channel.port1);

  const res1 = await promiseWorker1.postMessage('foo');
  assertEquals(res1, 'foo');
  const res2 = await promiseWorker2.postMessage('bar');
  assertEquals(res2, 'bar');
});

Deno.test('Can have multiple PromiseWorkers for MessageChannel', async () => {
  using channel = getMessageChannel();
  registerPromiseWorker(echo, channel.port2);

  const promiseWorkers = [
    new PromiseWorker(channel.port1),
    new PromiseWorker(channel.port1),
    new PromiseWorker(channel.port1),
    new PromiseWorker(channel.port1),
    new PromiseWorker(channel.port1),
  ];

  await Promise.all(promiseWorkers.map(async (promiseWorker, i) => {
    const res1 = await promiseWorker.postMessage(`foo${i}`);
    assertEquals(res1, `foo${i}`);
    const res2 = await promiseWorker.postMessage(`bar${i}`);
    assertEquals(res2, `bar${i}`);
  }));
});

Deno.test('PromiseWorkers for MessageChannel handles synchronous errors', async () => {
  using channel = getMessageChannel();
  registerPromiseWorker(function errorSync() {
    throw new Error('busted!');
  }, channel.port2);

  const promiseWorker = new PromiseWorker(channel.port1);

  const error = await assertRejects(
    () => promiseWorker.postMessage('foo'),
    'busted',
  );
  assertInstanceOf(error, Error);
});

Deno.test('PromiseWorkers for MessageChannel handles asynchronous errors', async () => {
  using channel = getMessageChannel();
  registerPromiseWorker(function errorAsync() {
    return Promise.reject(new Error('busted!'));
  }, channel.port2);

  const promiseWorker = new PromiseWorker(channel.port1);

  const error = await assertRejects(
    () => promiseWorker.postMessage('foo'),
    'busted',
  );
  assertInstanceOf(error, Error);
});

Deno.test('PromiseWorkers for MessageChannel allows custom additional behavior', async () => {
  using channel = getMessageChannel();
  registerPromiseWorker(echo, channel.port2);
  channel.port2.addEventListener('message', function (event) {
    if (!Array.isArray(event.data)) { // custom message, not from promise-worker
      this.postMessage(event.data);
    }
  });

  const promiseWorker = new PromiseWorker(channel.port1);

  const promise1 = promiseWorker.postMessage('ping');
  const promise2 = new Promise((resolve, reject) => {
    const abortController = new AbortController();
    function onMessage(e: MessageEvent) {
      if (!Array.isArray(e.data)) { // custom message, not from promise-worker
        abortController.abort();
        resolve(e.data);
      }
    }
    function onError(e: Event) {
      abortController.abort();
      reject(e);
    }
    channel.port1.addEventListener('error', onError, {
      signal: abortController.signal,
    });
    channel.port1.addEventListener('message', onMessage, {
      signal: abortController.signal,
    });
    channel.port1.postMessage({ hello: 'world' });
  });

  const result = await promise2;
  assertEquals(result, { hello: 'world' });
  await promise1;
});

Deno.test('PromiseWorker for MessageChannel transfers data', async () => {
  let receivedMessage: unknown;

  using channel = getMessageChannel();
  registerPromiseWorker(async function pong(msg) {
    receivedMessage = msg;
    return 'pong';
  }, channel.port2);

  const promiseWorker = new PromiseWorker(channel.port1);

  // Create an 8MB "file" and fill it. 8MB = 1024 * 1024 * 8 B
  const uInt8Array = new Uint8Array(1024 * 1024 * 8).map((_, i) => i);

  assertEquals(uInt8Array.byteLength, 8_388_608);
  const result = promiseWorker.postMessage(uInt8Array, {
    transfer: [uInt8Array.buffer],
  });
  assertEquals(uInt8Array.byteLength, 0); // Transferred successfully.
  assertEquals(await result, 'pong');
  assertInstanceOf(receivedMessage, Uint8Array);
});

Deno.test('PromiseWorker for MessageChannel transfers data back and forth', async () => {
  using channel = getMessageChannel();
  registerPromiseWorker(async function echoTransferrable(msg) {
    const uInt8Array = msg as Uint8Array;
    return transferable(uInt8Array, { transfer: [uInt8Array.buffer] });
  }, channel.port2);

  const promiseWorker = new PromiseWorker(channel.port1);

  // Create an 8MB "file" and fill it. 8MB = 1024 * 1024 * 8 B
  const uInt8Array = new Uint8Array(1024 * 1024 * 8).map((_, i) => i);

  assertEquals(uInt8Array.byteLength, 8_388_608);
  const promise = promiseWorker.postMessage(uInt8Array, {
    transfer: [uInt8Array.buffer],
  });
  assertEquals(uInt8Array.byteLength, 0); // Transferred successfully.

  const result = await promise;
  assertInstanceOf(result, Uint8Array);
  assertEquals(result.byteLength, 8_388_608);
});
