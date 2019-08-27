import { createInterface } from 'readline';
import { equal as assertEqual } from 'assert';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.pause();

let counter = 0;

export function read_number() {
  return new Promise(resolve => {
    rl.question(`Enter number #${++counter}: `, res => {
      rl.pause();

      let resNumber = res | 0;
      assertEqual(resNumber, res);
      resolve(resNumber);
    });
  });
}

export function print_number(num) {
  console.log(num);
}
