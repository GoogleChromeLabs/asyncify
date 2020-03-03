//@ts-check
/// <reference no-default-lib="true" />
/// <reference lib="webworker" />

/** @param {{
  data: {
    module: WebAssembly.Module,
    imports: Record<string, Record<string, number>>
  }
}} event */
onmessage = async ({ data: { module, imports } }) => {
  let sab = new SharedArrayBuffer(17016);

  // 0 - Float64.
  // 1 - Int64.
  let statusFuncIdAndCount = new Int32Array(sab, 0, 3);
  let types = new Uint8Array(sab, 12, 1000);
  let f64 = new Float64Array(sab, 1016, 1000);
  let i64 = new BigInt64Array(sab, 9016, 1000);

  /**
   * @template V, V2
   * @param {Record<string, V>} ctx
   * @param {(value: V) => V2} handler
   * @returns {Record<string, V2>}
   */
  function createGetProxy(ctx, handler) {
    return /** @type {any} */ (new Proxy(ctx, {
      get: (target, /** @type {string} */ key) => handler(target[key])
    }));
  }

  let instance = await WebAssembly.instantiate(
    module,
    createGetProxy(imports, moduleImports =>
      createGetProxy(moduleImports, ({ kind, value }) => {
        switch (kind) {
          case 'function':
            return (...args) => {
              statusFuncIdAndCount[0] = 0;
              statusFuncIdAndCount[1] = value;
              statusFuncIdAndCount[2] = args.length;
              for (let i = 0; i < args.length; i++) {
                switch (typeof args[i]) {
                  case 'number':
                    types[i] = 0;
                    f64[i] = args[i];
                    break;
                  case 'bigint':
                    types[i] = 1;
                    i64[i] = args[i];
                    break;
                  default:
                    throw new Error('unreachable');
                }
              }
              postMessage(null);
              Atomics.wait(statusFuncIdAndCount, 0, 0);
              switch (statusFuncIdAndCount[2]) {
                case 0:
                  return;
                case 1:
                  switch (types[0]) {
                    case 0:
                      return f64[0];
                    case 1:
                      return i64[0];
                  }
              }
              throw new Error('unreachable');
            };
          case 'global':
            return value;
          case 'memory': {
            if (value instanceof ArrayBuffer) {
              let memory = new WebAssembly.Memory({
                initial: value.byteLength >> 16
              });
              new Uint8Array(memory.buffer).set(new Uint8Array(value));
              value = memory;
            }
            break;
          }
          default:
            throw new Error('unreachable');
        }
      })
    )
  );

  let exports = Object.values(instance.exports);

  postMessage(sab);

  onmessage = ({ data: { funcId, args } }) => {
    let func = /** @type {Function} */ (exports[funcId]);

    postMessage(func(...args));
  };
};
