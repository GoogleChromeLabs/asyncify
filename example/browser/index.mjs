import { instantiateStreaming } from '../../asyncify.mjs';
import * as testImports from './imports.mjs';

instantiateStreaming(fetch('../test.wasm'), {
  env: testImports
})
  .then(result => result.instance.exports.run())
  .catch(alert);
