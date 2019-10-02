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
const { run, run2 } = new Asyncify.Instance(wasmModule, {
  env: {
    get_time: Date.now,
    sleep: promisify(setTimeout)
  }
}).exports;

// Check that the export works as an asynchronous function.
run().then(res => assert.strictEqual(res, 1));

// Ensure that referential equality between exports is preserved for async wrappers.
assert.strictEqual(run, run2);

console.log('OK');
