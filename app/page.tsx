import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Edit, Share2, BarChart2, Wand2 } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: <Edit className="w-8 h-8 text-primary" />,
    title: 'Intuitive Quiz Builder',
    description: 'Easily create quizzes with multiple question types including MCQ, True/False, and more.',
  },
  {
    icon: <Wand2 className="w-8 h-8 text-primary" />,
    title: 'AI-Powered Enhancement',
    description: 'Get instant feedback to improve question clarity and adjust difficulty with our smart assistant.',
  },
  {
    icon: <Share2 className="w-8 h-8 text-primary" />,
    title: 'Seamless Sharing',
    description: 'Share quizzes with a unique link. No student sign-in required for quick access.',
  },
  {
    icon: <BarChart2 className="w-8 h-8 text-primary" />,
    title: 'Insightful Analytics',
    description: 'Track student performance with automated grading and a comprehensive results dashboard.',
  },
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">QuizLink</span>
          </div>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="text-center container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            Create Engaging Quizzes in Minutes
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            QuizLink is the simplest way for teachers to build, share, and analyze quizzes. Powered by AI to help you create better questions, faster.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/create">Create Your First Quiz</Link>
            </Button>
          </div>
        </section>

        <section className="bg-white py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-foreground">Why Choose QuizLink?</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                      {feature.icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} QuizLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
