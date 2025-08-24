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
      <DialogContent className="sm:max-w-[625px] p-4 sm:p-6">
        <DialogHeader className="p-0 mb-4 sm:mb-6">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Wand2 className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
            AI-Powered Suggestions
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Here are some suggestions to enhance your question.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:gap-6 py-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-sm sm:text-base">Enhanced Wording</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">Original: "{originalQuestion}"</p>
            <div className="p-3 sm:p-4 bg-primary/10 rounded-md border border-primary/20 relative group">
              <p className="text-foreground text-sm sm:text-base">{suggestions.enhancedWording}</p>
              <Button
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs sm:text-sm h-6 sm:h-8"
                onClick={() => onApply(suggestions.enhancedWording)}
              >
                Apply
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-sm sm:text-base">Difficulty Suggestion</h4>
            <div className="p-3 sm:p-4 bg-muted/50 rounded-md border">
              <p className="text-muted-foreground text-sm sm:text-base">{suggestions.difficultySuggestion}</p>
            </div>
          </div>
        </div>
        <DialogFooter className="p-0 pt-4 sm:pt-6">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="text-xs sm:text-sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
