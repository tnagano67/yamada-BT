import type { PrismaClient } from "../../src/generated/prisma/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** JST today as UTC midnight Date (for @db.Date fields) */
function getJstToday(): Date {
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(
      jstNow.getUTCFullYear(),
      jstNow.getUTCMonth(),
      jstNow.getUTCDate(),
    ),
  );
}

/** Return the last N weekdays (Mon-Fri) up to and including `today`, oldest first */
function getLastNWeekdays(n: number, today: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(today);
  while (days.length < n) {
    const dow = cursor.getUTCDay();
    if (dow >= 1 && dow <= 5) {
      days.unshift(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return days;
}

/** Subtract `n` calendar days from `base` (returns new Date) */
function daysAgo(base: Date, n: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function seedSprint6Data(prisma: PrismaClient) {
  console.log("Seeding Sprint 6 test data...");

  const today = getJstToday();
  const weekdays = getLastNWeekdays(14, today); // 14 weekdays ≈ 3 weeks

  // =======================================================================
  // 1. Additional students (9 new + update student@dev.local nameKana)
  // =======================================================================
  const newStudents = [
    { email: "s02@dev.local", name: "鈴木 一郎", nameKana: "すずき いちろう" },
    { email: "s03@dev.local", name: "田中 花子", nameKana: "たなか はなこ" },
    { email: "s04@dev.local", name: "山本 太郎", nameKana: "やまもと たろう" },
    { email: "s05@dev.local", name: "佐藤 美咲", nameKana: "さとう みさき" },
    { email: "s06@dev.local", name: "高橋 翔", nameKana: "たかはし しょう" },
    { email: "s07@dev.local", name: "渡辺 さくら", nameKana: "わたなべ さくら" },
    { email: "s08@dev.local", name: "伊藤 健太", nameKana: "いとう けんた" },
    { email: "s09@dev.local", name: "中村 愛", nameKana: "なかむら あい" },
    { email: "s10@dev.local", name: "小林 大輝", nameKana: "こばやし だいき" },
  ] as const;

  for (const s of newStudents) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: { name: s.name, nameKana: s.nameKana },
      create: {
        email: s.email,
        name: s.name,
        nameKana: s.nameKana,
        role: "student",
      },
    });
  }

  // Update existing student nameKana
  await prisma.user.update({
    where: { email: "student@dev.local" },
    data: { nameKana: "せいと さぶろう" },
  });

  console.log("  Created 9 students + updated student nameKana.");

  // -- Look up all relevant users ----------------------------------------
  const allStudentEmails = [
    "student@dev.local",
    ...newStudents.map((s) => s.email),
  ];
  const users = await Promise.all(
    allStudentEmails.map((email) =>
      prisma.user.findUniqueOrThrow({ where: { email } }),
    ),
  );
  const stu = Object.fromEntries(users.map((u) => [u.email!, u]));

  const teacher = await prisma.user.findUniqueOrThrow({
    where: { email: "teacher@dev.local" },
  });
  const lead = await prisma.user.findUniqueOrThrow({
    where: { email: "lead@dev.local" },
  });

  // =======================================================================
  // 2. Classes (3)
  // =======================================================================
  const class1A = await prisma.class.upsert({
    where: {
      academicYear_gradeYear_className: {
        academicYear: 2025,
        gradeYear: 1,
        className: "A",
      },
    },
    update: { homeroomTeacherId: teacher.id },
    create: {
      academicYear: 2025,
      gradeYear: 1,
      className: "A",
      homeroomTeacherId: teacher.id,
    },
  });

  const class1B = await prisma.class.upsert({
    where: {
      academicYear_gradeYear_className: {
        academicYear: 2025,
        gradeYear: 1,
        className: "B",
      },
    },
    update: { homeroomTeacherId: lead.id },
    create: {
      academicYear: 2025,
      gradeYear: 1,
      className: "B",
      homeroomTeacherId: lead.id,
    },
  });

  await prisma.class.upsert({
    where: {
      academicYear_gradeYear_className: {
        academicYear: 2025,
        gradeYear: 2,
        className: "A",
      },
    },
    update: {},
    create: { academicYear: 2025, gradeYear: 2, className: "A" },
  });

  console.log("  Created 3 classes.");

  // =======================================================================
  // 3. ClassStudent – all 10 → 1-A, s10 + s09 also → 1-B
  // =======================================================================
  // Clear existing assignments for these classes to avoid studentNumber conflicts
  await prisma.classStudent.deleteMany({ where: { classId: class1A.id } });
  await prisma.classStudent.deleteMany({ where: { classId: class1B.id } });

  for (let i = 0; i < allStudentEmails.length; i++) {
    const sid = stu[allStudentEmails[i]].id;
    await prisma.classStudent.create({
      data: {
        classId: class1A.id,
        studentId: sid,
        studentNumber: i + 1,
      },
    });
  }

  // s10 → 1-B (studentNumber 1), s09 → 1-B (studentNumber 2)
  await prisma.classStudent.create({
    data: {
      classId: class1B.id,
      studentId: stu["s10@dev.local"].id,
      studentNumber: 1,
    },
  });
  await prisma.classStudent.create({
    data: {
      classId: class1B.id,
      studentId: stu["s09@dev.local"].id,
      studentNumber: 2,
    },
  });

  console.log("  Assigned students to classes.");

  // =======================================================================
  // 4. TeacherClassAssignment
  // =======================================================================
  await prisma.teacherClassAssignment.upsert({
    where: {
      teacherId_classId_role: {
        teacherId: teacher.id,
        classId: class1A.id,
        role: "homeroom",
      },
    },
    update: {},
    create: { teacherId: teacher.id, classId: class1A.id, role: "homeroom" },
  });
  await prisma.teacherClassAssignment.upsert({
    where: {
      teacherId_classId_role: {
        teacherId: teacher.id,
        classId: class1B.id,
        role: "subject_teacher",
      },
    },
    update: { subject: "english" },
    create: {
      teacherId: teacher.id,
      classId: class1B.id,
      role: "subject_teacher",
      subject: "english",
    },
  });
  await prisma.teacherClassAssignment.upsert({
    where: {
      teacherId_classId_role: {
        teacherId: lead.id,
        classId: class1B.id,
        role: "homeroom",
      },
    },
    update: {},
    create: { teacherId: lead.id, classId: class1B.id, role: "homeroom" },
  });

  console.log("  Created teacher-class assignments.");

  // =======================================================================
  // 5. Semester (2025年度 3学期)
  // =======================================================================
  const semester = await prisma.semester.upsert({
    where: { academicYear_term: { academicYear: 2025, term: 3 } },
    update: {
      startDate: new Date("2026-01-08"),
      endDate: new Date("2026-03-24"),
    },
    create: {
      academicYear: 2025,
      term: 3,
      startDate: new Date("2026-01-08"),
      endDate: new Date("2026-03-24"),
    },
  });

  console.log("  Created semester.");

  // =======================================================================
  // 6. SemesterGoal (渡辺さくら → E10)
  // =======================================================================
  await prisma.semesterGoal.upsert({
    where: {
      studentId_semesterId_subject: {
        studentId: stu["s07@dev.local"].id,
        semesterId: semester.id,
        subject: "english",
      },
    },
    update: { targetGradeId: "E10", status: "in_progress" },
    create: {
      studentId: stu["s07@dev.local"].id,
      semesterId: semester.id,
      subject: "english",
      targetGradeId: "E10",
      status: "in_progress",
    },
  });

  console.log("  Created semester goal.");

  // =======================================================================
  // 7. SchoolCalendar (14 weekdays)
  // =======================================================================
  for (const day of weekdays) {
    await prisma.schoolCalendar.upsert({
      where: { date: day },
      update: { dayType: "school_day", hasMorningTest: true, streakRequired: true },
      create: {
        date: day,
        dayType: "school_day",
        hasMorningTest: true,
        streakRequired: true,
      },
    });
  }

  console.log(`  Created ${weekdays.length} school calendar entries.`);

  // =======================================================================
  // 8. Past QuizDelivery (english, closed – except today which stays active)
  // =======================================================================
  const deliveries: { id: string; date: Date }[] = [];

  for (const day of weekdays) {
    const isToday = day.getTime() === today.getTime();

    // delivery time = JST 8:15 → UTC previous-day 23:15
    const deliveryTime = new Date(day);
    deliveryTime.setUTCHours(23, 15, 0, 0);
    deliveryTime.setUTCDate(deliveryTime.getUTCDate() - 1);

    // deadline time = JST 23:59 → UTC 14:59
    const deadlineTime = new Date(day);
    deadlineTime.setUTCHours(14, 59, 0, 0);

    const existing = await prisma.quizDelivery.findUnique({
      where: { date_subject: { date: day, subject: "english" } },
    });

    if (existing) {
      if (!isToday && existing.status !== "closed") {
        await prisma.quizDelivery.update({
          where: { id: existing.id },
          data: { status: "closed" },
        });
      }
      deliveries.push({ id: existing.id, date: day });
    } else {
      const d = await prisma.quizDelivery.create({
        data: {
          date: day,
          subject: "english",
          deliveryTime,
          deadlineTime,
          status: isToday ? "active" : "closed",
        },
      });
      deliveries.push({ id: d.id, date: day });
    }
  }

  console.log(`  Created/updated ${deliveries.length} quiz deliveries.`);

  // =======================================================================
  // 9. StudentGrade
  // =======================================================================
  const gradeMap: Record<string, { english: string; japanese: string }> = {
    "student@dev.local": { english: "E5", japanese: "J3" },
    "s02@dev.local": { english: "E2", japanese: "J1" },
    "s03@dev.local": { english: "E3", japanese: "J2" },
    "s04@dev.local": { english: "E3", japanese: "J1" },
    "s05@dev.local": { english: "E2", japanese: "J1" },
    "s06@dev.local": { english: "E2", japanese: "J1" },
    "s07@dev.local": { english: "E2", japanese: "J1" },
    "s08@dev.local": { english: "E2", japanese: "J1" },
    "s09@dev.local": { english: "E3", japanese: "J2" },
    "s10@dev.local": { english: "E1", japanese: "J1" },
  };

  for (const [email, grades] of Object.entries(gradeMap)) {
    const student = stu[email];
    for (const [subject, gradeId] of Object.entries(grades)) {
      await prisma.studentGrade.upsert({
        where: {
          studentId_subject: {
            studentId: student.id,
            subject: subject as "english" | "japanese",
          },
        },
        update: { currentGradeId: gradeId },
        create: {
          studentId: student.id,
          subject: subject as "english" | "japanese",
          currentGradeId: gradeId,
        },
      });
    }
  }

  console.log("  Assigned student grades.");

  // =======================================================================
  // 10. PromotionProgress
  // =======================================================================
  // 優等生: 2 consecutive passes toward E6
  await prisma.promotionProgress.upsert({
    where: {
      studentId_subject: {
        studentId: stu["student@dev.local"].id,
        subject: "english",
      },
    },
    update: { targetGradeId: "E6", consecutivePasses: 2 },
    create: {
      studentId: stu["student@dev.local"].id,
      subject: "english",
      targetGradeId: "E6",
      consecutivePasses: 2,
    },
  });

  // 昇格停滞 (s05): 0 consecutive passes (stuck)
  await prisma.promotionProgress.upsert({
    where: {
      studentId_subject: {
        studentId: stu["s05@dev.local"].id,
        subject: "english",
      },
    },
    update: { targetGradeId: "E3", consecutivePasses: 0 },
    create: {
      studentId: stu["s05@dev.local"].id,
      subject: "english",
      targetGradeId: "E3",
      consecutivePasses: 0,
    },
  });

  console.log("  Created promotion progress.");

  // =======================================================================
  // 11. StudentStreak
  // =======================================================================
  const streakDefs = [
    { email: "student@dev.local", cur: 15, max: 15, flame: 3 },
    { email: "s02@dev.local", cur: 0, max: 8, flame: 0 },
    { email: "s03@dev.local", cur: 5, max: 10, flame: 1 },
    { email: "s04@dev.local", cur: 0, max: 12, flame: 0 },
    { email: "s05@dev.local", cur: 3, max: 6, flame: 1 },
    { email: "s06@dev.local", cur: 2, max: 5, flame: 0 },
    { email: "s07@dev.local", cur: 4, max: 7, flame: 1 },
    { email: "s08@dev.local", cur: 3, max: 3, flame: 1 },
    { email: "s09@dev.local", cur: 7, max: 7, flame: 2 },
    { email: "s10@dev.local", cur: 1, max: 2, flame: 0 },
  ] as const;

  for (const sd of streakDefs) {
    const student = stu[sd.email];
    const lastActivity = sd.cur > 0 ? today : daysAgo(today, 2);
    const streakStart = sd.cur > 0 ? daysAgo(today, sd.cur - 1) : null;

    await prisma.studentStreak.upsert({
      where: { studentId: student.id },
      update: {
        currentStreak: sd.cur,
        maxStreak: sd.max,
        flameLevel: sd.flame,
        lastActivityDate: lastActivity,
        streakStartDate: streakStart,
      },
      create: {
        studentId: student.id,
        currentStreak: sd.cur,
        maxStreak: sd.max,
        flameLevel: sd.flame,
        lastActivityDate: lastActivity,
        streakStartDate: streakStart,
      },
    });
  }

  console.log("  Created student streaks.");

  // =======================================================================
  // 12. StreakDailyLog
  // =======================================================================
  for (const sd of streakDefs) {
    const student = stu[sd.email];
    if (sd.cur > 0) {
      // "attended" logs for each day of the current streak (weekdays only)
      let logged = 0;
      let offset = 0;
      while (logged < sd.cur && offset < sd.cur + 10) {
        const date = daysAgo(today, offset);
        const dow = date.getUTCDay();
        if (dow >= 1 && dow <= 5) {
          await prisma.streakDailyLog.upsert({
            where: { studentId_date: { studentId: student.id, date } },
            update: {
              status: "attended",
              streakCountAfter: sd.cur - logged,
            },
            create: {
              studentId: student.id,
              date,
              status: "attended",
              streakCountAfter: sd.cur - logged,
            },
          });
          logged++;
        }
        offset++;
      }
    } else if (sd.max > 0) {
      // Students who lost their streak: add a few "missed" entries
      for (let i = 0; i < 3; i++) {
        const date = daysAgo(today, i);
        const dow = date.getUTCDay();
        if (dow >= 1 && dow <= 5) {
          await prisma.streakDailyLog.upsert({
            where: { studentId_date: { studentId: student.id, date } },
            update: { status: "missed", streakCountAfter: 0 },
            create: {
              studentId: student.id,
              date,
              status: "missed",
              streakCountAfter: 0,
            },
          });
        }
      }
    }
  }

  console.log("  Created streak daily logs.");

  // =======================================================================
  // 13. QuizAttempt + QuizAnswer
  // =======================================================================
  // Load sample english words for answer data
  const sampleWords = await prisma.word.findMany({
    where: { subject: "english" },
    orderBy: { wordNumber: "asc" },
    take: 50,
  });

  if (sampleWords.length < 10) {
    console.warn(
      "  Not enough sample words for quiz answers. Skipping quiz history.",
    );
    return;
  }

  /**
   * Create one quiz attempt (10 questions) if it doesn't already exist.
   * For morning_test, uniqueness = studentId + deliveryId.
   * For quick/promotion, uniqueness = studentId + mode + startedAt day.
   */
  async function ensureAttempt(opts: {
    deliveryId: string | null;
    studentId: string;
    gradeId: string;
    mode: "morning_test" | "quick" | "promotion";
    date: Date;
    scorePercent: number;
  }) {
    const { deliveryId, studentId, gradeId, mode, date, scorePercent } = opts;

    // Idempotency check
    if (deliveryId) {
      const existing = await prisma.quizAttempt.findFirst({
        where: { studentId, deliveryId },
      });
      if (existing) return;
    } else {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      const existing = await prisma.quizAttempt.findFirst({
        where: {
          studentId,
          mode,
          startedAt: { gte: dayStart, lt: dayEnd },
        },
      });
      if (existing) return;
    }

    const numQ = 10;
    const numCorrect = Math.round((numQ * scorePercent) / 100);
    const isPassed = scorePercent >= 80;

    // startedAt = JST 8:20 → UTC previous-day 23:20
    const startedAt = new Date(date);
    startedAt.setUTCHours(23, 20, 0, 0);
    startedAt.setUTCDate(startedAt.getUTCDate() - 1);

    const submittedAt = new Date(startedAt);
    submittedAt.setUTCMinutes(submittedAt.getUTCMinutes() + 5);

    const attempt = await prisma.quizAttempt.create({
      data: {
        deliveryId,
        studentId,
        gradeId,
        mode,
        startedAt,
        submittedAt,
        score: numCorrect,
        scorePercentage: scorePercent,
        isPassed,
      },
    });

    // 10 answers using sample words
    const words = sampleWords.slice(0, numQ);
    const answerData = words.map((w, i) => {
      const isCorrect = i < numCorrect;
      return {
        attemptId: attempt.id,
        wordId: w.id,
        questionDirection: "en_to_ja" as const,
        correctOption: w.meaning,
        selectedOption: isCorrect ? w.meaning : "不正解の選択肢",
        allOptions: [w.meaning, "選択肢A", "選択肢B", "選択肢C"],
        isCorrect,
        timeSpentMs: 3000 + Math.floor(Math.random() * 5000),
        answeredAt: new Date(startedAt.getTime() + (i + 1) * 30_000),
      };
    });

    await prisma.quizAnswer.createMany({ data: answerData });
  }

  // -- 優等生 (student@dev.local): past 10 morning tests @ 90%, 2 quick --
  const devId = stu["student@dev.local"].id;
  for (let i = 0; i < 10 && i < deliveries.length; i++) {
    const d = deliveries[deliveries.length - 1 - i];
    await ensureAttempt({
      deliveryId: d.id,
      studentId: devId,
      gradeId: "E5",
      mode: "morning_test",
      date: d.date,
      scorePercent: 90,
    });
  }
  for (let i = 0; i < 2; i++) {
    await ensureAttempt({
      deliveryId: null,
      studentId: devId,
      gradeId: "E5",
      mode: "quick",
      date: daysAgo(today, i + 1),
      scorePercent: 80,
    });
  }

  // -- 連続未受験 (s02): morning tests only for days 5-9 (skip last 4) --
  const s02Id = stu["s02@dev.local"].id;
  for (let i = 5; i < 10 && i < deliveries.length; i++) {
    const d = deliveries[deliveries.length - 1 - i];
    await ensureAttempt({
      deliveryId: d.id,
      studentId: s02Id,
      gradeId: "E2",
      mode: "morning_test",
      date: d.date,
      scorePercent: 70 + (i % 3) * 5, // 70-80 range
    });
  }

  // -- 正答率低下 (s03): week1=80, week2=60, week3=50 -------------------
  const s03Id = stu["s03@dev.local"].id;
  for (let i = 0; i < deliveries.length; i++) {
    let pct: number;
    if (i < 4) pct = 80; // oldest week
    else if (i < 9) pct = 60; // middle week
    else pct = 50; // most recent
    await ensureAttempt({
      deliveryId: deliveries[i].id,
      studentId: s03Id,
      gradeId: "E3",
      mode: "morning_test",
      date: deliveries[i].date,
      scorePercent: pct,
    });
  }

  // -- ストリーク途絶 (s04): attended earlier, stopped recently ----------
  const s04Id = stu["s04@dev.local"].id;
  for (let i = 3; i < 10 && i < deliveries.length; i++) {
    const d = deliveries[deliveries.length - 1 - i];
    await ensureAttempt({
      deliveryId: d.id,
      studentId: s04Id,
      gradeId: "E3",
      mode: "morning_test",
      date: d.date,
      scorePercent: 75,
    });
  }

  // -- 昇格停滞 (s05): 3 promotion failures + 5 morning tests ----------
  const s05Id = stu["s05@dev.local"].id;
  for (let i = 0; i < 3; i++) {
    await ensureAttempt({
      deliveryId: null,
      studentId: s05Id,
      gradeId: "E3",
      mode: "promotion",
      date: daysAgo(today, i + 1),
      scorePercent: 60 + i * 5, // 60, 65, 70 — all below 80
    });
  }
  for (let i = 0; i < 5 && i < deliveries.length; i++) {
    const d = deliveries[deliveries.length - 1 - i];
    await ensureAttempt({
      deliveryId: d.id,
      studentId: s05Id,
      gradeId: "E2",
      mode: "morning_test",
      date: d.date,
      scorePercent: 70,
    });
  }

  // -- 自学習なし (s06): only morning tests, no quick/promotion ---------
  const s06Id = stu["s06@dev.local"].id;
  for (let i = 0; i < 5 && i < deliveries.length; i++) {
    const d = deliveries[deliveries.length - 1 - i];
    await ensureAttempt({
      deliveryId: d.id,
      studentId: s06Id,
      gradeId: "E2",
      mode: "morning_test",
      date: d.date,
      scorePercent: 70,
    });
  }

  // -- 目標達成危険 (s07): few morning tests, low scores ----------------
  const s07Id = stu["s07@dev.local"].id;
  for (let i = 0; i < 3 && i < deliveries.length; i++) {
    const d = deliveries[deliveries.length - 1 - i];
    await ensureAttempt({
      deliveryId: d.id,
      studentId: s07Id,
      gradeId: "E2",
      mode: "morning_test",
      date: d.date,
      scorePercent: 60,
    });
  }

  // -- 普通 (s08): 4 morning tests @ 75% --------------------------------
  const s08Id = stu["s08@dev.local"].id;
  for (let i = 0; i < 4 && i < deliveries.length; i++) {
    const d = deliveries[deliveries.length - 1 - i];
    await ensureAttempt({
      deliveryId: d.id,
      studentId: s08Id,
      gradeId: "E2",
      mode: "morning_test",
      date: d.date,
      scorePercent: 80, // 8/10
    });
  }

  // -- 普通 (s09): 7 morning tests @ 80% --------------------------------
  const s09Id = stu["s09@dev.local"].id;
  for (let i = 0; i < 7 && i < deliveries.length; i++) {
    const d = deliveries[deliveries.length - 1 - i];
    await ensureAttempt({
      deliveryId: d.id,
      studentId: s09Id,
      gradeId: "E3",
      mode: "morning_test",
      date: d.date,
      scorePercent: 80,
    });
  }

  console.log("  Created quiz attempts & answers.");

  // =======================================================================
  // 14. TeacherNote (2)
  // =======================================================================
  const existingNote1 = await prisma.teacherNote.findFirst({
    where: {
      teacherId: teacher.id,
      studentId: stu["student@dev.local"].id,
    },
  });
  if (!existingNote1) {
    await prisma.teacherNote.create({
      data: {
        teacherId: teacher.id,
        studentId: stu["student@dev.local"].id,
        content: "学習意欲が高い。自学習も積極的。",
      },
    });
  }

  const existingNote2 = await prisma.teacherNote.findFirst({
    where: {
      teacherId: teacher.id,
      studentId: stu["s02@dev.local"].id,
    },
  });
  if (!existingNote2) {
    await prisma.teacherNote.create({
      data: {
        teacherId: teacher.id,
        studentId: stu["s02@dev.local"].id,
        content: "最近欠席が目立つ。面談予定。",
      },
    });
  }

  console.log("  Created teacher notes.");
  console.log("Sprint 6 test data seeded!");
}
