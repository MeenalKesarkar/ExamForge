import pdfParse = require("pdf-parse");

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

interface RawQuestion {
  number: string;
  lines: string[];
}

interface ParsedSection {
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
const questionHeader =
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
const optionLine =
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
const answerLine =
  /^\s*(?:correct\s*(?:answer|option)|answer|ans)\s*[:\-]\s*(.*?)\s*$/i;

/*
 * Question type:
 *
 * Type: single
 * Type: multi
 * Question Type: single
 * Question Type: multiple choice
 */
const typeLine =
  /^\s*(?:question\s*)?type\s*[:\-]\s*(single|multi|multiple(?:\s+choice)?|single(?:\s+choice)?)\s*$/i;

/*
 * Difficulty:
 *
 * Difficulty: easy
 * Difficulty: medium
 * Difficulty: hard
 */
const difficultyPattern =
  /\bdifficulty\s*:\s*(easy|medium|hard)\b/i;

/*
 * Marks:
 *
 * Mark: 1
 * Marks: 1
 * Marks: 2.5
 */
const marksPattern =
  /\bmarks?\s*:\s*(\d+(?:\.\d+)?)\b/i;

/*
 * Explanation:
 *
 * Explanation: useEffect is used for side effects.
 *
 * Stops before Difficulty or Order if they occur later.
 */
const explanationPattern =
  /\bexplanation\s*:\s*(.*?)(?=\s+(?:difficulty|order)\s*:|\s*$)/i;

/*
 * Order:
 *
 * Order: 1
 * Order: 10
 * Question Order: 10
 */
const orderPattern =
  /\b(?:question\s+)?order\s*:\s*\d+\b/i;

/*
|--------------------------------------------------------------------------
| TEXT NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

/*
|--------------------------------------------------------------------------
| ANSWER TOKENIZATION
|--------------------------------------------------------------------------
*/

function answerTokens(value: string): string[] {
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

function inferDifficulty(
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

function extractMetadataFromText(value: string): {
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

function parseSection(
  section: RawQuestion
): ParsedSection {
  const questionLines: string[] = [];

  const options: Array<{
    label: string;
    text: string;
  }> = [];

  let answerText = "";

  let explicitType:
    | "single"
    | "multi"
    | undefined;

  let marks = 1;

  let explanation = "";

  let explicitDifficulty:
    | "easy"
    | "medium"
    | "hard"
    | undefined;

  let activeOption = -1;

  /*
   * Process every line.
   */
  for (
    const sourceLine of section.lines
  ) {
    const line =
      sourceLine.trim();

    if (!line) {
      /*
       * Blank line ends an option continuation.
       */
      activeOption = -1;
      continue;
    }

    /*
     * Extract metadata from EVERY line.
     *
     * PDF extraction frequently puts:
     *
     * Marks
     * Explanation
     * Difficulty
     * Order
     *
     * on the same line as the question.
     */
    const metadata =
      extractMetadataFromText(line);

    if (
      metadata.marks !== undefined
    ) {
      marks = metadata.marks;
    }

    if (
      metadata.explanation !==
      undefined
    ) {
      explanation =
        metadata.explanation;
    }

    if (
      metadata.difficulty !==
      undefined
    ) {
      explicitDifficulty =
        metadata.difficulty;
    }

    const cleanedLine =
      metadata.text;

    /*
     * Metadata-only line.
     */
    if (!cleanedLine) {
      continue;
    }

    /*
     * CORRECT ANSWER
     */
    const answerMatch =
      cleanedLine.match(
        answerLine
      );

    if (answerMatch) {
      answerText =
        answerMatch[1].trim();

      activeOption = -1;

      continue;
    }

    /*
     * QUESTION TYPE
     */
    const typeMatch =
      cleanedLine.match(
        typeLine
      );

    if (typeMatch) {
      explicitType =
        typeMatch[1]
          .toLowerCase()
          .startsWith("multi")
          ? "multi"
          : "single";

      activeOption = -1;

      continue;
    }

    /*
     * OPTION
     */
    const optionMatch =
      cleanedLine.match(
        optionLine
      );

    if (optionMatch) {
      options.push({
        label: (
          optionMatch[1] || ""
        ).toUpperCase(),

        text: normalizeText(
          optionMatch[2]
        ),
      });

      activeOption =
        options.length - 1;

      continue;
    }

    /*
     * CONTINUATION OF AN OPTION
     */
    if (
      activeOption >= 0 &&
      options[activeOption]
    ) {
      options[
        activeOption
      ].text = normalizeText(
        options[activeOption].text +
          " " +
          cleanedLine
      );
    } else {
      /*
       * OTHERWISE THIS IS QUESTION TEXT.
       */
      questionLines.push(
        cleanedLine
      );
    }
  }

  /*
   * Build final question text.
   */
  const questionText =
    normalizeText(
      questionLines.join(" ")
    );

  /*
   * Safety cleanup.
   *
   * This catches metadata that may have survived because
   * PDF extraction joined several pieces together.
   */
  const cleanedQuestionText =
    normalizeText(
      questionText
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
        )
    );

  /*
   * ISSUE HELPER
   */
  const issue = (
    reason: string
  ): ParsedSection => ({
    issue: {
      questionNumber:
        section.number,

      questionText:
        cleanedQuestionText,

      reason,
    },
  });

  /*
   * QUESTION TEXT VALIDATION
   */
  if (!cleanedQuestionText) {
    return issue(
      "Question text is missing."
    );
  }

  if (
    cleanedQuestionText.length >
    2000
  ) {
    return issue(
      "Question text exceeds the 2,000 character limit."
    );
  }

  /*
   * OPTIONS VALIDATION
   */
  if (
    options.length < 2 ||
    options.length > 10
  ) {
    return issue(
      "Question must contain between 2 and 10 labeled options."
    );
  }

  if (
    options.some(
      (option) => !option.text
    )
  ) {
    return issue(
      "At least one option has no text."
    );
  }

  /*
   * UNIQUE LABELS
   */
  if (
    new Set(
      options.map(
        (option) => option.label
      )
    ).size !== options.length
  ) {
    return issue(
      "Option labels must be unique."
    );
  }

  /*
   * UNIQUE OPTION TEXT
   */
  if (
    new Set(
      options.map((option) =>
        option.text.toLowerCase()
      )
    ).size !== options.length
  ) {
    return issue(
      "Question contains duplicate options."
    );
  }

  /*
   * CORRECT ANSWER VALIDATION
   */
  if (!answerText) {
    return issue(
      "Correct answer is missing; it was not guessed."
    );
  }

  const tokens =
    answerTokens(answerText);

  const correctAnswers =
    tokens.map((token) => {
      /*
       * Match by label.
       *
       * B
       * C
       */
      const label =
        token.match(
          /^([A-J])$/i
        )?.[1]?.toUpperCase();

      const byLabel =
        label &&
        options.find(
          (option) =>
            option.label ===
            label
        );

      /*
       * Match by exact option text.
       *
       * useEffect
       */
      const byText =
        options.find(
          (option) =>
            option.text.toLowerCase() ===
            token.toLowerCase()
        );

      return (
        byLabel ||
        byText
      )?.text || "";
    });

  /*
   * ANSWER MATCH FAILED
   */
  if (
    !tokens.length ||
    correctAnswers.some(
      (answer) => !answer
    )
  ) {
    return issue(
      "Correct answer could not be matched to an option."
    );
  }

  /*
   * DUPLICATE CORRECT ANSWERS
   */
  if (
    new Set(correctAnswers).size !==
    correctAnswers.length
  ) {
    return issue(
      "Correct answer contains duplicate choices."
    );
  }

  /*
   * DETERMINE QUESTION TYPE
   */
  const type =
    explicitType ||
    (correctAnswers.length > 1
      ? "multi"
      : "single");

  /*
   * TYPE VALIDATION
   */
  if (
    (type === "single" &&
      correctAnswers.length !== 1) ||
    (type === "multi" &&
      correctAnswers.length < 2)
  ) {
    return issue(
      "Correct answer count does not match the declared question type."
    );
  }

  /*
   * DIFFICULTY
   *
   * 1. Use explicit PDF difficulty if present.
   *
   * 2. Otherwise calculate it automatically.
   */
  const difficulty =
    explicitDifficulty ||
    inferDifficulty(
      cleanedQuestionText,
      explanation,
      options.map(
        (option) => option.text
      )
    );

  /*
   * FINAL QUESTION DRAFT
   */
  return {
    draft: {
      questionNumber:
        section.number,

      questionText:
        cleanedQuestionText,

      type,

      options: options.map(
        (option) => option.text
      ),

      correctAnswers,

      marks,

      explanation,

      difficulty,
    },
  };
}

/*
|--------------------------------------------------------------------------
| EXTRACT TEXT FROM PDF
|--------------------------------------------------------------------------
*/

export async function extractPdfQuestionText(
  buffer: Buffer
): Promise<string> {
  const result =
    await pdfParse(buffer, {
      max: 100,
    });

  return result.text || "";
}

/*
|--------------------------------------------------------------------------
| PARSE PDF QUESTIONS
|--------------------------------------------------------------------------
*/

export function parsePdfQuestions(
  text: string
): {
  questions: PdfQuestionDraft[];
  issues: PdfQuestionIssue[];
} {
  const lines = text
    .replace(/\r/g, "")
    .split("\n");

  const sections: RawQuestion[] =
    [];

  let current:
    | RawQuestion
    | null = null;

  let previousNumber = 0;

  /*
   * Identify question sections.
   */
  for (const line of lines) {
    const match =
      line.match(
        questionHeader
      );

    const number = match
      ? Number(match[1])
      : 0;

    /*
     * Explicit:
     *
     * Question 1:
     * Question 2:
     */
    const explicitHeader =
      Boolean(
        match &&
          /^\s*question\s/i.test(
            line
          )
      );

    /*
     * Normal numbered sequence:
     *
     * 1.
     * 2.
     * 3.
     */
    const startsNext =
      Boolean(
        match &&
          (!current ||
            explicitHeader ||
            number ===
              previousNumber + 1)
      );

    if (
      startsNext &&
      match
    ) {
      current = {
        number: match[1],
        lines: [match[2]],
      };

      sections.push(
        current
      );

      previousNumber =
        number;
    } else if (current) {
      current.lines.push(
        line
      );
    }
  }

  /*
   * No questions found.
   */
  if (!sections.length) {
    return {
      questions: [],

      issues: [
        {
          reason:
            "No numbered questions were recognized in this PDF.",
        },
      ],
    };
  }

  const questions: PdfQuestionDraft[] =
    [];

  const issues: PdfQuestionIssue[] =
    [];

  /*
   * Parse every question.
   */
  for (const section of sections) {
    const parsed =
      parseSection(section);

    if (parsed.draft) {
      questions.push(
        parsed.draft
      );
    }

    if (parsed.issue) {
      issues.push(
        parsed.issue
      );
    }
  }

  return {
    questions,
    issues,
  };
}