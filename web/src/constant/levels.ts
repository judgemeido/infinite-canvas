// 闯关模式的关卡数据。新增关卡只需往 levels 数组追加一项，首页会自动识别并按 type 决定进入哪种玩法。
export type LevelType = "poem-chain" | "image";

export type Level = {
    id: string;
    /** 关卡序号，从 1 开始，用于显示「第 N 关」 */
    order: number;
    /** 玩法类型：poem-chain=诗词接龙小游戏，image=生图挑战 */
    type: LevelType;
    /** 关卡名 */
    name: string;
    /** 封面示例图；不填则首页用渐变占位（诗词接龙这类无示例图的关卡） */
    cover?: string;
    /** 引导诗词/主题 */
    poem: string;
    /** 一句话引导语 */
    intro: string;
    /** 挑战任务描述 */
    task: string;
    /** 生图关卡进入时预填到提示词框的起手 prompt */
    starterPrompt?: string;
};

export const levels: Level[] = [
    {
        id: "poem-chain",
        order: 1,
        type: "poem-chain",
        name: "古诗词大闯关",
        cover: "/levels/poem-chain.png",
        poem: "读经典古诗词，接龙、猜意、辨作者、多选样样来。",
        intro: "1~9 年级分级出题，接龙、看意思猜古诗、看作者猜诗句、多选等多种玩法！",
        task: "选好年级，答对更多题闯关",
    },
    {
        id: "west-lake-poem",
        order: 2,
        type: "image",
        name: "以诗为墨·神笔绘卷",
        cover: "https://webpic.235737.xyz/fcode_pic/pdhpicture/1786591780_91e6eb.png",
        poem: "欲把西湖比西子，淡妆浓抹总相宜。",
        intro: "将古人的诗词作诗成画！",
        task: "指挥 AIGC 搞定大片级场景重构",
        starterPrompt:
            "国风水墨意境，烟雨西湖，远山含黛，湖面薄雾轻笼，一叶扁舟静泊，岸边垂柳与断桥若隐若现，淡妆浓抹的江南韵味，水墨渲染与留白结合，电影级构图，唯美空灵，高清细节。",
    },
];

/** 按 id 取关卡 */
export function findLevel(id: string | undefined | null): Level | undefined {
    if (!id) return undefined;
    return levels.find((level) => level.id === id);
}

/** 关卡是否解锁。当前两关均开放，方便自由体验；后续如需按顺序解锁可在此加入 completedIds 判定。 */
export function isLevelUnlocked(_level: Level, _completedIds: string[]): boolean {
    return true;
}
