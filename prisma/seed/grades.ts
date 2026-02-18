import type { GradeType, Subject } from "../../src/generated/prisma/client";

interface GradeData {
  id: string;
  subject: Subject;
  gradeNumber: number;
  gradeType: GradeType;
  wordStart: number;
  wordEnd: number;
  reviewRangeStart: number | null;
  reviewRangeEnd: number | null;
  blockNumber: number;
}

function generateEnglishGrades(): GradeData[] {
  const grades: GradeData[] = [];
  let gradeNum = 1;
  let wordStart = 1;

  // Blocks 1-9: each has 4 new + 1 review = 5 grades per block
  for (let block = 1; block <= 9; block++) {
    const blockStart = wordStart;

    // 4 new-word grades per block (50 words each)
    for (let i = 0; i < 4; i++) {
      grades.push({
        id: `E${gradeNum}`,
        subject: "english",
        gradeNumber: gradeNum,
        gradeType: "new_words",
        wordStart,
        wordEnd: wordStart + 49,
        reviewRangeStart: null,
        reviewRangeEnd: null,
        blockNumber: block,
      });
      wordStart += 50;
      gradeNum++;
    }

    // 1 review grade per block
    grades.push({
      id: `E${gradeNum}`,
      subject: "english",
      gradeNumber: gradeNum,
      gradeType: "review",
      wordStart: blockStart,
      wordEnd: wordStart - 1,
      reviewRangeStart: blockStart,
      reviewRangeEnd: wordStart - 1,
      blockNumber: block,
    });
    gradeNum++;
  }

  // Block 10: E46-E47 (2 new grades, 100 words) + E48 (complete mastery)

  // E46: words 1801-1850
  grades.push({
    id: `E${gradeNum}`,
    subject: "english",
    gradeNumber: gradeNum,
    gradeType: "new_words",
    wordStart,
    wordEnd: wordStart + 49,
    reviewRangeStart: null,
    reviewRangeEnd: null,
    blockNumber: 10,
  });
  wordStart += 50;
  gradeNum++;

  // E47: words 1851-1900
  grades.push({
    id: `E${gradeNum}`,
    subject: "english",
    gradeNumber: gradeNum,
    gradeType: "new_words",
    wordStart,
    wordEnd: wordStart + 49,
    reviewRangeStart: null,
    reviewRangeEnd: null,
    blockNumber: 10,
  });
  gradeNum++;

  // E48: Complete mastery (all 1-1900)
  grades.push({
    id: `E${gradeNum}`,
    subject: "english",
    gradeNumber: gradeNum,
    gradeType: "complete",
    wordStart: 1,
    wordEnd: 1900,
    reviewRangeStart: 1,
    reviewRangeEnd: 1900,
    blockNumber: 10,
  });

  return grades;
}

function generateJapaneseGrades(): GradeData[] {
  const grades: GradeData[] = [];
  let gradeNum = 1;
  let wordStart = 1;

  // Blocks 1-3: each has 4 new + 1 review = 5 grades per block
  for (let block = 1; block <= 3; block++) {
    const blockStart = wordStart;

    for (let i = 0; i < 4; i++) {
      grades.push({
        id: `J${gradeNum}`,
        subject: "japanese",
        gradeNumber: gradeNum,
        gradeType: "new_words",
        wordStart,
        wordEnd: wordStart + 49,
        reviewRangeStart: null,
        reviewRangeEnd: null,
        blockNumber: block,
      });
      wordStart += 50;
      gradeNum++;
    }

    grades.push({
      id: `J${gradeNum}`,
      subject: "japanese",
      gradeNumber: gradeNum,
      gradeType: "review",
      wordStart: blockStart,
      wordEnd: wordStart - 1,
      reviewRangeStart: blockStart,
      reviewRangeEnd: wordStart - 1,
      blockNumber: block,
    });
    gradeNum++;
  }

  // Block 4: J16-J19 (4 new) + J20 (complete mastery)

  for (let i = 0; i < 4; i++) {
    grades.push({
      id: `J${gradeNum}`,
      subject: "japanese",
      gradeNumber: gradeNum,
      gradeType: "new_words",
      wordStart,
      wordEnd: wordStart + 49,
      reviewRangeStart: null,
      reviewRangeEnd: null,
      blockNumber: 4,
    });
    wordStart += 50;
    gradeNum++;
  }

  // J20: Complete mastery (all 1-800)
  grades.push({
    id: `J${gradeNum}`,
    subject: "japanese",
    gradeNumber: gradeNum,
    gradeType: "complete",
    wordStart: 1,
    wordEnd: 800,
    reviewRangeStart: 1,
    reviewRangeEnd: 800,
    blockNumber: 4,
  });

  return grades;
}

export function getAllGrades(): GradeData[] {
  return [...generateEnglishGrades(), ...generateJapaneseGrades()];
}
