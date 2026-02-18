import type { Subject } from "../../src/generated/prisma/client";

interface WordData {
  wordNumber: number;
  subject: Subject;
  word: string;
  meaning: string;
  partOfSpeech: string;
  gradeId: string;
  categoryTags: string[];
}

const englishSampleWords: Omit<WordData, "subject">[] = [
  // E1: words 1-50 (sample 5)
  { wordNumber: 1, word: "apple", meaning: "りんご", partOfSpeech: "noun", gradeId: "E1", categoryTags: ["food", "fruit"] },
  { wordNumber: 2, word: "book", meaning: "本", partOfSpeech: "noun", gradeId: "E1", categoryTags: ["object", "education"] },
  { wordNumber: 3, word: "cat", meaning: "猫", partOfSpeech: "noun", gradeId: "E1", categoryTags: ["animal"] },
  { wordNumber: 4, word: "dog", meaning: "犬", partOfSpeech: "noun", gradeId: "E1", categoryTags: ["animal"] },
  { wordNumber: 5, word: "eat", meaning: "食べる", partOfSpeech: "verb", gradeId: "E1", categoryTags: ["action", "food"] },
  // E2: words 51-100 (sample 5)
  { wordNumber: 51, word: "family", meaning: "家族", partOfSpeech: "noun", gradeId: "E2", categoryTags: ["people", "relationship"] },
  { wordNumber: 52, word: "garden", meaning: "庭", partOfSpeech: "noun", gradeId: "E2", categoryTags: ["place", "nature"] },
  { wordNumber: 53, word: "happy", meaning: "幸せな", partOfSpeech: "adjective", gradeId: "E2", categoryTags: ["emotion"] },
  { wordNumber: 54, word: "island", meaning: "島", partOfSpeech: "noun", gradeId: "E2", categoryTags: ["place", "nature"] },
  { wordNumber: 55, word: "jump", meaning: "跳ぶ", partOfSpeech: "verb", gradeId: "E2", categoryTags: ["action", "movement"] },
  // E3: words 101-150 (sample 5)
  { wordNumber: 101, word: "kitchen", meaning: "台所", partOfSpeech: "noun", gradeId: "E3", categoryTags: ["place", "home"] },
  { wordNumber: 102, word: "library", meaning: "図書館", partOfSpeech: "noun", gradeId: "E3", categoryTags: ["place", "education"] },
  { wordNumber: 103, word: "mountain", meaning: "山", partOfSpeech: "noun", gradeId: "E3", categoryTags: ["nature", "place"] },
  { wordNumber: 104, word: "nature", meaning: "自然", partOfSpeech: "noun", gradeId: "E3", categoryTags: ["nature"] },
  { wordNumber: 105, word: "ocean", meaning: "海", partOfSpeech: "noun", gradeId: "E3", categoryTags: ["nature", "place"] },
  // E4: words 151-200 (sample 5)
  { wordNumber: 151, word: "patient", meaning: "忍耐強い", partOfSpeech: "adjective", gradeId: "E4", categoryTags: ["personality"] },
  { wordNumber: 152, word: "quickly", meaning: "素早く", partOfSpeech: "adverb", gradeId: "E4", categoryTags: ["speed"] },
  { wordNumber: 153, word: "remember", meaning: "覚えている", partOfSpeech: "verb", gradeId: "E4", categoryTags: ["action", "mind"] },
  { wordNumber: 154, word: "strange", meaning: "奇妙な", partOfSpeech: "adjective", gradeId: "E4", categoryTags: ["description"] },
  { wordNumber: 155, word: "travel", meaning: "旅行する", partOfSpeech: "verb", gradeId: "E4", categoryTags: ["action", "movement"] },
  // E6: words 201-250 (sample 5)
  { wordNumber: 201, word: "abandon", meaning: "捨てる", partOfSpeech: "verb", gradeId: "E6", categoryTags: ["action"] },
  { wordNumber: 202, word: "benefit", meaning: "利益", partOfSpeech: "noun", gradeId: "E6", categoryTags: ["abstract"] },
  { wordNumber: 203, word: "climate", meaning: "気候", partOfSpeech: "noun", gradeId: "E6", categoryTags: ["nature", "weather"] },
  { wordNumber: 204, word: "debate", meaning: "討論", partOfSpeech: "noun", gradeId: "E6", categoryTags: ["communication"] },
  { wordNumber: 205, word: "emotion", meaning: "感情", partOfSpeech: "noun", gradeId: "E6", categoryTags: ["emotion"] },
];

const japaneseSampleWords: Omit<WordData, "subject">[] = [
  // J1: words 1-50 (sample 5)
  { wordNumber: 1, word: "曖昧", meaning: "あいまいなこと", partOfSpeech: "名詞・形容動詞", gradeId: "J1", categoryTags: ["抽象概念"] },
  { wordNumber: 2, word: "暗黙", meaning: "だまっていること", partOfSpeech: "名詞", gradeId: "J1", categoryTags: ["抽象概念", "コミュニケーション"] },
  { wordNumber: 3, word: "威厳", meaning: "おごそかでおかしがたいこと", partOfSpeech: "名詞", gradeId: "J1", categoryTags: ["性格・態度"] },
  { wordNumber: 4, word: "一概に", meaning: "すべてをひとまとめにして", partOfSpeech: "副詞", gradeId: "J1", categoryTags: ["表現"] },
  { wordNumber: 5, word: "一挙に", meaning: "いっぺんに", partOfSpeech: "副詞", gradeId: "J1", categoryTags: ["表現", "スピード"] },
  // J2: words 51-100 (sample 5)
  { wordNumber: 51, word: "概念", meaning: "おおまかな意味内容", partOfSpeech: "名詞", gradeId: "J2", categoryTags: ["抽象概念", "思考"] },
  { wordNumber: 52, word: "快挙", meaning: "愉快な行為", partOfSpeech: "名詞", gradeId: "J2", categoryTags: ["行動", "達成"] },
  { wordNumber: 53, word: "懐疑", meaning: "うたがうこと", partOfSpeech: "名詞", gradeId: "J2", categoryTags: ["思考", "感情"] },
  { wordNumber: 54, word: "格差", meaning: "格式・等級の差", partOfSpeech: "名詞", gradeId: "J2", categoryTags: ["社会"] },
  { wordNumber: 55, word: "確信", meaning: "かたく信じること", partOfSpeech: "名詞", gradeId: "J2", categoryTags: ["思考", "感情"] },
  // J3: words 101-150 (sample 5)
  { wordNumber: 101, word: "見解", meaning: "ある物事についての考え", partOfSpeech: "名詞", gradeId: "J3", categoryTags: ["思考", "コミュニケーション"] },
  { wordNumber: 102, word: "顕著", meaning: "きわだって目立つさま", partOfSpeech: "形容動詞", gradeId: "J3", categoryTags: ["表現"] },
  { wordNumber: 103, word: "貢献", meaning: "ある物事に力をつくすこと", partOfSpeech: "名詞", gradeId: "J3", categoryTags: ["行動", "社会"] },
  { wordNumber: 104, word: "克服", meaning: "困難に打ち勝つこと", partOfSpeech: "名詞", gradeId: "J3", categoryTags: ["行動", "達成"] },
  { wordNumber: 105, word: "根拠", meaning: "判断のよりどころ", partOfSpeech: "名詞", gradeId: "J3", categoryTags: ["思考", "論理"] },
  // J4: words 151-200 (sample 5)
  { wordNumber: 151, word: "錯覚", meaning: "思い違い", partOfSpeech: "名詞", gradeId: "J4", categoryTags: ["思考", "感覚"] },
  { wordNumber: 152, word: "暫定", meaning: "正式に決まるまでの間", partOfSpeech: "名詞", gradeId: "J4", categoryTags: ["時間", "状態"] },
  { wordNumber: 153, word: "思慮", meaning: "注意深く考えること", partOfSpeech: "名詞", gradeId: "J4", categoryTags: ["思考"] },
  { wordNumber: 154, word: "充実", meaning: "中身が十分に満たされること", partOfSpeech: "名詞", gradeId: "J4", categoryTags: ["状態", "感情"] },
  { wordNumber: 155, word: "収拾", meaning: "混乱をおさめること", partOfSpeech: "名詞", gradeId: "J4", categoryTags: ["行動", "状態"] },
];

export function getSampleWords(): WordData[] {
  return [
    ...englishSampleWords.map((w) => ({ ...w, subject: "english" as Subject })),
    ...japaneseSampleWords.map((w) => ({ ...w, subject: "japanese" as Subject })),
  ];
}
