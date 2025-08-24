"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Clock, Shuffle, Eye, RotateCcw, Lock } from 'lucide-react';
import type { Quiz } from '@/lib/types';

interface QuizSettingsProps {
  quiz: Partial<Quiz>;
  onQuizChange: (updates: Partial<Quiz>) => void;
}

export function QuizSettings({ quiz, onQuizChange }: QuizSettingsProps) {
  const handleSettingChange = (key: keyof Quiz, value: any) => {
    onQuizChange({ [key]: value });
  };

  return (
    <Card className="p-4 sm:p-6">
      <CardHeader className="p-0 mb-4 sm:mb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
          Quiz Settings
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Configure how your quiz behaves and appears to students.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-0">
        {/* Time Limit */}
        <div className="space-y-2">
          <Label htmlFor="timeLimit" className="flex items-center gap-2 text-sm sm:text-base">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            Time Limit (minutes)
          </Label>
          <Input
            id="timeLimit"
            type="number"
            min="1"
            max="300"
            value={quiz.timeLimit || ''}
            onChange={(e) => handleSettingChange('timeLimit', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="No time limit"
            className="text-sm sm:text-base"
          />
          <p className="text-xs sm:text-sm text-muted-foreground">
            Leave empty for no time limit. Students will see a countdown timer.
          </p>
        </div>

        <Separator />

        {/* Quiz Behavior Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm sm:text-base">Quiz Behavior</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1 min-w-0">
              <Label className="flex items-center gap-2 text-xs sm:text-sm">
                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                Allow Retakes
              </Label>
              <p className="text-xs text-muted-foreground">
                Students can retake the quiz multiple times
              </p>
            </div>
            <Switch
              checked={quiz.allowRetakes || false}
              onCheckedChange={(checked) => handleSettingChange('allowRetakes', checked)}
              className="ml-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1 min-w-0">
              <Label className="flex items-center gap-2 text-xs sm:text-sm">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                Show Correct Answers
              </Label>
              <p className="text-xs text-muted-foreground">
                Display correct answers after submission
              </p>
            </div>
            <Switch
              checked={quiz.showCorrectAnswers || false}
              onCheckedChange={(checked) => handleSettingChange('showCorrectAnswers', checked)}
              className="ml-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1 min-w-0">
              <Label className="flex items-center gap-2 text-xs sm:text-sm">
                <Shuffle className="h-3 w-3 sm:h-4 sm:w-4" />
                Randomize Questions
              </Label>
              <p className="text-xs text-muted-foreground">
                Questions appear in random order for each student
              </p>
            </div>
            <Switch
              checked={quiz.randomizeQuestions || false}
              onCheckedChange={(checked) => handleSettingChange('randomizeQuestions', checked)}
              className="ml-2"
            />
          </div>
        </div>

        <Separator />

        {/* Organization */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm sm:text-base">Organization</h4>
          
          <div className="space-y-2">
            <Label htmlFor="category" className="text-xs sm:text-sm">Category</Label>
            <Input
              id="category"
              value={quiz.category || ''}
              onChange={(e) => handleSettingChange('category', e.target.value)}
              placeholder="e.g., Mathematics, Science, History"
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-xs sm:text-sm">Tags</Label>
            <Input
              id="tags"
              value={quiz.tags?.join(', ') || ''}
              onChange={(e) => handleSettingChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
              placeholder="e.g., algebra, equations, grade-9"
              className="text-sm sm:text-base"
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
