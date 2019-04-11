import { add } from './crate/main.rs';
console.log('lel');
try {
  console.log(add);
  console.log(add(2, 3));
} catch (err) {
  console.error(err);
}

console.log('hey');
document.body.style.border = '5px solid blue';
