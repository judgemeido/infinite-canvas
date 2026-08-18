import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Cpu, GraduationCap, Loader2, RotateCcw, Sparkles, Trophy, X } from "lucide-react";
import { Button, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    DIFFICULTIES,
    DIFFICULTY_META,
    GRADES,
    answerText,
    bankSize,
    computeSettlement,
    drawRoundByGrade,
    isCorrect,
    perQuestionPoints,
    type Difficulty,
    type Grade,
    type Question,
    type Settlement,
} from "@/constant/poem-chain";
import { useLevelsStore } from "@/stores/use-levels-store";

const LEVEL_ID = "poem-chain";
const BG_URL = "/levels/poem-chain.png";
const CONFETTI_COLORS = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#a855f7", "#ec4899"];

function Confetti() {
    const pieces = useMemo(
        () =>
            Array.from({ length: 42 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 0.4,
                duration: 1.6 + Math.random() * 1.4,
                color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            })),
        [],
    );
    return (
        <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
            {pieces.map((p) => (
                <span key={p.id} className="pc-confetti-piece" style={{ left: `${p.left}vw`, background: p.color, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }} />
            ))}
        </div>
    );
}

export default function PoemChainPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const markCompleted = useLevelsStore((state) => state.markCompleted);
    const addPoemScore = useLevelsStore((state) => state.addPoemScore);
    const resetPoemScore = useLevelsStore((state) => state.resetPoemScore);
    const poemScore = useLevelsStore((state) => state.poemScore);
    const poemRounds = useLevelsStore((state) => state.poemRounds);

    const [grade, setGrade] = useState<Grade | null>(null);
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [round, setRound] = useState<Question[]>([]);
    const [index, setIndex] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [roundScore, setRoundScore] = useState(0);
    const [settleOpen, setSettleOpen] = useState(false);
    const [settlement, setSettlement] = useState<Settlement | null>(null);
    const [completeOpen, setCompleteOpen] = useState(false);
    const [celebrate, setCelebrate] = useState(false);
    const committedRef = useRef(false);

    const pointsPerCorrect = difficulty ? perQuestionPoints(difficulty) : 0;
    const total = round.length;

    const pickGrade = (value: Grade) => {
        setGrade(value);
        setDifficulty(null);
        setRound([]);
    };

    const startRound = (g: Grade, d: Difficulty) => {
        setGrade(g);
        setDifficulty(d);
        setRound(drawRoundByGrade(g, d));
        setIndex(0);
        setCorrectCount(0);
        setRoundScore(0);
        setSettleOpen(false);
        setSettlement(null);
        setCompleteOpen(false);
        committedRef.current = false;
    };

    const goBack = () => {
        if (difficulty) {
            // 答题中/结算中 → 回到难度选择
            setDifficulty(null);
            setRound([]);
            setSettleOpen(false);
            setCompleteOpen(false);
        } else if (grade) {
            setGrade(null);
        } else {
            navigate("/levels");
        }
    };

    const backLabel = difficulty ? t("poemChain.backToDifficulty") : grade ? t("poemChain.backToGrades") : t("levels.back");

    const handleAnswer = (correct: boolean) => {
        if (!correct) return;
        setCorrectCount((value) => value + 1);
        setRoundScore((value) => value + pointsPerCorrect);
    };

    const handleNext = () => {
        if (index < round.length - 1) {
            setIndex((value) => value + 1);
            return;
        }
        // 最后一题：进入「AI 公平结算」
        if (grade && difficulty) {
            setSettlement(computeSettlement({ correct: correctCount, total: round.length, grade, difficulty }));
            setSettleOpen(true);
        }
    };

    const onSettleDone = () => {
        if (!committedRef.current && settlement) {
            committedRef.current = true;
            addPoemScore(settlement.final);
            markCompleted(LEVEL_ID);
        }
        setSettleOpen(false);
        setCelebrate(true);
        setCompleteOpen(true);
        window.setTimeout(() => setCelebrate(false), 3200);
    };

    const confirmReset = () => {
        Modal.confirm({
            title: t("poemChain.resetConfirm"),
            okText: t("poemChain.resetScore"),
            okButtonProps: { danger: true },
            centered: true,
            onOk: () => resetPoemScore(),
        });
    };

    return (
        <main className="thin-scrollbar relative h-full overflow-y-auto">
            <div className="pointer-events-none absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${BG_URL})`, opacity: 0.1 }} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/70 via-white/75 to-rose-50/70 dark:from-stone-950/80 dark:via-stone-950/75 dark:to-stone-900/80" />
            {celebrate ? <Confetti /> : null}

            <div className="relative mx-auto max-w-2xl px-6 py-8">
                <button
                    type="button"
                    onClick={goBack}
                    className="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                >
                    <ArrowLeft className="size-4" />
                    {backLabel}
                </button>

                <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-stone-950 dark:text-stone-100">{t("poemChain.title")}</h1>
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{grade ? t("poemChain.gradeSubtitle", { grade }) : t("poemChain.subtitle")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-300">
                            <Trophy className="size-4" />
                            <span>{t("poemChain.totalScore", { score: poemScore })}</span>
                            <span className="text-amber-500/70">·</span>
                            <span className="text-amber-600/90 dark:text-amber-300/80">{t("poemChain.roundsPlayed", { count: poemRounds })}</span>
                        </div>
                        <Button size="small" danger type="text" icon={<RotateCcw className="size-3.5" />} onClick={confirmReset}>
                            {t("poemChain.resetScore")}
                        </Button>
                    </div>
                </div>

                {grade && difficulty && round.length ? (
                    <>
                        <div className="mb-3 flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
                            <span>{t("poemChain.progress", { current: index + 1, total })}</span>
                            <span className="font-medium text-amber-600 dark:text-amber-300">{t("poemChain.score", { count: roundScore })}</span>
                        </div>
                        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-stone-200/80 dark:bg-stone-800">
                            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all" style={{ width: `${(index / total) * 100}%` }} />
                        </div>
                        <QuizCard key={round[index].id} question={round[index]} isLast={index === total - 1} pointsPerCorrect={pointsPerCorrect} onAnswer={handleAnswer} onNext={handleNext} />
                    </>
                ) : grade ? (
                    <DifficultyPicker grade={grade} onPick={(d) => startRound(grade, d)} />
                ) : (
                    <GradePicker onPick={pickGrade} />
                )}
            </div>

            <AiSettlement open={settleOpen} settlement={settlement} grade={grade} difficulty={difficulty} onDone={onSettleDone} />

            <Modal open={completeOpen} onCancel={() => setCompleteOpen(false)} footer={null} centered width={380}>
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="pc-bounce-in flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-500 dark:bg-amber-500/15">
                        <Trophy className="size-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100">{t("poemChain.completeTitle")}</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                        {t("poemChain.completeDesc", {
                            label: difficulty ? t(`poemChain.difficulty.${difficulty}`) : "",
                            grade: grade ?? "",
                            count: correctCount,
                            total,
                            score: settlement?.final ?? 0,
                        })}
                    </p>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-300">{t("poemChain.completeTotal", { score: poemScore, rounds: poemRounds })}</p>
                    <div className="mt-2 flex w-full gap-2">
                        <Button block onClick={() => grade && difficulty && startRound(grade, difficulty)}>
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

// PLACEHOLDER_REST
function AiSettlement({ open, settlement, grade, difficulty, onDone }: { open: boolean; settlement: Settlement | null; grade: Grade | null; difficulty: Difficulty | null; onDone: () => void }) {
    const { t } = useTranslation();
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState(0);
    const onDoneRef = useRef(onDone);
    onDoneRef.current = onDone;

    useEffect(() => {
        if (!open) {
            setProgress(0);
            setStep(0);
            return;
        }
        setProgress(0);
        setStep(0);
        const stepTimers = [1, 2, 3, 4, 5].map((s, i) => window.setTimeout(() => setStep(s), 300 + i * 480));
        const started = Date.now();
        const duration = 2800;
        const interval = window.setInterval(() => {
            const p = Math.min(100, Math.round(((Date.now() - started) / duration) * 100));
            setProgress(p);
            if (p >= 100) {
                window.clearInterval(interval);
                window.setTimeout(() => onDoneRef.current(), 560);
            }
        }, 60);
        return () => {
            window.clearInterval(interval);
            stepTimers.forEach((id) => window.clearTimeout(id));
        };
    }, [open]);

    if (!settlement || !difficulty || !grade) return null;

    const accuracyPct = settlement.total ? Math.round((settlement.correct / settlement.total) * 100) : 0;
    const done = progress >= 100;
    const steps = [
        t("poemChain.ai.step1", { correct: settlement.correct, total: settlement.total }),
        t("poemChain.ai.step2", { label: t(`poemChain.difficulty.${difficulty}`), weight: settlement.difficultyWeight.toFixed(1) }),
        t("poemChain.ai.step3", { grade, weight: settlement.gradeWeight.toFixed(2) }),
        t("poemChain.ai.step4", { accuracy: accuracyPct, bonus: settlement.accuracyBonus.toFixed(1) }),
        t("poemChain.ai.step5"),
    ];

    return (
        <Modal open={open} footer={null} closable={false} maskClosable={false} keyboard={false} centered width={420}>
            <div className="flex flex-col gap-4 py-2">
                <div className="flex items-center gap-3">
                    <div className="relative flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white">
                        {done ? <Sparkles className="size-6" /> : <Cpu className="size-6 animate-pulse" />}
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">{done ? t("poemChain.ai.done") : t("poemChain.ai.title")}</h3>
                        <p className="text-xs text-stone-400 dark:text-stone-500">{t("poemChain.ai.subtitle")}</p>
                    </div>
                    {!done ? <Loader2 className="ml-auto size-5 animate-spin text-amber-500" /> : null}
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200/80 dark:bg-stone-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-100" style={{ width: `${progress}%` }} />
                </div>

                <div className="flex flex-col gap-2 rounded-xl bg-stone-50 p-3 text-sm dark:bg-stone-900/60">
                    {steps.map((line, i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-2 transition-all duration-300 ${step > i ? "text-stone-700 opacity-100 dark:text-stone-200" : "translate-y-1 text-stone-400 opacity-0 dark:text-stone-600"}`}
                        >
                            {step > i ? <Check className="size-4 shrink-0 text-emerald-500" /> : <span className="size-4 shrink-0" />}
                            <span>{line}</span>
                        </div>
                    ))}
                </div>

                <div className={`flex items-baseline justify-center gap-2 transition-all duration-500 ${done ? "opacity-100" : "opacity-40"}`}>
                    <span className="text-sm text-stone-400 dark:text-stone-500">{t("poemChain.ai.result")}</span>
                    <span className="text-3xl font-bold text-amber-600 dark:text-amber-300">{done ? settlement.final : Math.round((settlement.final * progress) / 100)}</span>
                    <span className="text-sm text-stone-400 dark:text-stone-500">{t("poemChain.pointsUnit")}</span>
                </div>
            </div>
        </Modal>
    );
}

// PLACEHOLDER_PICKERS
function GradePicker({ onPick }: { onPick: (grade: Grade) => void }) {
    const { t } = useTranslation();
    return (
        <div className="rounded-2xl border border-stone-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-stone-800 dark:bg-stone-900/60">
            <div className="mb-4 flex items-center gap-2 text-stone-700 dark:text-stone-200">
                <GraduationCap className="size-5" />
                <span className="text-base font-medium">{t("poemChain.pickGrade")}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {GRADES.map((grade) => (
                    <button
                        key={grade}
                        type="button"
                        onClick={() => onPick(grade)}
                        className="flex flex-col items-center gap-1 rounded-xl border border-stone-200 bg-white/80 px-4 py-4 transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md dark:border-stone-700 dark:bg-stone-800/70 dark:hover:border-amber-500"
                    >
                        <span className="text-2xl font-semibold text-stone-900 dark:text-stone-100">{t("poemChain.gradeNo", { grade })}</span>
                        <span className="text-xs text-stone-400 dark:text-stone-500">{t("poemChain.bankHint", { count: bankSize(grade) })}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
    easy: "from-emerald-500/15 to-emerald-500/5 hover:border-emerald-400 text-emerald-600 dark:text-emerald-300",
    normal: "from-amber-500/15 to-amber-500/5 hover:border-amber-400 text-amber-600 dark:text-amber-300",
    hard: "from-rose-500/15 to-rose-500/5 hover:border-rose-400 text-rose-600 dark:text-rose-300",
};

function DifficultyPicker({ grade, onPick }: { grade: Grade; onPick: (difficulty: Difficulty) => void }) {
    const { t } = useTranslation();
    return (
        <div className="rounded-2xl border border-stone-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-stone-800 dark:bg-stone-900/60">
            <div className="mb-4 flex items-center gap-2 text-stone-700 dark:text-stone-200">
                <Sparkles className="size-5" />
                <span className="text-base font-medium">{t("poemChain.pickDifficulty", { grade })}</span>
            </div>
            <div className="grid gap-3">
                {DIFFICULTIES.map((difficulty) => (
                    <button
                        key={difficulty}
                        type="button"
                        onClick={() => onPick(difficulty)}
                        className={`flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-gradient-to-br px-5 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700 ${DIFFICULTY_STYLE[difficulty]}`}
                    >
                        <div>
                            <p className="text-base font-semibold text-stone-900 dark:text-stone-100">{t(`poemChain.difficulty.${difficulty}`)}</p>
                            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{t(`poemChain.difficultyDesc.${difficulty}`)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                            <p className="text-lg font-bold">{t("poemChain.perQuestion", { points: perQuestionPoints(difficulty) })}</p>
                            <p className="text-xs text-stone-400 dark:text-stone-500">×{DIFFICULTY_META[difficulty].weight.toFixed(1)}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// PLACEHOLDER_QUIZ
function QuizCard({ question, isLast, pointsPerCorrect, onAnswer, onNext }: { question: Question; isLast: boolean; pointsPerCorrect: number; onAnswer: (correct: boolean) => void; onNext: () => void }) {
    const { t } = useTranslation();
    const [picked, setPicked] = useState<string[]>([]);
    const [answered, setAnswered] = useState(false);
    const [wasCorrect, setWasCorrect] = useState(false);

    const lockIn = (choice: string[], correct: boolean) => {
        setPicked(choice);
        setWasCorrect(correct);
        setAnswered(true);
        onAnswer(correct);
    };

    const clickOption = (option: string) => {
        if (answered) return;
        if (question.multi) {
            setPicked((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]));
            return;
        }
        lockIn([option], question.answers.includes(option));
    };

    const submitMulti = () => {
        if (answered || !picked.length) return;
        lockIn(picked, isCorrect(question, picked));
    };

    const optionClass = (option: string) => {
        const isAnswer = question.answers.includes(option);
        if (answered && isAnswer) return "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 pc-pop";
        if (answered && picked.includes(option)) return "border-red-500 bg-red-500/10 text-red-600 dark:text-red-300";
        if (!answered && question.multi && picked.includes(option)) return "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300";
        return "border-stone-200 bg-white/60 hover:border-amber-400 hover:bg-amber-50/60 dark:border-stone-700 dark:bg-stone-900/40 dark:hover:border-stone-500 dark:hover:bg-white/5";
    };

    return (
        <div className="rounded-2xl border border-stone-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-stone-800 dark:bg-stone-900/60">
            <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">{t(`poemChain.type.${question.type}`)}</span>
                {question.multi ? <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-300">{t("poemChain.multiTag")}</span> : null}
            </div>
            <p className="mb-6 text-xl font-medium leading-relaxed tracking-wide text-stone-900 dark:text-stone-100">{question.stem}</p>

            <div className="grid gap-3">
                {question.options.map((option) => {
                    const isAnswer = question.answers.includes(option);
                    const showTick = answered && isAnswer;
                    const showCross = answered && !isAnswer && picked.includes(option);
                    return (
                        <button
                            key={option}
                            type="button"
                            disabled={answered}
                            onClick={() => clickOption(option)}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-base transition disabled:cursor-default ${optionClass(option)}`}
                        >
                            <span>{option}</span>
                            {showTick ? <Check className="size-4 shrink-0 text-emerald-500" /> : showCross ? <X className="size-4 shrink-0 text-red-500" /> : null}
                        </button>
                    );
                })}
            </div>

            {question.multi && !answered ? (
                <Button type="primary" block className="mt-4" disabled={!picked.length} onClick={submitMulti}>
                    {t("poemChain.submit")}
                </Button>
            ) : null}

            {answered ? (
                <div className="mt-5 flex flex-col gap-3">
                    {wasCorrect ? (
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">
                            {t("poemChain.correct", { points: pointsPerCorrect, source: question.source })}
                        </p>
                    ) : (
                        <div className="rounded-xl border border-amber-300/70 bg-amber-50/70 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                            <p className="text-sm font-medium text-red-600 dark:text-red-300">{t("poemChain.wrongAnswer", { answer: answerText(question) })}</p>
                            <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-300/80">{t("poemChain.answerFrom", { source: question.source })}</p>
                        </div>
                    )}
                    <Button type="primary" block onClick={onNext}>
                        {isLast ? t("poemChain.finish") : t("poemChain.next")}
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
