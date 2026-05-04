export function generateAccessId(prefix = "DFA") {
  return `${prefix}-${Date.now()}`;
}
