export interface PdfQuestionDraft {
  questionNumber: string;
  questionText: string;
  type: "single" | "multi";
  options: string[];
  correctAnswers: string[];
  marks: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface PdfQuestionIssue {
  questionNumber?: string;
  questionText?: string;
  reason: string;
}

export interface RawQuestion {
  number: string;
  lines: string[];
}

export interface ParsedSection {
  draft?: PdfQuestionDraft;
  issue?: PdfQuestionIssue;
}

/*
|--------------------------------------------------------------------------
| REGULAR EXPRESSIONS
|--------------------------------------------------------------------------
*/

/*
 * Question headers:
 *
 * 1. Question text
 * 2) Question text
 * 3: Question text
 * 4- Question text
 * Question 5: Question text
 */
export const questionHeader =
  /^\s*(?:question\s*)?(\d{1,4})\s*[.):\-]\s*(.*)$/i;

/*
 * Option formats:
 *
 * A) useState
 * A. useState
 * A: useState
 * A- useState
 * (A) useState
 */
export const optionLine =
  /^\s*\(?([A-J])\)?\s*[.)\-:]\s*(.*)$/i;

/*
 * Correct answer formats:
 *
 * Correct Answer: B
 * Correct Answer: B, C
 * Correct Option: B
 * Answer: B
 * Ans: B
 */
export const answerLine =
  /^\s*(?:correct\s*(?:answer|option)|answer|ans)\s*[:\-]\s*(.*?)\s*$/i;

/*
 * Question type:
 *
 * Type: single
 * Type: multi
 * Question Type: single
 * Question Type: multiple choice
 */
export const typeLine =
  /^\s*(?:question\s*)?type\s*[:\-]\s*(single|multi|multiple(?:\s+choice)?|single(?:\s+choice)?)\s*$/i;

/*
 * Difficulty:
 *
 * Difficulty: easy
 * Difficulty: medium
 * Difficulty: hard
 */
export const difficultyPattern =
  /\bdifficulty\s*:\s*(easy|medium|hard)\b/i;

/*
 * Marks:
 *
 * Mark: 1
 * Marks: 1
 * Marks: 2.5
 */
export const marksPattern =
  /\bmarks?\s*:\s*(\d+(?:\.\d+)?)\b/i;

/*
 * Explanation:
 *
 * Explanation: useEffect is used for side effects.
 *
 * Stops before Difficulty or Order if they occur later.
 */
export const explanationPattern =
  /\bexplanation\s*:\s*(.*?)(?=\s+(?:difficulty|order)\s*:|\s*$)/i;

/*
 * Order:
 *
 * Order: 1
 * Order: 10
 * Question Order: 10
 */
export const orderPattern =
  /\b(?:question\s+)?order\s*:\s*\d+\b/i;

/*
|--------------------------------------------------------------------------
| TEXT NORMALIZATION
|--------------------------------------------------------------------------
*/

export function normalizeText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

/*
|--------------------------------------------------------------------------
| ANSWER TOKENIZATION
|--------------------------------------------------------------------------
*/

export function answerTokens(value: string): string[] {
  return value
    .replace(/\b(?:and|or)\b/gi, ",")
    .split(/[,;/|\n]+/)
    .map((part) =>
      part
        .trim()
        .replace(/^(?:option|choice)\s+/i, "")
        .replace(/^[([]/g, "")
        .replace(/[.)\]]$/g, "")
        .trim()
    )
    .filter(Boolean);
}

/*
|--------------------------------------------------------------------------
| AUTOMATIC DIFFICULTY
|--------------------------------------------------------------------------
|
| If the PDF explicitly contains:
|
| Difficulty: easy
| Difficulty: medium
| Difficulty: hard
|
| that value is always preferred.
|
| If no difficulty is supplied by the PDF, we estimate it from
| the question text and explanation.
|
| This is a heuristic, not a perfect semantic classifier.
|--------------------------------------------------------------------------
*/

export function inferDifficulty(
  questionText: string,
  explanation: string,
  options: string[]
): "easy" | "medium" | "hard" {
  const text =
    `${questionText} ${explanation}`.toLowerCase();

  let score = 0;

  /*
   * Basic / recall-oriented wording.
   */
  const easyPatterns = [
    /\bwhat\s+is\b/i,
    /\bwhat\s+are\b/i,
    /\bwhich\s+is\b/i,
    /\bwhich\s+of\s+the\s+following\b/i,
    /\bwho\s+is\b/i,
    /\bwhen\s+was\b/i,
    /\bwhere\s+is\b/i,
    /\bidentify\b/i,
    /\bdefine\b/i,
    /\bdefinition\b/i,
    /\bmeaning\b/i,
    /\bused\s+for\b/i,
    /\bknown\s+as\b/i,
    /\bstands\s+for\b/i,
    /\bsyntax\b/i,
  ];

  for (const pattern of easyPatterns) {
    if (pattern.test(text)) {
      score -= 1;
    }
  }

  /*
   * Medium / application-oriented wording.
   */
  const mediumPatterns = [
    /\bhow\s+does\b/i,
    /\bhow\s+do\b/i,
    /\bhow\s+to\b/i,
    /\bwhich\s+method\b/i,
    /\bwhich\s+approach\b/i,
    /\bwhich\s+technique\b/i,
    /\bchoose\b/i,
    /\bselect\b/i,
    /\bimplement\b/i,
    /\bapply\b/i,
    /\bcalculate\b/i,
    /\bsolve\b/i,
    /\bexample\b/i,
    /\bscenario\b/i,
    /\bcase\b/i,
    /\bcomplete(ly)?\s+update\b/i,
    /\bconfigure\b/i,
  ];

  for (const pattern of mediumPatterns) {
    if (pattern.test(text)) {
      score += 1;
    }
  }

  /*
   * Hard / analytical wording.
   */
  const hardPatterns = [
    /\banaly[sz]e\b/i,
    /\banalysis\b/i,
    /\bevaluate\b/i,
    /\bevaluation\b/i,
    /\bcompare\b/i,
    /\bcontrast\b/i,
    /\bjustify\b/i,
    /\bderive\b/i,
    /\bproof\b/i,
    /\bprove\b/i,
    /\boptimi[sz]e\b/i,
    /\boptimization\b/i,
    /\bcomplexity\b/i,
    /\btime\s+complexity\b/i,
    /\bspace\s+complexity\b/i,
    /\brecursive\b/i,
    /\barchitecture\b/i,
    /\btrade[- ]?off\b/i,
    /\bdebug\b/i,
    /\bdebugging\b/i,
    /\bwhy\s+would\b/i,
    /\bwhy\s+is\b/i,
    /\bwhat\s+would\s+happen\b/i,
    /\bmost\s+appropriate\b/i,
    /\bbest\s+approach\b/i,
    /\bmultiple\s+steps\b/i,
  ];

  for (const pattern of hardPatterns) {
    if (pattern.test(text)) {
      score += 2;
    }
  }

  /*
   * Longer questions generally require more processing.
   */
  if (questionText.length > 180) {
    score += 1;
  }

  if (questionText.length > 350) {
    score += 1;
  }

  /*
   * More options can indicate a more involved question,
   * but only slightly.
   */
  if (options.length >= 6) {
    score += 1;
  }

  /*
   * Final classification.
   */
  if (score <= -1) {
    return "easy";
  }

  if (score >= 3) {
    return "hard";
  }

  return "medium";
}

/*
|--------------------------------------------------------------------------
| EXTRACT METADATA
|--------------------------------------------------------------------------
*/

export function extractMetadataFromText(value: string): {
  text: string;
  marks?: number;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
} {
  let text = value;

  let marks:
    | number
    | undefined;

  let explanation:
    | string
    | undefined;

  let difficulty:
    | "easy"
    | "medium"
    | "hard"
    | undefined;

  /*
   * MARKS
   */
  const marksMatch =
    text.match(marksPattern);

  if (marksMatch) {
    const parsedMarks =
      Number(marksMatch[1]);

    if (
      Number.isFinite(parsedMarks) &&
      parsedMarks > 0
    ) {
      marks = parsedMarks;
    }
  }

  /*
   * DIFFICULTY
   */
  const difficultyMatch =
    text.match(
      difficultyPattern
    );

  if (difficultyMatch) {
    difficulty =
      difficultyMatch[1].toLowerCase() as
        | "easy"
        | "medium"
        | "hard";
  }

  /*
   * EXPLANATION
   */
  const explanationMatch =
    text.match(
      explanationPattern
    );

  if (explanationMatch) {
    explanation =
      normalizeText(
        explanationMatch[1]
      );
  }

  /*
   * REMOVE METADATA FROM QUESTION TEXT
   *
   * This is especially important for your problem:
   *
   * "Which HTTP method...? Order: 10"
   *
   * becomes:
   *
   * "Which HTTP method...?"
   */

  text = text
    .replace(
      /\bOptions\s*:\s*/gi,
      ""
    )
    .replace(
      /\bMarks?\s*:\s*\d+(?:\.\d+)?/gi,
      ""
    )
    .replace(
      /\bExplanation\s*:\s*.*?(?=\s+(?:Difficulty|Order)\s*:|\s*$)/gi,
      ""
    )
    .replace(
      /\bDifficulty\s*:\s*(?:easy|medium|hard)\b/gi,
      ""
    )
    .replace(
      orderPattern,
      ""
    );

  return {
    text: normalizeText(text),
    marks,
    explanation,
    difficulty,
  };
}

/*
|--------------------------------------------------------------------------
| PARSE QUESTION SECTION
|--------------------------------------------------------------------------
*/
