/**
 * Parses a math expression string into a question and answer.
 * Supports formats: "3x5", "3 x 5", "3*5", "3 * 5"
 * @param input - The input string to parse
 * @returns An object with question and answer, or null if invalid
 */
export function parseMathExpression(
  input: string
): { question: string; answer: number } | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmed = input.trim();

  // Match patterns: number, optional whitespace, x or *, optional whitespace, number
  // Examples: "3x5", "3 x 5", "3*5", "3 * 5", "10x2", "10 x 2"
  const match = trimmed.match(/^(\d+)\s*[x*]\s*(\d+)$/i);

  if (!match) {
    return null;
  }

  const operand1 = parseInt(match[1], 10);
  const operand2 = parseInt(match[2], 10);

  // Validate numbers are valid
  if (isNaN(operand1) || isNaN(operand2)) {
    return null;
  }

  // Calculate answer
  const answer = operand1 * operand2;

  // Format question as "X x Y"
  const question = `${operand1} x ${operand2}`;

  return { question, answer };
}

