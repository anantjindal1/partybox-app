export function score(guess, target) {
  return guess === target ? 100 : Math.max(0, 50 - Math.abs(guess - target) * 5)
}
