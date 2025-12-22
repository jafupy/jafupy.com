let counter = 0n;
let lastTime = 0n;
/**
 *
 * @returns {string} Unique Identifier
 */
export default function identifier() {
  const now = BigInt(Date.now());
  if (now === lastTime) counter++;
  else {
    lastTime = now;
    counter = 0n;
  }
  let x = (now << 32n) | counter;
  // scramble
  x = (x ^ (x >> 30n)) * 0xbf58476d1ce4e5b9n;
  x = (x ^ (x >> 27n)) * 0x94d049bb133111ebn;
  x = x ^ (x >> 31n);
  // keep only lower 64 bits
  x = x & 0xffffffffffffffffn;
  const hex = x.toString(16).padStart(16, "0"); // 16 hex chars
  return hex
    .match(/.{1,4}/g)
    .slice(0, 4)
    .join(":"); // 4 chunks
}
