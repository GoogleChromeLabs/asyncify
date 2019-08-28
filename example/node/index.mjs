import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Instance } from '../../asyncify.mjs';
import * as testImports from './imports.mjs';

process.on('unhandledRejection', err => {
  throw err;
});

const wasmContents = readFileSync(
  fileURLToPath(`${import.meta.url}/../../example.wasm`)
);
const wasmModule = new WebAssembly.Module(wasmContents);
const wasmInstance = new Instance(wasmModule, {
  env: testImports
});

wasmInstance.exports.run();
