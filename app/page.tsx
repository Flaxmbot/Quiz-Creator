"use client";

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Edit, Share2, BarChart2, Wand2 } from 'lucide-react'
import Link from 'next/link'
import { PageLayout } from '@/components/layout/page-layout'

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
    <PageLayout>
      <section className="text-center container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 bg-gradient-to-b from-background to-muted">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-tight">
          Create Engaging Quizzes in Minutes
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-xl md:text-2xl text-muted-foreground leading-relaxed">
          QuizLink is the simplest way for teachers to build, share, and analyze quizzes. Powered by AI to help you create better questions, faster.
        </p>
        <div className="mt-10">
          <Button size="lg" asChild>
            <Link href="/create">Create Your First Quiz</Link>
          </Button>
        </div>
      </section>

      <section className="bg-background py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-16">Why Choose QuizLink?</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center shadow-medium hover:shadow-strong transition-shadow duration-300 p-6 h-full">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                    {feature.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-semibold text-foreground mt-4">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} QuizLink. All rights reserved.</p>
        </div>
      </footer>
    </PageLayout>
  )
}
