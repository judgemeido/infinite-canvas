import { POEM_CORPUS, type Poem } from "./poem-corpus";

// 古诗词大闯关题库引擎：从「诗词语料库」按多种题型自动生成题目，覆盖小学到初中 1~9 年级。
// 题型：chain 接龙 / meaning 看意思猜古诗 / identify 识句猜篇名 / author 看作者猜诗句 /
//       byAuthor 看诗句猜作者 / byDynasty 看诗句猜朝代 / multi 根据题意多选古诗。
export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const GRADES: Grade[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export type QuestionType = "chain" | "meaning" | "identify" | "author" | "byAuthor" | "byDynasty" | "multi";

export type Question = {
    id: string;
    grade: Grade;
    type: QuestionType;
    /** 是否多选题 */
    multi: boolean;
    /** 题面 */
    stem: string;
    /** 选项（已打乱） */
    options: string[];
    /** 正确答案（多选可多个） */
    answers: string[];
    /** 选错后展示的提示 */
    hint: string;
    /** 出处（答对后展示） */
    source: string;
};

/** 每题选项数 */
const OPTION_COUNT = 4;
/** 每局抽取题目数量 */
export const POEM_CHAIN_ROUND_COUNT = 15;
/** 每答对一题的基础积分 */
export const POEM_CHAIN_POINTS_PER_QUESTION = 10;
/** 一局满分 */
export const POEM_CHAIN_ROUND_FULL_SCORE = POEM_CHAIN_ROUND_COUNT * POEM_CHAIN_POINTS_PER_QUESTION;

// 难度系统：每个年级可选简单/普通/困难，越难题型越偏推理、每题积分越高。
export type Difficulty = "easy" | "normal" | "hard";

export const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

/** 各难度的可用题型与难度系数（系数越高每题分越高，结算权重越大） */
export const DIFFICULTY_META: Record<Difficulty, { weight: number; types: QuestionType[] }> = {
    // 简单：直接识记类题型
    easy: { weight: 1, types: ["chain", "identify", "byAuthor"] },
    // 普通：全部单选题型混合
    normal: { weight: 1.5, types: ["chain", "meaning", "identify", "author", "byAuthor", "byDynasty"] },
    // 困难：偏重理解、推理与多选
    hard: { weight: 2, types: ["meaning", "author", "byDynasty", "multi"] },
};

/** 某难度下每答对一题获得的积分 */
export function perQuestionPoints(difficulty: Difficulty): number {
    return Math.round(POEM_CHAIN_POINTS_PER_QUESTION * DIFFICULTY_META[difficulty].weight);
}

/** 结算明细：供「AI 公平结算」展示各项权重 */
export type Settlement = {
    correct: number;
    total: number;
    /** 本局原始得分（答对数 × 每题分） */
    roundRaw: number;
    /** 难度系数 */
    difficultyWeight: number;
    /** 年级权重（年级越高略高） */
    gradeWeight: number;
    /** 准确率加成 */
    accuracyBonus: number;
    /** 结算后最终得分 */
    final: number;
};

/** 公平结算算法：原始分 × 年级权重 × 准确率加成 */
export function computeSettlement(params: { correct: number; total: number; grade: Grade; difficulty: Difficulty }): Settlement {
    const { correct, total, grade, difficulty } = params;
    const difficultyWeight = DIFFICULTY_META[difficulty].weight;
    const roundRaw = correct * perQuestionPoints(difficulty);
    const gradeWeight = Number((1 + (grade - 1) * 0.05).toFixed(2));
    const accuracy = total ? correct / total : 0;
    const accuracyBonus = accuracy >= 1 ? 1.2 : accuracy >= 0.8 ? 1.1 : 1;
    const final = Math.round(roundRaw * gradeWeight * accuracyBonus);
    return { correct, total, roundRaw, difficultyWeight, gradeWeight, accuracyBonus, final };
}

function shuffle<T>(list: T[]): T[] {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/** 从候选池里挑选 count 个不与已用项重复的干扰项 */
function pickDistractors(pool: string[], used: Set<string>, count: number): string[] {
    const result: string[] = [];
    for (const item of shuffle(pool)) {
        if (result.length >= count) break;
        if (!item || used.has(item)) continue;
        used.add(item);
        result.push(item);
    }
    return result;
}

/** 朝代干扰项兜底池：单一朝代的年级也能凑齐可信的错误选项 */
const FALLBACK_DYNASTIES = ["唐", "宋", "元", "明", "清", "汉", "南北朝", "东晋", "东汉", "魏"];

function title(poem: Poem) {
    return `《${poem.title}》`;
}

function buildSingle(id: string, grade: Grade, type: QuestionType, stem: string, answer: string, distractors: string[], hint: string, source: string): Question | null {
    if (distractors.length < OPTION_COUNT - 1) return null;
    return { id, grade, type, multi: false, stem, options: shuffle([answer, ...distractors]), answers: [answer], hint, source };
}

/** 为某个年级生成完整题库 */
function generateForGrade(grade: Grade): Question[] {
    const poems = POEM_CORPUS.filter((poem) => poem.grade === grade);
    const allLines = poems.flatMap((poem) => poem.lines);
    const allTitles = poems.map(title);
    const allAuthors = Array.from(new Set(poems.map((poem) => poem.author)));
    const allDynasties = Array.from(new Set(poems.map((poem) => poem.dynasty)));
    const questions: Question[] = [];

    poems.forEach((poem) => {
        const src = `${poem.dynasty}·${poem.author}${title(poem)}`;
        const key = poem.lines[0];
        // 接龙：上句 → 下句
        for (let i = 0; i < poem.lines.length - 1; i++) {
            const answer = poem.lines[i + 1];
            const q = buildSingle(`${poem.id}-chain-${i}`, grade, "chain", poem.lines[i], answer, pickDistractors(allLines, new Set([poem.lines[i], answer]), OPTION_COUNT - 1), `出自${src}`, src);
            if (q) questions.push(q);
        }
        // 看意思猜古诗：白话大意 → 篇名
        const meaning = buildSingle(`${poem.id}-meaning`, grade, "meaning", `诗句大意：「${poem.paraphrase}」，这出自哪一篇？`, title(poem), pickDistractors(allTitles, new Set([title(poem)]), OPTION_COUNT - 1), `作者：${poem.dynasty}·${poem.author}`, src);
        if (meaning) questions.push(meaning);
        // 识句猜篇名：名句 → 篇名
        const identify = buildSingle(`${poem.id}-identify`, grade, "identify", `「${key}」出自哪一篇？`, title(poem), pickDistractors(allTitles, new Set([title(poem)]), OPTION_COUNT - 1), `作者：${poem.author}`, src);
        if (identify) questions.push(identify);
        // 看作者猜诗句：作者 → 诗句
        const author = buildSingle(`${poem.id}-author`, grade, "author", `${poem.dynasty}·${poem.author}笔下的诗句是哪一句？`, key, pickDistractors(allLines.filter((line) => !poem.lines.includes(line)), new Set([key]), OPTION_COUNT - 1), `篇名：${title(poem)}`, src);
        if (author) questions.push(author);
        // 看诗句猜作者
        const byAuthor = buildSingle(`${poem.id}-byAuthor`, grade, "byAuthor", `「${key}」的作者是谁？`, poem.author, pickDistractors(allAuthors, new Set([poem.author]), OPTION_COUNT - 1), `出自${title(poem)}`, src);
        if (byAuthor) questions.push(byAuthor);
        // 看诗句猜朝代
        const byDynasty = buildSingle(`${poem.id}-byDynasty`, grade, "byDynasty", `「${key}」是哪个朝代的作品？`, poem.dynasty, pickDistractors([...allDynasties, ...FALLBACK_DYNASTIES], new Set([poem.dynasty]), OPTION_COUNT - 1), `${poem.author}${title(poem)}`, src);
        if (byDynasty) questions.push(byDynasty);
    });

    // 根据题意多选古诗：同一主题下选出全部相关诗句
    const tags = Array.from(new Set(poems.flatMap((poem) => poem.tags)));
    tags.forEach((tag, idx) => {
        const matched = poems.filter((poem) => poem.tags.includes(tag));
        const others = poems.filter((poem) => !poem.tags.includes(tag));
        if (matched.length < 2 || others.length < 1) return;
        const correct = shuffle(matched).slice(0, 3).map((poem) => poem.lines[0]);
        const wrong = pickDistractors(shuffle(others).flatMap((poem) => poem.lines), new Set(correct), Math.min(3, OPTION_COUNT));
        if (correct.length < 2 || wrong.length < 1) return;
        questions.push({
            id: `multi-${grade}-${idx}`,
            grade,
            type: "multi",
            multi: true,
            stem: `下列哪些诗句与「${tag}」有关？（多选）`,
            options: shuffle([...correct, ...wrong]),
            answers: correct,
            hint: `共有 ${correct.length} 句与「${tag}」相关`,
            source: `主题：${tag}`,
        });
    });

    return questions;
}

// 一次性生成并缓存全部年级题库
const BANK: Record<number, Question[]> = {};
GRADES.forEach((grade) => {
    BANK[grade] = generateForGrade(grade);
});

/** 某年级题库总题量 */
export function bankSize(grade: Grade): number {
    return BANK[grade]?.length ?? 0;
}

/** 判断多选/单选作答是否完全正确 */
export function isCorrect(question: Question, picked: string[]): boolean {
    if (picked.length !== question.answers.length) return false;
    return question.answers.every((answer) => picked.includes(answer));
}

/** 正确答案文本（多选用「、」连接），用于答错后展示 */
export function answerText(question: Question): string {
    return question.answers.join("、");
}

/** 按年级+难度随机抽取一局题目：只取该难度允许的题型，尽量混合，共 POEM_CHAIN_ROUND_COUNT 题 */
export function drawRoundByGrade(grade: Grade, difficulty: Difficulty): Question[] {
    const allowed = new Set(DIFFICULTY_META[difficulty].types);
    let all = (BANK[grade] ?? []).filter((question) => allowed.has(question.type));
    // 兜底：某年级该难度题型不足一局时，放开为全部题型
    if (all.length < POEM_CHAIN_ROUND_COUNT) all = BANK[grade] ?? [];
    if (all.length <= POEM_CHAIN_ROUND_COUNT) return shuffle(all);
    const byType = new Map<QuestionType, Question[]>();
    shuffle(all).forEach((question) => {
        const list = byType.get(question.type) ?? [];
        list.push(question);
        byType.set(question.type, list);
    });
    const buckets = shuffle(Array.from(byType.values()));
    const picked: Question[] = [];
    let progress = true;
    while (picked.length < POEM_CHAIN_ROUND_COUNT && progress) {
        progress = false;
        for (const bucket of buckets) {
            if (picked.length >= POEM_CHAIN_ROUND_COUNT) break;
            const next = bucket.shift();
            if (next) {
                picked.push(next);
                progress = true;
            }
        }
    }
    return shuffle(picked);
}
