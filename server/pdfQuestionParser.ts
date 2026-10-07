import pdfParse = require("pdf-parse");
import { type PdfQuestionDraft, type PdfQuestionIssue, type RawQuestion, type ParsedSection, questionHeader, optionLine, answerLine, typeLine, orderPattern, normalizeText, answerTokens, inferDifficulty, extractMetadataFromText } from "./pdfQuestionParserShared";
export type { PdfQuestionDraft, PdfQuestionIssue } from "./pdfQuestionParserShared";

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

  // Process every line.
  for (
    const sourceLine of section.lines
  ) {
    const line =
      sourceLine.trim();

    if (!line) {
      // Blank line ends an option continuation.
      activeOption = -1;
      continue;
    }

    // Extract metadata from EVERY line.
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

    // Metadata-only line.
    if (!cleanedLine) {
      continue;
    }

    // CORRECT ANSWER
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

    // QUESTION TYPE
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

    // OPTION
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

    // CONTINUATION OF AN OPTION
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
      // OTHERWISE THIS IS QUESTION TEXT.
      questionLines.push(
        cleanedLine
      );
    }
  }

  // Build final question text.
  const questionText =
    normalizeText(
      questionLines.join(" ")
    );

  // Safety cleanup.
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

  // ISSUE HELPER
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

  // QUESTION TEXT VALIDATION
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

  // OPTIONS VALIDATION
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

  // UNIQUE LABELS
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

  // UNIQUE OPTION TEXT
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

  // CORRECT ANSWER VALIDATION
  if (!answerText) {
    return issue(
      "Correct answer is missing; it was not guessed."
    );
  }

  const tokens =
    answerTokens(answerText);

  const correctAnswers =
    tokens.map((token) => {
      // Match by label.
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

      // Match by exact option text.
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

  // ANSWER MATCH FAILED
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

  // DUPLICATE CORRECT ANSWERS
  if (
    new Set(correctAnswers).size !==
    correctAnswers.length
  ) {
    return issue(
      "Correct answer contains duplicate choices."
    );
  }

  // DETERMINE QUESTION TYPE
  const type =
    explicitType ||
    (correctAnswers.length > 1
      ? "multi"
      : "single");

  // TYPE VALIDATION
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

  // DIFFICULTY
  const difficulty =
    explicitDifficulty ||
    inferDifficulty(
      cleanedQuestionText,
      explanation,
      options.map(
        (option) => option.text
      )
    );

  // FINAL QUESTION DRAFT
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

// | EXTRACT TEXT FROM PDF

export async function extractPdfQuestionText(
  buffer: Buffer
): Promise<string> {
  const result =
    await pdfParse(buffer, {
      max: 100,
    });

  return result.text || "";
}

// | PARSE PDF QUESTIONS

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

  // Identify question sections.
  for (const line of lines) {
    const match =
      line.match(
        questionHeader
      );

    const number = match
      ? Number(match[1])
      : 0;

    // Explicit:
    const explicitHeader =
      Boolean(
        match &&
          /^\s*question\s/i.test(
            line
          )
      );

    // Normal numbered sequence:
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

  // No questions found.
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

  // Parse every question.
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
