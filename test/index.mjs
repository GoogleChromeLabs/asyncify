/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { promises as fsp } from 'fs';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import assert from 'assert';
import binaryen from 'binaryen';
import * as Asyncify from '../asyncify.mjs';

process.on('unhandledRejection', err => {
  throw err;
});

function getSimpleImportObject() {
  return {
    env: {
      memory: new WebAssembly.Memory({ initial: 16 }),
      get_time: Date.now,
      sleep: promisify(setTimeout)
    }
  };
}

async function runDelayedTest(name, path, importObject, callback) {
  console.group(name);

  const src = await fsp.readFile(
    fileURLToPath(`${import.meta.url}/../${path}`),
    'utf-8'
  );

  const binaryenModule = binaryen.parseText(src);
  binaryenModule.runPasses(['asyncify']);
  binaryenModule.optimize();

  const wasmContents = binaryenModule.emitBinary();

  const wasmModule = new WebAssembly.Module(wasmContents);
  await callback(() => new Asyncify.Instance(wasmModule, importObject).exports);

  console.log('Test passed.');

  console.groupEnd();
}

async function runTest(name, path, importObject, callback) {
  return runDelayedTest(name, path, importObject, getExports =>
    callback(getExports())
  );
}

async function simpleTestCb({ run, run2 }) {
  // Check that the export works as an asynchronous function.
  assert.strictEqual(await run(), 1);

  // Ensure that referential equality between exports is preserved for async wrappers.
  assert.strictEqual(run, run2);
}

(async () => {
  await runTest(
    'Exported memory',
    'mem-export.wat',
    getSimpleImportObject(),
    simpleTestCb
  );
  await runTest(
    'Imported memory',
    'mem-import.wat',
    getSimpleImportObject(),
    simpleTestCb
  );

  function proxyGet(getter) {
    return new Proxy(Object.create(null), {
      get: (_, name) => getter(name)
    });
  }

  {
    let realImportObject = getSimpleImportObject();

    await runTest(
      'Proxy-based imports',
      'mem-export.wat',
      proxyGet(moduleName =>
        proxyGet(importName => realImportObject[moduleName][importName])
      ),
      simpleTestCb
    );
  }

  {
    let savedCallback;

    await runTest(
      'Re-entrance',
      'callback.wat',
      {
        env: {
          async call_main(counter) {
            await Promise.resolve();
            await savedCallback(counter);
          }
        }
      },
      async ({ callback }) => {
        savedCallback = callback;
        await callback(10);
      }
    );
  }

  await runTest(
    'Error handling',
    'mem-export.wat',
    {
      env: {
        ...getSimpleImportObject().env,
        async sleep() {
          throw new Error('Expected error');
        }
      }
    },
    async ({ run }) => {
      for (let i = 0; i < 2; i++) {
        await assert.rejects(run, {
          name: 'Error',
          message: 'Expected error',
          stack: /:wasm-function\[2\]:/m
        });
      }
    }
  );

  await runDelayedTest(
    'Error handling for missing import module',
    'mem-export.wat',
    {},
    getExports =>
      assert.throws(getExports, {
        name: 'LinkError',
        message:
          'WebAssembly.Instance(): Import #0 module="env" function="get_time" error: function import requires a callable'
      })
  );
})();
