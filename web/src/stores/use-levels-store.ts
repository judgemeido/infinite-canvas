import { create } from "zustand";
import { persist } from "zustand/middleware";

// 闯关进度：记录已通关关卡与当前选中的关卡。通关状态本地持久化。
type LevelsStore = {
    completedLevelIds: string[];
    activeLevelId: string;
    selectLevel: (id: string) => void;
    markCompleted: (id: string) => void;
    clearActiveLevel: () => void;
};

export const useLevelsStore = create<LevelsStore>()(
    persist(
        (set) => ({
            completedLevelIds: [],
            activeLevelId: "",
            selectLevel: (id) => set({ activeLevelId: id }),
            markCompleted: (id) =>
                set((state) => (state.completedLevelIds.includes(id) ? state : { completedLevelIds: [...state.completedLevelIds, id] })),
            clearActiveLevel: () => set({ activeLevelId: "" }),
        }),
        {
            name: "infinite-canvas:levels_store",
            partialize: (state) => ({ completedLevelIds: state.completedLevelIds }),
        },
    ),
);
