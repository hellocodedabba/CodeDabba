"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface BlogCardProps {
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    imageUrl: string;
    category: string;
    slug: string;
}

export function BlogCard({ title, excerpt, date, readTime, imageUrl, category, slug }: BlogCardProps) {
    return (
        <Link
            href={`/blog/${slug}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-zinc-900/50 border border-zinc-800 transition-all hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/10"
        >
            <div className="relative aspect-video overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 text-xs font-medium text-white bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                        {category}
                    </span>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
                    <span>{date}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span>{readTime}</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors">
                    {title}
                </h3>

                <p className="text-zinc-400 text-sm line-clamp-2 flex-1 mb-4">
                    {excerpt}
                </p>

                <div className="flex items-center text-sm font-medium text-violet-400 mt-auto">
                    Read Article
                    <ArrowUpRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
            </div>
        </Link>
    );
}
