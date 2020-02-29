//@ts-check
/// <reference no-default-lib="true" />
/// <reference lib="webworker" />

/** @param {{
  data: {
    wasm: WebAssembly.Module,
    imports: Record<string, Record<string, number>>
  }
}} event */
onmessage = async ({ data: { wasm, imports } }) => {
  let sab = new SharedArrayBuffer(16);

  // 0 - Uninitialised.
  // 1 - Undefined.
  // 2 - Float64.
  // 3 - Int64.
  let resultType = new Int32Array(sab, 0, 1);
  let resultFloat64 = new Float64Array(sab, 8, 1);
  let resultInt64 = new BigInt64Array(sab, 8, 1);

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
    wasm,
    createGetProxy(imports, moduleImports =>
      createGetProxy(moduleImports, funcId => (...args) => {
        resultType[0] = 0;
        postMessage({ type: 'import', funcId, args });
        Atomics.wait(resultType, 0, 0);
        switch (resultType[0]) {
          case 1:
            return;
          case 2:
            return resultFloat64[0];
          case 3:
            return resultInt64[0];
          default:
            throw new Error('Unexpected result type.');
        }
      })
    )
  );

  let exports = Object.values(instance.exports);

  postMessage(sab);

  onmessage = ({ data: { funcId, args } }) => {
    let func = /** @type {Function} */ (exports[funcId]);

    postMessage({
      type: 'result',
      result: func(...args)
    });
  };
};
