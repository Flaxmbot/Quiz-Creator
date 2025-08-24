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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Quiz Settings
        </CardTitle>
        <CardDescription>
          Configure how your quiz behaves and appears to students.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time Limit */}
        <div className="space-y-2">
          <Label htmlFor="timeLimit" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
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
          />
          <p className="text-sm text-muted-foreground">
            Leave empty for no time limit. Students will see a countdown timer.
          </p>
        </div>

        <Separator />

        {/* Quiz Behavior Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Quiz Behavior</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Allow Retakes
              </Label>
              <p className="text-sm text-muted-foreground">
                Students can retake the quiz multiple times
              </p>
            </div>
            <Switch
              checked={quiz.allowRetakes || false}
              onCheckedChange={(checked) => handleSettingChange('allowRetakes', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Show Correct Answers
              </Label>
              <p className="text-sm text-muted-foreground">
                Display correct answers after submission
              </p>
            </div>
            <Switch
              checked={quiz.showCorrectAnswers || false}
              onCheckedChange={(checked) => handleSettingChange('showCorrectAnswers', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Shuffle className="h-4 w-4" />
                Randomize Questions
              </Label>
              <p className="text-sm text-muted-foreground">
                Questions appear in random order for each student
              </p>
            </div>
            <Switch
              checked={quiz.randomizeQuestions || false}
              onCheckedChange={(checked) => handleSettingChange('randomizeQuestions', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Organization */}
        <div className="space-y-4">
          <h4 className="font-medium">Organization</h4>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={quiz.category || ''}
              onChange={(e) => handleSettingChange('category', e.target.value)}
              placeholder="e.g., Mathematics, Science, History"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={quiz.tags?.join(', ') || ''}
              onChange={(e) => handleSettingChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
              placeholder="e.g., algebra, equations, grade-9"
            />
            <p className="text-sm text-muted-foreground">
              Separate tags with commas
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
