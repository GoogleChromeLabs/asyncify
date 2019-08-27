const DATA_ADDR = 16;

function isPromise(obj) {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
}

class Asyncify {
  constructor() {
    this.state = { type: 'Loading' };
    this.exports = {};
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
    for (let importName in module) {
      let value = module[importName];
      if (typeof value === 'function') {
        module[importName] = this.wrapImportFn(value);
      }
    }

    return module;
  }

  wrapImports(imports) {
    if (imports === undefined) return;

    for (let moduleName in imports) {
      this.wrapModuleImports(imports[moduleName]);
    }

    return imports;
  }

  wrapExportFn(fn) {
    return async (...args) => {
      if (this.state.type !== 'None') {
        this.invalidState();
      }

      let result = fn(...args);

      while (this.state.type === 'Unwinding') {
        let { promise } = this.state;
        this.state = { type: 'None' };
        this.exports.asyncify_stop_unwind();
        this.state = { type: 'Waiting' };
        let value = await promise;
        this.state = { type: 'None' };
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
  }

  wrapExports(exports) {
    let newExports = this.exports;

    for (let exportName in exports) {
      let value = exports[exportName];
      if (typeof value === 'function' && !exportName.startsWith('asyncify_')) {
        value = this.wrapExportFn(value);
      }
      newExports[exportName] = value;
    }

    this.init(newExports);

    return newExports;
  }

  wrapInstance(instance) {
    instance._exports = this.wrapExports(instance.exports);
    return Object.setPrototypeOf(instance, Instance.prototype);
  }

  init() {
    const view = new Int32Array(this.exports.memory.buffer, DATA_ADDR);
    view[0] = DATA_ADDR + 8;
    view[1] = 512;

    this.state = { type: 'None' };
  }
}

export class Instance extends WebAssembly.Instance {
  constructor(module, imports) {
    let state = new Asyncify();
    super(module, state.wrapImports(imports));
    state.wrapInstance(this);
  }

  get exports() {
    return this._exports;
  }
}

Object.defineProperty(Instance.prototype, 'exports', { enumerable: true });

export async function instantiate(source, imports) {
  let state = new Asyncify();
  let result = await WebAssembly.instantiate(
    source,
    state.wrapImports(imports)
  );
  state.wrapInstance(result.instance);
  return result;
}

export async function instantiateStreaming(source, imports) {
  let state = new Asyncify();
  let result = await WebAssembly.instantiateStreaming(
    source,
    state.wrapImports(imports)
  );
  state.wrapInstance(result.instance);
  return result;
}
