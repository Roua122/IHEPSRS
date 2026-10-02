const { randomBytes } = require("node:crypto");

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32(buffer) {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");

  let output = "";
  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, "0");
    output += alphabet[Number.parseInt(chunk, 2)];
  }
  return output;
}

console.log(base32(randomBytes(20)));
