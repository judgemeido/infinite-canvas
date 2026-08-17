import { useMemo, useState } from "react";
import { ArrowLeft, Check, RotateCcw, Trophy, X } from "lucide-react";
import { Button, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { buildOptions, drawRound } from "@/constant/poem-chain";
import { useLevelsStore } from "@/stores/use-levels-store";

const LEVEL_ID = "poem-chain";

export default function PoemChainPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const markCompleted = useLevelsStore((state) => state.markCompleted);

    const [round, setRound] = useState(() => drawRound());
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [completeOpen, setCompleteOpen] = useState(false);

    const question = round[index];
    const options = useMemo(() => buildOptions(question), [question]);
    const answeredCorrect = selected === question.answer;
    const total = round.length;

    const choose = (option: string) => {
        if (answeredCorrect) return;
        setSelected(option);
        if (option !== question.answer) return;
        setCorrectCount((value) => value + 1);
        window.setTimeout(() => {
            if (index < total - 1) {
                setIndex((value) => value + 1);
                setSelected(null);
            } else {
                markCompleted(LEVEL_ID);
                setCompleteOpen(true);
            }
        }, 750);
    };

    const restart = () => {
        setRound(drawRound());
        setIndex(0);
        setSelected(null);
        setCorrectCount(0);
        setCompleteOpen(false);
    };

    const optionClass = (option: string) => {
        const isAnswer = option === question.answer;
        if (selected === option && isAnswer) return "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
        if (selected === option && !isAnswer) return "border-red-500 bg-red-500/10 text-red-600 dark:text-red-300";
        if (answeredCorrect && isAnswer) return "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
        return "border-stone-200 hover:border-stone-400 hover:bg-black/5 dark:border-stone-700 dark:hover:border-stone-500 dark:hover:bg-white/10";
    };

    return (
        <main className="thin-scrollbar h-full overflow-y-auto">
            <div className="mx-auto max-w-2xl px-6 py-8">
                <button
                    type="button"
                    onClick={() => navigate("/levels")}
                    className="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                >
                    <ArrowLeft className="size-4" />
                    {t("levels.back")}
                </button>

                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-stone-950 dark:text-stone-100">{t("poemChain.title")}</h1>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t("poemChain.subtitle")}</p>
                </div>

                <div className="mb-5 flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
                    <span>{t("poemChain.progress", { current: index + 1, total })}</span>
                    <span>{t("poemChain.score", { count: correctCount })}</span>
                </div>
                <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                    <div className="h-full rounded-full bg-stone-900 transition-all dark:bg-stone-100" style={{ width: `${((index + (answeredCorrect ? 1 : 0)) / total) * 100}%` }} />
                </div>

                <div className="rounded-2xl border border-stone-200 p-6 dark:border-stone-800">
                    <p className="mb-1 text-xs text-stone-400 dark:text-stone-500">{t("poemChain.prevLine")}</p>
                    <p className="mb-6 text-2xl font-medium tracking-wide text-stone-900 dark:text-stone-100">{question.prompt}</p>

                    <p className="mb-3 text-sm font-medium text-stone-600 dark:text-stone-300">{t("poemChain.pickNext")}</p>
                    <div className="grid gap-3">
                        {options.map((option) => {
                            const isAnswer = option === question.answer;
                            const showIcon = selected === option || (answeredCorrect && isAnswer);
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    disabled={answeredCorrect}
                                    onClick={() => choose(option)}
                                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-base transition disabled:cursor-default ${optionClass(option)}`}
                                >
                                    <span>{option}</span>
                                    {showIcon ? isAnswer ? <Check className="size-4 shrink-0 text-emerald-500" /> : <X className="size-4 shrink-0 text-red-500" /> : null}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-5 flex min-h-6 items-center justify-between">
                        <span className={`text-sm ${answeredCorrect ? "text-emerald-600 dark:text-emerald-300" : selected ? "text-red-500 dark:text-red-300" : "text-transparent"}`}>
                            {answeredCorrect ? t("poemChain.correct", { source: question.source }) : selected ? t("poemChain.wrong") : "·"}
                        </span>
                        <Button size="small" type="text" icon={<RotateCcw className="size-3.5" />} onClick={restart}>
                            {t("poemChain.restart")}
                        </Button>
                    </div>
                </div>
            </div>

            <Modal open={completeOpen} onCancel={() => setCompleteOpen(false)} footer={null} centered width={380}>
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-500 dark:bg-amber-500/15">
                        <Trophy className="size-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100">{t("levels.complete.title")}</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{t("poemChain.completeDesc", { count: correctCount, total })}</p>
                    <div className="mt-2 flex w-full gap-2">
                        <Button block onClick={restart}>
                            {t("poemChain.playAgain")}
                        </Button>
                        <Button block type="primary" onClick={() => navigate("/levels")}>
                            {t("levels.complete.back")}
                        </Button>
                    </div>
                </div>
            </Modal>
        </main>
    );
}
