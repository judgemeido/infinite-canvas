// 诗词接龙题库：小学课本常见古诗的「上句 → 下句」，用于第一关的选择闯关。
export type PoemChainQuestion = {
    id: string;
    /** 出处（作者·篇名），答对后展示 */
    source: string;
    /** 上句（题面） */
    prompt: string;
    /** 正确的下句 */
    answer: string;
};

export const poemChainQuestions: PoemChainQuestion[] = [
    { id: "q1", source: "李白《静夜思》", prompt: "床前明月光，", answer: "疑是地上霜。" },
    { id: "q2", source: "李白《静夜思》", prompt: "举头望明月，", answer: "低头思故乡。" },
    { id: "q3", source: "孟浩然《春晓》", prompt: "春眠不觉晓，", answer: "处处闻啼鸟。" },
    { id: "q4", source: "孟浩然《春晓》", prompt: "夜来风雨声，", answer: "花落知多少。" },
    { id: "q5", source: "王之涣《登鹳雀楼》", prompt: "白日依山尽，", answer: "黄河入海流。" },
    { id: "q6", source: "王之涣《登鹳雀楼》", prompt: "欲穷千里目，", answer: "更上一层楼。" },
    { id: "q7", source: "李绅《悯农》", prompt: "锄禾日当午，", answer: "汗滴禾下土。" },
    { id: "q8", source: "李绅《悯农》", prompt: "谁知盘中餐，", answer: "粒粒皆辛苦。" },
    { id: "q9", source: "骆宾王《咏鹅》", prompt: "白毛浮绿水，", answer: "红掌拨清波。" },
    { id: "q10", source: "杜甫《绝句》", prompt: "两个黄鹂鸣翠柳，", answer: "一行白鹭上青天。" },
];

/** 洗牌 */
function shuffle<T>(list: T[]): T[] {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/** 为某道题生成 4 个选项（1 正确 + 3 来自其它题下句的干扰项），并打乱顺序 */
export function buildOptions(question: PoemChainQuestion): string[] {
    const distractors = shuffle(poemChainQuestions.filter((item) => item.id !== question.id).map((item) => item.answer)).slice(0, 3);
    return shuffle([question.answer, ...distractors]);
}

/** 每局随机抽取的题目数量 */
export const POEM_CHAIN_ROUND_COUNT = 6;

/** 随机抽取一局题目 */
export function drawRound(): PoemChainQuestion[] {
    return shuffle(poemChainQuestions).slice(0, POEM_CHAIN_ROUND_COUNT);
}
