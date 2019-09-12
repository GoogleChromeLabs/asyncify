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

import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.pause();

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

let counter = 0;

export async function read_number() {
  let res = await question(`Enter number #${++counter}: `);
  rl.pause();

  let resNumber = res | 0;
  if (resNumber.toString() !== res) {
    throw new Error('Invalid integer.');
  }
  return resNumber;
}

export function print_number(num) {
  console.log(num);
}
