"use client";

import { BlogCard } from "./BlogCard";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const BLOGS = [
    {
        title: "The Rise of AI in Frontend Development",
        excerpt: "How tools like Copilot and v0 are changing the way we build interfaces and what you need to learn to stay ahead.",
        date: "Feb 14, 2024",
        readTime: "5 min read",
        imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2670&auto=format&fit=crop",
        category: "AI & Tech",
        slug: "ai-in-frontend",
    },
    {
        title: "Mastering TypeScript Generics",
        excerpt: "A deep dive into one of TypeScript's most powerful features. Learn how to write reusable and type-safe code.",
        date: "Feb 10, 2024",
        readTime: "8 min read",
        imageUrl: "https://images.unsplash.com/photo-1629904853716-6c29f465d43f?q=80&w=2670&auto=format&fit=crop",
        category: "Tutorial",
        slug: "mastering-generics",
    },
    {
        title: "System Design 101: Scalability",
        excerpt: "Understanding the core principles of building scalable systems. Load balancing, caching, and database sharding explained.",
        date: "Feb 08, 2024",
        readTime: "12 min read",
        imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop",
        category: "System Design",
        slug: "system-design-scalability",
    },
];

export function BlogSection() {
    return (
        <section id="blogs" className="py-24 bg-black relative">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <span className="text-violet-400 font-medium tracking-wide uppercase text-sm">Community Insights</span>
                        <h2 className="text-3xl font-bold text-white mt-2">Latest from the Blog</h2>
                    </div>
                    <Link href="/blog" className="flex items-center gap-2 text-white hover:text-violet-400 transition-colors group">
                        View All Articles
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {BLOGS.map((blog) => (
                        <BlogCard key={blog.slug} {...blog} />
                    ))}
                </div>
            </div>
        </section>
    );
}
