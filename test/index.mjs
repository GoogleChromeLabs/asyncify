import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import assert from 'assert';
import binaryen from 'binaryen';
import * as Asyncify from '../asyncify.mjs';

process.on('unhandledRejection', err => {
  throw err;
});

const src = readFileSync(
  fileURLToPath(`${import.meta.url}/../test.wat`),
  'utf-8'
);

const binaryenModule = binaryen.parseText(src);
binaryenModule.runPasses(['asyncify']);
binaryenModule.optimize();

const wasmContents = binaryenModule.emitBinary();

const wasmModule = new WebAssembly.Module(wasmContents);
const { run, run2, table } = new Asyncify.Instance(wasmModule, {
  env: {
    get_time: Date.now,
    sleep: promisify(setTimeout)
  }
}).exports;

// Check that the export works as an asynchronous function.
run().then(res => assert.strictEqual(res, 1));

// Ensure that referential equality between exports is preserved for async wrappers.
assert.strictEqual(run, run2);
