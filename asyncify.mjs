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

const DATA_ADDR = 16;
const WRAPPED_EXPORTS = new WeakMap();

function isPromise(obj) {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
}

function proxyGet(obj, transform) {
  return new Proxy(obj, {
    get: (obj, name) => transform(obj[name])
  });
}

class Asyncify {
  constructor() {
    this.state = { type: 'Loading' };
    this.exports = null;
  }

  invalidState() {
    throw new Error(`Invalid async state ${this.state.type}`);
  }

  wrapImportFn(fn) {
    return (...args) => {
      switch (this.state.type) {
        case 'None': {
          let value = fn(...args);
          if (!isPromise(value)) {
            return value;
          }
          this.exports.asyncify_start_unwind(DATA_ADDR);
          this.state = {
            type: 'Unwinding',
            promise: value
          };
          return 0;
        }
        case 'Rewinding': {
          let { value } = this.state;
          this.state = { type: 'None' };
          this.exports.asyncify_stop_rewind();
          return value;
        }
        default:
          this.invalidState();
      }
    };
  }

  wrapModuleImports(module) {
    return proxyGet(module, value => {
      if (typeof value === 'function') {
        return this.wrapImportFn(value);
      }
      return value;
    });
  }

  wrapImports(imports) {
    if (imports === undefined) return;

    return proxyGet(imports, moduleImports =>
      this.wrapModuleImports(moduleImports)
    );
  }

  wrapExportFn(fn) {
    let newExport = WRAPPED_EXPORTS.get(fn);

    if (newExport !== undefined) {
      return newExport;
    }

    newExport = async (...args) => {
      if (this.state.type !== 'None') {
        this.invalidState();
      }

      let result = fn(...args);

      while (this.state.type === 'Unwinding') {
        let { promise } = this.state;
        this.state = { type: 'None' };
        this.exports.asyncify_stop_unwind();
        this.state = { type: 'Waiting' };
        let value;
        try {
          value = await promise;
        } finally {
          this.state = { type: 'None' };
        }
        this.exports.asyncify_start_rewind(DATA_ADDR);
        this.state = {
          type: 'Rewinding',
          value
        };
        result = fn();
      }

      if (this.state.type !== 'None') {
        this.invalidState();
      }

      return result;
    };

    WRAPPED_EXPORTS.set(fn, newExport);

    return newExport;
  }

  wrapExports(exports) {
    let newExports = Object.create(null);

    for (let exportName in exports) {
      let value = exports[exportName];
      if (typeof value === 'function' && !exportName.startsWith('asyncify_')) {
        value = this.wrapExportFn(value);
      }
      Object.defineProperty(newExports, exportName, {
        enumerable: true,
        value
      });
    }

    WRAPPED_EXPORTS.set(exports, newExports);

    return newExports;
  }

  init(instance, imports) {
    const { exports } = instance;

    const memory = exports.memory || (imports.env && imports.env.memory);

    const view = new Int32Array(memory.buffer, DATA_ADDR);
    view[0] = DATA_ADDR + 8;
    view[1] = 512;

    this.state = { type: 'None' };

    this.exports = this.wrapExports(exports);

    Object.setPrototypeOf(instance, Instance.prototype);
  }
}

export class Instance extends WebAssembly.Instance {
  constructor(module, imports) {
    let state = new Asyncify();
    super(module, state.wrapImports(imports));
    state.init(this, imports);
  }

  get exports() {
    return WRAPPED_EXPORTS.get(super.exports);
  }
}

Object.defineProperty(Instance.prototype, 'exports', { enumerable: true });

export async function instantiate(source, imports) {
  let state = new Asyncify();
  let result = await WebAssembly.instantiate(
    source,
    state.wrapImports(imports)
  );
  state.init(
    result instanceof WebAssembly.Instance ? result : result.instance,
    imports
  );
  return result;
}

export async function instantiateStreaming(source, imports) {
  let state = new Asyncify();
  let result = await WebAssembly.instantiateStreaming(
    source,
    state.wrapImports(imports)
  );
  state.init(result.instance, imports);
  return result;
}
