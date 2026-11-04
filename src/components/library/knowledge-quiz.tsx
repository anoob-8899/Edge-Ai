"use client";

import * as React from "react";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Award,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface QuestionData {
  id: string;
  question: string;
  options: string | string[];
  correctOptionIndex?: number;
  explanation: string;
  orderIndex: number;
}

export interface QuizAttemptData {
  id: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  createdAt: string;
}

interface KnowledgeQuizProps {
  lessonId: string;
  lessonTitle: string;
  questions: QuestionData[];
  initialAttempts?: QuizAttemptData[];
  onQuizPassed?: () => void;
}

export function KnowledgeQuiz({
  lessonId,
  lessonTitle,
  questions,
  initialAttempts = [],
  onQuizPassed,
}: KnowledgeQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    feedback: Array<{
      questionId: string;
      selectedOptionIndex: number;
      correctOptionIndex: number;
      isCorrect: boolean;
      explanation: string;
    }>;
    message: string;
  } | null>(null);

  const [attempts, setAttempts] = React.useState<QuizAttemptData[]>(initialAttempts);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (result) return; // locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const allAnswered =
    questions.length > 0 &&
    questions.every((q) => selectedAnswers[q.id] !== undefined);

  const handleSubmitQuiz = async () => {
    if (!allAnswered) {
      setErrorMsg("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/library/lessons/${lessonId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: selectedAnswers }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit quiz attempt");
      }

      setResult(data);

      // Add to attempts list
      setAttempts((prev) => [
        {
          id: data.attemptId,
          score: data.score,
          totalQuestions: data.totalQuestions,
          passed: data.passed,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      if (data.passed && onQuizPassed) {
        onQuizPassed();
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMsg(e.message || "An error occurred while evaluating quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setResult(null);
    setErrorMsg(null);
  };

  if (!questions || questions.length === 0) {
    return (
      <Card variant="glass" className="p-6 text-center text-[#65758B]">
        <HelpCircle className="h-8 w-8 mx-auto text-[#8796AA] mb-2" />
        <p className="text-sm">No knowledge-check questions assigned to this lesson yet.</p>
      </Card>
    );
  }

  const bestAttempt =
    attempts.length > 0
      ? [...attempts].sort((a, b) => b.score - a.score)[0]
      : null;

  return (
    <Card variant="glass" className="overflow-hidden border-[#DCE8F5] shadow-card">
      <CardHeader className="border-b border-[#DCE8F5]/80 bg-gradient-to-r from-white via-[#F8FBFF] to-[#E8F3FF]/40 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                Optical Knowledge Check
              </Badge>
              {bestAttempt && (
                <Badge
                  variant={bestAttempt.passed ? "success" : "warning"}
                  size="sm"
                  isMono
                >
                  Best: {bestAttempt.score}/{bestAttempt.totalQuestions} (
                  {Math.round((bestAttempt.score / bestAttempt.totalQuestions) * 100)}%)
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-bold text-[#172B4D]">
              Verify Understanding: {lessonTitle}
            </CardTitle>
            <CardDescription>
              Answer the questions below to test your mastery of this optical lesson and save your progress to PostgreSQL.
            </CardDescription>
          </div>

          {result && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetake}
              className="shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retake Quiz</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Results Banner if Submitted */}
        {result && (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              result.passed
                ? "bg-[#E8F3FF] border-[#B8D9FF] text-[#172B4D]"
                : "bg-amber-50 border-amber-200 text-[#A96A08]"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.passed ? (
                <CheckCircle2 className="h-6 w-6 text-[#16865C] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-[#A96A08] shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-sm text-[#172B4D]">
                  {result.passed ? "Knowledge Check Passed!" : "Review Required"}
                </h4>
                <p className="text-xs text-[#65758B] mt-0.5">{result.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-right shrink-0">
              <div className="text-2xl font-extrabold font-mono text-[#172B4D]">
                {result.score} / {result.totalQuestions}
              </div>
              <Badge
                variant={result.passed ? "success" : "warning"}
                size="md"
                isMono
              >
                {result.percentage}%
              </Badge>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C83F4F] flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-6">
          {questions.map((q, qIndex) => {
            const rawOptions =
              typeof q.options === "string" ? JSON.parse(q.options) : q.options;
            const parsedOptions: string[] = Array.isArray(rawOptions)
              ? rawOptions
              : [];

            const selected = selectedAnswers[q.id];
            const feedbackItem = result?.feedback.find(
              (f) => f.questionId === q.id
            );

            return (
              <div
                key={q.id}
                className="p-4 sm:p-5 rounded-2xl bg-white/70 border border-[#DCE8F5] space-y-4 hover:border-[#B8D9FF] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#E8F3FF] text-[#4285F4] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {qIndex + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-[#172B4D] leading-snug">
                    {q.question}
                  </h3>
                </div>

                {/* Option Choices */}
                <div className="space-y-2 pl-9">
                  {parsedOptions.map((optionText, optIndex) => {
                    const isSelected = selected === optIndex;
                    let optionStyle =
                      "border-[#DCE8F5] bg-white hover:bg-[#F0F7FF] text-[#172B4D]";

                    if (result && feedbackItem) {
                      const isCorrectAnswer =
                        feedbackItem.correctOptionIndex === optIndex;
                      if (isCorrectAnswer) {
                        optionStyle =
                          "border-[#16865C] bg-emerald-50/80 text-[#16865C] font-semibold";
                      } else if (isSelected && !feedbackItem.isCorrect) {
                        optionStyle =
                          "border-[#C83F4F] bg-red-50/80 text-[#C83F4F]";
                      } else {
                        optionStyle = "border-[#DCE8F5] bg-white/60 text-[#8796AA]";
                      }
                    } else if (isSelected) {
                      optionStyle =
                        "border-[#4285F4] bg-[#E8F3FF] text-[#172B4D] shadow-xs";
                    }

                    return (
                      <button
                        key={optIndex}
                        type="button"
                        onClick={() => handleSelectOption(q.id, optIndex)}
                        disabled={Boolean(result)}
                        className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${optionStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md font-mono text-[11px] font-bold flex items-center justify-center bg-black/5 shrink-0">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span>{optionText}</span>
                        </div>

                        {result && feedbackItem && (
                          <div className="shrink-0">
                            {feedbackItem.correctOptionIndex === optIndex ? (
                              <CheckCircle2 className="h-4 w-4 text-[#16865C]" />
                            ) : isSelected && !feedbackItem.isCorrect ? (
                              <XCircle className="h-4 w-4 text-[#C83F4F]" />
                            ) : null}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Educational Explanation Box after submission */}
                {result && feedbackItem && (
                  <div className="mt-3 ml-9 p-3.5 rounded-xl bg-[#F0F7FF] border border-[#B8D9FF] text-xs text-[#172B4D] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#4285F4]">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Optical Principle Explanation:</span>
                    </div>
                    <p className="text-[#65758B] leading-relaxed">
                      {feedbackItem.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        {!result && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#DCE8F5]">
            <p className="text-xs text-[#8796AA]">
              {allAnswered
                ? "All questions answered. Ready to check answers."
                : `Answered ${Object.keys(selectedAnswers).length} of ${
                    questions.length
                  } questions.`}
            </p>

            <Button
              variant="primary"
              size="md"
              onClick={handleSubmitQuiz}
              disabled={!allAnswered || isSubmitting}
            >
              <span>{isSubmitting ? "Submitting Attempt..." : "Submit & Check Answers"}</span>
              <Award className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Past Attempts History */}
        {attempts.length > 0 && (
          <div className="pt-4 border-t border-[#DCE8F5]/80 space-y-2">
            <h4 className="text-xs font-semibold text-[#8796AA] uppercase tracking-wider">
              Attempt History ({attempts.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {attempts.slice(0, 3).map((att) => (
                <div
                  key={att.id}
                  className="p-2.5 rounded-xl bg-white/60 border border-[#DCE8F5] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        att.passed ? "bg-[#16865C]" : "bg-[#A96A08]"
                      }`}
                    />
                    <span className="font-semibold text-[#172B4D]">
                      {att.score} / {att.totalQuestions} (
                      {Math.round((att.score / att.totalQuestions) * 100)}%)
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8796AA] font-mono">
                    {new Date(att.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
