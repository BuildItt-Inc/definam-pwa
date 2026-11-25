export function generateAccessId(prefix = "DFA"): string {
  let randomHex = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    randomHex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    randomHex = Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
  }
  return `${prefix}-${randomHex.toUpperCase()}`;
}
