import { create } from "zustand";
import { persist } from "zustand/middleware";

// 闯关进度：记录已通关关卡与当前选中的关卡。通关状态本地持久化。
type LevelsStore = {
    completedLevelIds: string[];
    activeLevelId: string;
    /** 古诗词大闯关累计总分（跨年级、跨多局累加） */
    poemScore: number;
    /** 古诗词大闯关已完成局数 */
    poemRounds: number;
    selectLevel: (id: string) => void;
    markCompleted: (id: string) => void;
    clearActiveLevel: () => void;
    /** 完成一局后累加本局得分并记一局 */
    addPoemScore: (points: number) => void;
    /** 清零累计积分与局数 */
    resetPoemScore: () => void;
};

export const useLevelsStore = create<LevelsStore>()(
    persist(
        (set) => ({
            completedLevelIds: [],
            activeLevelId: "",
            poemScore: 0,
            poemRounds: 0,
            selectLevel: (id) => set({ activeLevelId: id }),
            markCompleted: (id) =>
                set((state) => (state.completedLevelIds.includes(id) ? state : { completedLevelIds: [...state.completedLevelIds, id] })),
            clearActiveLevel: () => set({ activeLevelId: "" }),
            addPoemScore: (points) => set((state) => ({ poemScore: state.poemScore + points, poemRounds: state.poemRounds + 1 })),
            resetPoemScore: () => set({ poemScore: 0, poemRounds: 0 }),
        }),
        {
            name: "infinite-canvas:levels_store",
            partialize: (state) => ({ completedLevelIds: state.completedLevelIds, poemScore: state.poemScore, poemRounds: state.poemRounds }),
        },
    ),
);
