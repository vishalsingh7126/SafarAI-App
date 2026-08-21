/**
 * Tiny classname joiner — keeps conditional Tailwind lists readable
 * without pulling in an extra dependency.
 */
export function cn(...parts) {
  return parts
    .flat(Infinity)
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .trim();
}

export default cn;
