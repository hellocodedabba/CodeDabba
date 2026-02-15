/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";

import Link from "next/link";
import { ArrowRight, Code, Video, Award, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-32 bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="relative container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Master Coding by Doing, Not Just Watching.
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
            A structured learning platform where you write code, solve real
            problems, and get certified. No skipping ahead. Prove your skills
            to unlock the next level.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 md:text-lg md:px-10 transition-all shadow-lg hover:shadow-blue-500/25"
            >
              Start Learning for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 md:text-lg md:px-10 transition-all"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Why CodeDabba Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              We've replaced passive watching with active building.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Video className="h-8 w-8 text-blue-500" />}
              title="Structured Learning"
              description="Modules and chapters are locked. You must complete the task to unlock the next video."
            />
            <FeatureCard
              icon={<Code className="h-8 w-8 text-emerald-500" />}
              title="Hands-on Coding"
              description="Write code in our online compiler. It's automatically tested and verified instantly."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-8 w-8 text-purple-500" />}
              title="Verified Certification"
              description="Earn certificates that actually mean something because you proved your skills."
            />
            <FeatureCard
              icon={<Award className="h-8 w-8 text-amber-500" />}
              title="Expert Mentorship"
              description="Learn from industry pros. Get your code reviewed and doubts cleared in live sessions."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Trusted by Learners
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="I stopped watching tutorials and started actually coding. CodeDabba changed my career."
              author="Alex Rivers"
              role="Frontend Developer"
            />
            <TestimonialCard
              quote="The structured approach forced me to learn the fundamentals. No shortcuts allowed!"
              author="Sarah Chen"
              role="CS Student"
            />
            <TestimonialCard
              quote="Getting my code reviewed by a real mentor was the game changer I needed."
              author="Michael Ross"
              role="Self-taught Dev"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-2xl font-bold text-white">CodeDabba</span>
            <p className="mt-2 text-sm">© 2024 CodeDabba Inc. All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
      <div className="mb-4 bg-gray-50 dark:bg-gray-800 w-16 h-16 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl">
      <p className="text-lg text-gray-700 dark:text-gray-300 italic mb-6">&quot;{quote}&quot;</p>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{author}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
      </div>
    </div>
  );
}
