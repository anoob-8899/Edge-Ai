"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface SubcategoryOption {
  id: string;
  name: string;
  categoryName: string;
}

export interface EditableLessonData {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  subcategoryId: string;
  definitions: string;
  characteristics: string;
  practicalApplications: string;
  misconceptions: string;
  limitations: string;
  brandModelReferences?: string | null;
  orderIndex: number;
  quizQuestions?: Array<{
    id?: string;
    question: string;
    options: string[] | string;
    correctOptionIndex?: number;
    explanation: string;
  }>;
}

interface LessonEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLesson?: EditableLessonData | null;
  subcategories: SubcategoryOption[];
  onSaved: () => void;
}

export function LessonEditorDialog({
  open,
  onOpenChange,
  initialLesson,
  subcategories,
  onSaved,
}: LessonEditorDialogProps) {
  const isEditing = Boolean(initialLesson?.id);

  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [subcategoryId, setSubcategoryId] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [definitions, setDefinitions] = React.useState("");
  const [characteristics, setCharacteristics] = React.useState("");
  const [practicalApplications, setPracticalApplications] = React.useState("");
  const [misconceptions, setMisconceptions] = React.useState("");
  const [limitations, setLimitations] = React.useState("");
  const [brandModelReferences, setBrandModelReferences] = React.useState("");
  const [orderIndex, setOrderIndex] = React.useState(1);

  const [quizQuestions, setQuizQuestions] = React.useState<
    Array<{
      question: string;
      options: string[];
      correctOptionIndex: number;
      explanation: string;
    }>
  >([]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Sync state when initialLesson changes
  React.useEffect(() => {
    if (initialLesson) {
      setTitle(initialLesson.title || "");
      setSlug(initialLesson.slug || "");
      setSubcategoryId(initialLesson.subcategoryId || subcategories[0]?.id || "");
      setSummary(initialLesson.summary || "");
      setDefinitions(initialLesson.definitions || "");
      setCharacteristics(initialLesson.characteristics || "");
      setPracticalApplications(initialLesson.practicalApplications || "");
      setMisconceptions(initialLesson.misconceptions || "");
      setLimitations(initialLesson.limitations || "");
      setBrandModelReferences(initialLesson.brandModelReferences || "");
      setOrderIndex(initialLesson.orderIndex ?? 1);
      setQuizQuestions(
        initialLesson.quizQuestions?.map((q) => ({
          question: q.question,
          options: Array.isArray(q.options)
            ? (q.options as string[])
            : typeof q.options === "string"
            ? (JSON.parse(q.options) as string[])
            : [],
          correctOptionIndex: q.correctOptionIndex ?? 0,
          explanation: q.explanation,
        })) || []
      );
    } else {
      // Defaults for creation
      setTitle("");
      setSlug("");
      setSubcategoryId(subcategories[0]?.id || "");
      setSummary("");
      setDefinitions("");
      setCharacteristics("");
      setPracticalApplications("");
      setMisconceptions("");
      setLimitations("");
      setBrandModelReferences("");
      setOrderIndex(1);
      setQuizQuestions([
        {
          question: "",
          options: ["", "", "", ""],
          correctOptionIndex: 0,
          explanation: "",
        },
      ]);
    }
    setErrorMsg(null);
  }, [initialLesson, open, subcategories]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleAddQuestion = () => {
    setQuizQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        explanation: "",
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuizQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (
    idx: number,
    field: string,
    val: string | number
  ) => {
    setQuizQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    setQuizQuestions((prev) => {
      const copy = [...prev];
      const optCopy = [...copy[qIdx].options];
      optCopy[optIdx] = val;
      copy[qIdx] = { ...copy[qIdx], options: optCopy };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !subcategoryId || !summary) {
      setErrorMsg("Please fill in title, slug, subcategory and summary.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        title,
        slug,
        subcategoryId,
        summary,
        definitions,
        characteristics,
        practicalApplications,
        misconceptions,
        limitations,
        brandModelReferences: brandModelReferences || null,
        orderIndex: Number(orderIndex) || 0,
        quizQuestions: quizQuestions.filter((q) => q.question.trim().length > 0),
      };

      const url = isEditing
        ? `/api/library/lessons/${initialLesson?.id}`
        : "/api/library/lessons";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save lesson");
      }

      onSaved();
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMsg(e.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Optical Lesson" : "Create New Optical Lesson"}
      description="Owner-controlled educational content creation. Keep verified educational concepts distinct from individual brand/model references."
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C83F4F] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              Lesson Title *
            </label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Polarized Lens Mechanics"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              URL Slug *
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. polarized-lens-mechanics"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              Subcategory *
            </label>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#DCE8F5] bg-white text-xs text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
              required
            >
              {subcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.categoryName} → {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              Display Order Index
            </label>
            <Input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B4D] mb-1">
            Summary / Overview *
          </label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="A concise 1-2 sentence overview of the optical concept..."
            rows={2}
            required
          />
        </div>

        {/* Structured Content Sections */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-[#4285F4] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Structured Educational Content</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              1. Definitions (Key terms & explanations)
            </label>
            <Textarea
              value={definitions}
              onChange={(e) => setDefinitions(e.target.value)}
              placeholder="Define key optical terms and scientific vocabulary..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              2. Characteristics (Specifications, geometry, dynamics)
            </label>
            <Textarea
              value={characteristics}
              onChange={(e) => setCharacteristics(e.target.value)}
              placeholder="List technical traits, measurements, physical properties..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              3. Practical Customer Applications (Dispensing & lifestyle)
            </label>
            <Textarea
              value={practicalApplications}
              onChange={(e) => setPracticalApplications(e.target.value)}
              placeholder="How staff should consult, fit, and recommend to patients..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                4. Common Misconceptions
              </label>
              <Textarea
                value={misconceptions}
                onChange={(e) => setMisconceptions(e.target.value)}
                placeholder="Common myths customers or dispensers hold vs. reality..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                5. Limitations & Cautions
              </label>
              <Textarea
                value={limitations}
                onChange={(e) => setLimitations(e.target.value)}
                placeholder="Fit limitations, contraindications, prescription boundaries..."
                rows={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              6. Brand / Model References (Optional educational examples)
            </label>
            <Textarea
              value={brandModelReferences}
              onChange={(e) => setBrandModelReferences(e.target.value)}
              placeholder="Educational archetypes (e.g. Ray-Ban Wayfarer, Maui Jim PolarizedPlus2). Do not invent unverified facts."
              rows={2}
            />
          </div>
        </div>

        {/* Knowledge-Check Quiz Questions Builder */}
        <div className="space-y-3 pt-3 border-t border-[#DCE8F5]">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-[#4285F4] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Knowledge-Check Questions ({quizQuestions.length})</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddQuestion}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Question</span>
            </Button>
          </div>

          {quizQuestions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#DCE8F5] space-y-3 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#172B4D]">
                  Question {qIdx + 1}
                </span>
                {quizQuestions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="text-red-500 hover:text-red-700 text-xs p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Input
                value={q.question}
                onChange={(e) =>
                  handleQuestionChange(qIdx, "question", e.target.value)
                }
                placeholder="Enter optical question text..."
              />

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#8796AA]">
                  Answer Options (Select the correct option radio)
                </label>
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={q.correctOptionIndex === optIdx}
                      onChange={() =>
                        handleQuestionChange(qIdx, "correctOptionIndex", optIdx)
                      }
                      className="text-[#4285F4]"
                    />
                    <Input
                      value={opt}
                      onChange={(e) =>
                        handleOptionChange(qIdx, optIdx, e.target.value)
                      }
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8796AA]">
                  Explanation for Correct Answer
                </label>
                <Input
                  value={q.explanation}
                  onChange={(e) =>
                    handleQuestionChange(qIdx, "explanation", e.target.value)
                  }
                  placeholder="Why is this option correct according to optical science?"
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving Lesson..."
              : isEditing
              ? "Update Lesson"
              : "Publish Lesson"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
