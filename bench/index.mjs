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

// import { promises as fsp } from 'fs';
// import { fileURLToPath } from 'url';
// import binaryen from 'binaryen';
// import * as Asyncify from '../asyncify.mjs';
import * as Asyncify from 'https://unpkg.com/asyncify-wasm@1.0.2/dist/asyncify.mjs';
// import { Worker } from 'worker_threads';

// process.on('unhandledRejection', err => {
//   throw err;
// });

function createImportObject() {
  let counter = 1000;
  let logged = false;

  return {
    env: {
      async sleep(timeout) {
        await new Promise(resolve => setTimeout(resolve, timeout));
        return counter--;
      }
    }
  };
}

async function instantiateOffThread(wasm, imports) {
  let importIds = {};
  let importById = [];

  for (let desc of WebAssembly.Module.imports(wasm)) {
    if (desc.kind === 'function') {
      (importIds[desc.module] || (importIds[desc.module] = {}))[desc.name] = importById.length;
      importById.push(imports[desc.module][desc.name]);
    } else {
      throw new TypeError(`${desc.kind} imports are not currently supported.`);
    }
  }

  let worker = new Worker('./worker.js');

  let sab = await new Promise((resolve, reject) => {
    worker.onmessage = e => resolve(e.data);
    worker.onerror = e => reject(e.error);
    worker.postMessage({ wasm, imports: importIds });
  });

  // 0 - Uninitialised.
  // 1 - Undefined.
  // 2 - Float64.
  // 3 - Int64.
  let resultType = new Int32Array(sab, 0, 1);
  let resultFloat64 = new Float64Array(sab, 8, 1);
  let resultInt64 = new BigInt64Array(sab, 8, 1);

  worker.onerror = null;

  worker.onmessage = async ({ data }) => {
    if (data.type === 'import') {
      let func = importById[data.funcId];
      let result = await func(...data.args);
      switch (typeof result) {
        case 'undefined': {
          resultType[0] = 1;
          break;
        }
        case 'number': {
          resultType[0] = 2;
          resultFloat64[0] = result;
          break;
        }
        case 'bigint': {
          resultType[0] = 3;
          resultInt64[0] = result;
          break;
        }
        default: {
          throw new Error(`Invalid return type of imported function.`);
        }
      }
      Atomics.notify(resultType, 0, 1);
    }
  };

  let exports = {};
  for (let [id, desc] of WebAssembly.Module.exports(wasm).entries()) {
    if (desc.kind === 'function') {
      exports[desc.name] = (...args) => new Promise((resolve, reject) => {
        worker.addEventListener('message', function handler({ data }) {
          if (data.type === 'result') {
            worker.removeEventListener('message', handler);
            worker.onerror = null;
            resolve(data.result);
          }
        });
        worker.onerror = event => reject(event.error);
        worker.postMessage({ funcId: id, args });
      });
    }
  }
  return {
    exports
  };
}

(async function () {
  const src = await fetch(`${import.meta.url}/../bench.wat`).then(res => res.text());
  // const src = await fsp.readFile(
  //   fileURLToPath(`${import.meta.url}/../bench.wat`),
  //   'utf-8'
  // );

  const binaryenModule = binaryen.parseText(src);

  {
    const wasmContents = binaryenModule.emitBinary();
    console.log('Size without asyncify:', wasmContents.byteLength);
    console.time('Init without asyncify');
    const wasmModule = new WebAssembly.Module(wasmContents);
    const wasmInstance = await instantiateOffThread(wasmModule, createImportObject());
    console.timeEnd('Init without asyncify');
    const { start_loop } = wasmInstance.exports;
    console.time('Without asyncify');
    await start_loop();
    console.timeEnd('Without asyncify');
  }

  binaryenModule.runPasses(['asyncify']);
  binaryenModule.optimize();

  {
    const wasmContents = binaryenModule.emitBinary();
    console.log('Size with asyncify:', wasmContents.byteLength);
    console.time('Init with asyncify');
    const wasmModule = new WebAssembly.Module(wasmContents);
    const wasmInstance = await Asyncify.instantiate(wasmModule, createImportObject());
    console.timeEnd('Init with asyncify');
    const { start_loop } = wasmInstance.exports;
    console.time('With asyncify');
    await start_loop();
    console.timeEnd('With asyncify');
  }
})();
