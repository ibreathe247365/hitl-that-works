// Calculator tools for mathematical operations

export interface CalculationResult {
	expression: string;
	result: number;
	steps: string[];
	error?: string;
}

export function evaluateExpression(expression: string): CalculationResult {
	try {
		// Clean the expression
		const cleanExpression = expression
			.replace(/\s+/g, "") // Remove whitespace
			.replace(/\^/g, "**") // Convert ^ to ** for power
			.replace(/sqrt\(([^)]+)\)/g, "Math.sqrt($1)") // Convert sqrt() to Math.sqrt()
			.replace(/pi/g, "Math.PI") // Convert pi to Math.PI
			.replace(/e/g, "Math.E"); // Convert e to Math.E

		// Validate the expression contains only allowed characters
		const allowedChars = /^[0-9+\-*/().\s,Math.sqrtPIe]+$/;
		if (!allowedChars.test(cleanExpression)) {
			throw new Error("Invalid characters in expression");
		}

		// Evaluate the expression safely
		const result = Function(`"use strict"; return (${cleanExpression})`)();

		if (typeof result !== "number" || !Number.isFinite(result)) {
			throw new Error("Result is not a valid number");
		}

		return {
			expression: expression,
			result: result,
			steps: [`Evaluated: ${expression} = ${result}`],
		};
	} catch (error) {
		return {
			expression: expression,
			result: 0,
			steps: [],
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

export function formatCalculationResult(result: CalculationResult): string {
	if (result.error) {
		return `Error calculating "${result.expression}": ${result.error}`;
	}

	return `Calculation: ${result.expression} = ${result.result}`;
}

export function validateMathematicalExpression(expression: string): {
	isValid: boolean;
	error?: string;
} {
	try {
		// Basic validation
		if (!expression || expression.trim().length === 0) {
			return { isValid: false, error: "Expression cannot be empty" };
		}

		// Check for balanced parentheses
		let parenCount = 0;
		for (const char of expression) {
			if (char === "(") parenCount++;
			if (char === ")") parenCount--;
			if (parenCount < 0) {
				return { isValid: false, error: "Unbalanced parentheses" };
			}
		}
		if (parenCount !== 0) {
			return { isValid: false, error: "Unbalanced parentheses" };
		}

		// Check for valid characters
		const validChars = /^[0-9+\-*/().\s,^sqrtpi]+$/i;
		if (!validChars.test(expression)) {
			return {
				isValid: false,
				error: "Expression contains invalid characters",
			};
		}

		return { isValid: true };
	} catch (_error) {
		return { isValid: false, error: "Invalid expression format" };
	}
}
