import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Instance } from '../asyncify.mjs';
import { promisify } from 'util';
import assert from 'assert';

process.on('unhandledRejection', err => {
  throw err;
});

const wasmContents = readFileSync(
  fileURLToPath(`${import.meta.url}/../test.wasm`)
);
const wasmModule = new WebAssembly.Module(wasmContents);
const wasmInstance = new Instance(wasmModule, {
  env: {
    get_time: Date.now,
    sleep: promisify(setTimeout)
  }
});

wasmInstance.exports.run().then(res => assert.strictEqual(res, 1));
