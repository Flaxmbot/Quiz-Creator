"use client";

import React from 'react'
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
      <section className="text-center container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-32 bg-gradient-to-b from-background to-muted">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-foreground leading-tight">
          Create Engaging Quizzes in Minutes
        </h1>
        <p className="mt-4 sm:mt-6 max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed">
          QuizLink is the simplest way for teachers to build, share, and analyze quizzes. Powered by AI to help you create better questions, faster.
        </p>
        <div className="mt-8 sm:mt-10">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="/create">Create Your First Quiz</Link>
          </Button>
        </div>
      </section>

      <section className="bg-background py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-foreground mb-8 sm:mb-12 lg:mb-16">Why Choose QuizLink?</h2>
          <div className="mt-8 sm:mt-12 grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center shadow-medium hover:shadow-strong transition-shadow duration-300 p-4 sm:p-6 h-full">
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="mx-auto bg-primary/10 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 text-primary">
                      {React.cloneElement(feature.icon, { className: "w-full h-full text-primary" })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
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
