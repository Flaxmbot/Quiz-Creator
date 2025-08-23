"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wand2 } from "lucide-react";
import type { EnhanceQuizQuestionOutput } from "@/ai/flows/enhance-quiz-question";

interface AISuggestionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  suggestions: EnhanceQuizQuestionOutput | null;
  onApply: (suggestion: string) => void;
  originalQuestion: string;
}

export function AISuggestionDialog({
  isOpen,
  setIsOpen,
  suggestions,
  onApply,
  originalQuestion,
}: AISuggestionDialogProps) {
  if (!suggestions) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="text-primary" />
            AI-Powered Suggestions
          </DialogTitle>
          <DialogDescription>
            Here are some suggestions to enhance your question.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Enhanced Wording</h4>
            <p className="text-sm text-muted-foreground">Original: "{originalQuestion}"</p>
            <div className="p-4 bg-primary/10 rounded-md border border-primary/20 relative group">
              <p className="text-foreground">{suggestions.enhancedWording}</p>
              <Button
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onApply(suggestions.enhancedWording)}
              >
                Apply
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Difficulty Suggestion</h4>
            <div className="p-4 bg-muted/50 rounded-md border">
              <p className="text-muted-foreground">{suggestions.difficultySuggestion}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
