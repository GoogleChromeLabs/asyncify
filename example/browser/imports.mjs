const dialogElem = document.getElementById('numberDialog');
const counterElem = document.getElementById('counter');
const formElem = document.getElementById('numberForm');
const numberElem = document.getElementById('number');

// Feature-detect and polyfill <form method="dialog">.
if (formElem.method !== 'dialog') {
  formElem.addEventListener('submit', (event) => {
    event.preventDefault();
    dialogElem.close();
  });
}

let counter = 0;

export function read_number() {
  return new Promise((resolve, reject) => {
    dialogElem.onclose = function() {
      let result = numberElem.valueAsNumber;
      formElem.reset();
      resolve(result);
    };

    dialogElem.oncancel = () => reject(new Error('Cancelled by user.'));

    counterElem.textContent = ++counter;
    dialogElem.showModal();
  });
}

export function print_number(num) {
  alert(num);
}
