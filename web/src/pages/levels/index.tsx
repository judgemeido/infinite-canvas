import { ArrowRight, Check, Feather, ImagePlus, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { levels, isLevelUnlocked, type Level } from "@/constant/levels";
import { useLevelsStore } from "@/stores/use-levels-store";

export default function LevelsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const completedLevelIds = useLevelsStore((state) => state.completedLevelIds);
    const selectLevel = useLevelsStore((state) => state.selectLevel);

    const startLevel = (level: Level) => {
        selectLevel(level.id);
        navigate(level.type === "poem-chain" ? "/poem-chain" : "/image");
    };

    return (
        <main className="thin-scrollbar h-full overflow-y-auto">
            <div className="mx-auto max-w-5xl px-6 py-8">
                <header className="mb-7 text-center">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-500 dark:border-stone-700 dark:text-stone-400">
                        <Sparkles className="size-3.5" />
                        {t("levels.badge")}
                    </div>
                    <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl dark:text-stone-100">{t("meta.title")}</h1>
                    <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{t("levels.subtitle")}</p>
                </header>

                <div className="grid gap-5 sm:grid-cols-2">
                    {levels.map((level) => {
                        const completed = completedLevelIds.includes(level.id);
                        const unlocked = isLevelUnlocked(level, completedLevelIds);
                        return <LevelCard key={level.id} level={level} completed={completed} unlocked={unlocked} onStart={() => startLevel(level)} />;
                    })}
                    <ComingSoonCard />
                </div>
            </div>
        </main>
    );
}

function LevelCard({ level, completed, unlocked, onStart }: { level: Level; completed: boolean; unlocked: boolean; onStart: () => void }) {
    const { t } = useTranslation();
    const status = completed ? "completed" : unlocked ? "open" : "locked";
    const statusClass =
        status === "completed"
            ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-300"
            : status === "open"
              ? "border-stone-300 text-stone-600 dark:border-stone-600 dark:text-stone-300"
              : "border-stone-300 text-stone-400 dark:border-stone-700 dark:text-stone-500";

    return (
        <div className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-stone-800">
            <div className="relative aspect-[2/1] overflow-hidden">
                {level.cover ? (
                    <img src={level.cover} alt={level.name} className={`size-full object-cover transition duration-300 group-hover:scale-105 ${unlocked ? "" : "grayscale"}`} loading="lazy" />
                ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500">
                        <Feather className="size-14 text-white/85" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">{t("levels.levelNo", { order: level.order })}</span>
                <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border bg-black/40 px-2.5 py-1 text-[11px] font-medium backdrop-blur ${statusClass}`}>
                    {status === "completed" ? <Check className="size-3" /> : status === "locked" ? <Lock className="size-3" /> : null}
                    {t(`levels.status.${status}`)}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4">
                    <h2 className="text-lg font-semibold text-white drop-shadow">{level.name}</h2>
                    <p className="mt-1 line-clamp-1 text-sm text-white/80 drop-shadow">{level.poem}</p>
                </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
                <p className="text-sm text-stone-600 dark:text-stone-300">{level.intro}</p>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-500 dark:border-stone-700 dark:text-stone-400">
                    {level.type === "poem-chain" ? <Feather className="size-3.5" /> : <ImagePlus className="size-3.5" />}
                    {level.task}
                </span>
                <button
                    type="button"
                    disabled={!unlocked}
                    onClick={onStart}
                    style={{ color: "#1c1917" }}
                    className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {completed ? t("levels.replay") : t("levels.start")}
                    <ArrowRight className="size-4" />
                </button>
            </div>
        </div>
    );
}

function ComingSoonCard() {
    const { t } = useTranslation();
    return (
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 p-6 text-center text-stone-400 dark:border-stone-700 dark:text-stone-500">
            <Lock className="size-6" />
            <span className="text-sm font-medium">{t("levels.comingSoon")}</span>
        </div>
    );
}
