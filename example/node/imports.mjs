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
  if (resNumber != res) {
    throw new Error('Invalid number.');
  }
  return resNumber;
}

export function print_number(num) {
  console.log(num);
}
