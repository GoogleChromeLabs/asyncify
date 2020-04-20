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

const { Module } = WebAssembly;

async function instantiateOffThread(module, imports = {}) {
  let importIds = {};
  let funcById = [];
  let transferables = [];

  for (let desc of Module.imports(module)) {
    let value = imports[desc.module][desc.name];
    let handled = false;
    switch (desc.kind) {
      case 'function': {
        if (typeof value === 'function') {
          handled = true;
          value = funcById.push(value) - 1;
        }
        break;
      }
      case 'global': {
        if (value instanceof WebAssembly.Global) {
          let innerValue = value.value;
          try {
            value.value = innerValue;
          } catch {
            // Only immutable values are supported.
            handled = true;
            value = innerValue;
          }
        } else {
          handled = typeof value === 'number' || typeof value === 'bigint';
        }
        break;
      }
      case 'memory': {
        if (value instanceof WebAssembly.Memory) {
          handled = true;
          let { buffer } = value;
          if (buffer instanceof ArrayBuffer) {
            value = buffer;
            transferables.push(buffer);
          }
        }
        break;
      }
    }
    if (!handled) {
      throw new TypeError(
        `Could not import ${desc.module}.${desc.name}: ${desc.kind}.`
      );
    }
    (importIds[desc.module] || (importIds[desc.module] = {}))[desc.name] = {
      kind: desc.kind,
      value
    };
  }

  let worker = new Worker('./worker.js');

  let sab = await new Promise((resolve, reject) => {
    worker.onmessage = e => resolve(e.data);
    worker.onerror = e => reject(e.error);
    worker.postMessage({ module, imports: importIds });
  });

  let statusFuncIdAndCount = new Int32Array(sab, 0, 3);
  let types = new Uint8Array(sab, 12, 1000);
  let f64 = new Float64Array(sab, 1016, 1000);
  let i64 = new BigInt64Array(sab, 9016, 1000);

  worker.onerror = null;

  worker.onmessage = async event => {
    if (event.data !== null) return;
    let func = funcById[statusFuncIdAndCount[1]];
    let args = new Array(statusFuncIdAndCount[2]);
    for (let i = 0; i < args.length; i++) {
      switch (types[i]) {
        case 0:
          args[i] = f64[i];
          break;
        case 1:
          args[i] = i64[i];
          break;
        default:
          throw new Error('unreachable');
      }
    }
    let result = await func(...args);
    switch (typeof result) {
      case 'undefined': {
        statusFuncIdAndCount[2] = 0;
        break;
      }
      case 'number': {
        statusFuncIdAndCount[2] = 1;
        types[0] = 0;
        f64[0] = result;
        break;
      }
      case 'bigint': {
        statusFuncIdAndCount[2] = 1;
        types[0] = 1;
        i64[0] = result;
        break;
      }
      default: {
        throw new Error(`Invalid return type of imported function.`);
      }
    }
    statusFuncIdAndCount[0] = 1;
    Atomics.notify(statusFuncIdAndCount, 0, 1);
  };

  let exports = Object.create(null);
  for (let [id, desc] of Module.exports(module).entries()) {
    if (desc.kind === 'function') {
      exports[desc.name] = (...args) =>
        new Promise((resolve, reject) => {
          worker.addEventListener('message', function handler({ data }) {
            if (data !== null) {
              worker.removeEventListener('message', handler);
              worker.onerror = null;
              resolve(data);
            }
          });
          worker.onerror = event => reject(event.error);
          worker.postMessage({ funcId: id, args });
        });
    } else {
      console.warn(
        `Exporting ${desc.name}: ${desc.kind} is currently not supported.`
      );
    }
  }
  return Object.create(Instance.prototype, {
    exports: {
      enumerable: true,
      value: exports
    }
  });
}

export class Instance {
  constructor() {
    throw new Error('Synchronous instantiation is not supported.');
  }
}

export async function instantiate(source, imports) {
  if (!(source instanceof Module)) {
    let module = await WebAssembly.compile(source);
    let instance = await instantiateOffThread(module, imports);
    return { module, instance };
  }
  return instantiateOffThread(source, imports);
}

export async function instantiateStreaming(source, imports) {
  let module = await WebAssembly.compileStreaming(source);
  let instance = await instantiateOffThread(module, imports);
  return { module, instance };
}
