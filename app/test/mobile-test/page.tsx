import { ResponsiveTest } from "@/components/testing/responsive-test";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  PlusCircle, 
  Search, 
  Filter,
  PlayCircle,
  Trophy,
  Star,
  Clock
} from "lucide-react";

export default function MobileTestPage() {
  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <h1 className="text-2xl font-bold">Mobile Responsiveness Test</h1>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="futuristic-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-lg font-bold text-blue-400">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="futuristic-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-lg font-bold text-yellow-400">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="futuristic-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <p className="text-lg font-bold text-green-400">85%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="futuristic-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-400" />
              <div>
                <p className="text-xs text-muted-foreground">Categories</p>
                <p className="text-lg font-bold text-purple-400">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quiz List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="futuristic-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold line-clamp-1">
                  Sample Quiz {item}
                </CardTitle>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  This is a sample quiz description that shows how the text will be displayed on mobile devices.
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-xs text-muted-foreground gap-3">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    10 questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    30 min
                  </span>
                </div>
                <Button className="w-full text-xs touch-target">
                  <PlayCircle className="h-3 w-3 mr-2" />
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Form Example */}
      <Card className="futuristic-card">
        <CardHeader>
          <CardTitle className="text-lg">Sample Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm">Quiz Title</Label>
            <Input id="title" placeholder="Enter quiz title" className="mt-1" />
          </div>
          
          <div>
            <Label className="text-sm">Question Type</Label>
            <RadioGroup defaultValue="multiple-choice">
              <div className="flex items-center space-x-2 p-2 rounded-lg has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                <RadioGroupItem value="multiple-choice" id="multiple-choice" className="h-4 w-4" />
                <Label htmlFor="multiple-choice" className="text-xs">Multiple Choice</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-lg has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                <RadioGroupItem value="true-false" id="true-false" className="h-4 w-4" />
                <Label htmlFor="true-false" className="text-xs">True/False</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label className="text-sm">Options</Label>
            <div className="space-y-2 mt-2">
              {[1, 2].map((option) => (
                <div key={option} className="flex items-center gap-2 p-2 rounded-lg has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                  <Checkbox id={`option-${option}`} className="h-4 w-4" />
                  <Input placeholder={`Option ${option}`} className="flex-1 text-sm" />
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full text-xs">
                <PlusCircle className="mr-2 h-3 w-3" />
                Add Option
              </Button>
            </div>
          </div>
          
          <Button className="w-full touch-target">
            Save Quiz
          </Button>
        </CardContent>
      </Card>
      
      <ResponsiveTest />
    </div>
  );
}