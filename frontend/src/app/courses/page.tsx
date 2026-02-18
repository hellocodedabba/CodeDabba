"use client";

import { useEffect, useState, Suspense } from "react";
import { NavBar } from "@/components/landing/NavBar";
import api from "@/lib/axios";
import Link from "next/link";
import { Search, BookOpen, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    mentor: { name: string };
    category: string;
    level: string;
    createdAt: string;
    accessType: 'free' | 'paid';
    price: number;
    isEnrolled?: boolean;
}

function CoursesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    // Filters
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const level = searchParams.get("level") || "";
    const page = Number(searchParams.get("page")) || 1;

    useEffect(() => {
        fetchCourses();
    }, [search, category, level, page]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: "9",
                search,
                category,
                level
            });
            const { data } = await api.get(`/courses?${query.toString()}`);
            setCourses(data.data);
            setTotal(data.total);
        } catch (error) {
            console.error("Failed to fetch courses", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const term = formData.get("search") as string;
        updateParams({ search: term, page: 1 }); // Reset to page 1
    };

    const updateParams = (updates: any) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                params.set(key, value as string);
            } else {
                params.delete(key);
            }
        });
        router.push(`/courses?${params.toString()}`);
    };

    return (
        <div className="pt-32 pb-12 container mx-auto px-6">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400 mb-6">
                    Explore Our Courses
                </h1>
                <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                    Master new skills with our expertly curated courses. From coding to design, we have something for everyone.
                </p>
            </div>

            {/* Filters & Search */}
            <div className="mb-12 flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        name="search"
                        defaultValue={search}
                        placeholder="Search courses..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                    />
                </form>

                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <select
                        value={category}
                        onChange={(e) => updateParams({ category: e.target.value, page: 1 })}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-300 focus:outline-none focus:border-violet-500 cursor-pointer"
                    >
                        <option value="">All Categories</option>
                        <option value="Development">Development</option>
                        <option value="Design">Design</option>
                        <option value="Business">Business</option>
                        <option value="Data Science">Data Science</option>
                    </select>
                    <select
                        value={level}
                        onChange={(e) => updateParams({ level: e.target.value, page: 1 })}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-300 focus:outline-none focus:border-violet-500 cursor-pointer"
                    >
                        <option value="">All Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
            </div>

            {/* Course Grid */}
            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
                </div>
            ) : courses.length === 0 ? (
                <div className="text-center py-24">
                    <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">No courses found</h3>
                    <p className="text-zinc-400">Try adjusting your filters or search terms.</p>
                    <button
                        onClick={() => router.push('/courses')}
                        className="mt-6 text-violet-400 hover:text-violet-300"
                    >
                        Clear all filters
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.map((course) => (
                        <Link
                            key={course.id}
                            href={`/courses/${course.id}`} // We'll implement this next
                            className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all hover:shadow-2xl hover:shadow-violet-500/10 flex flex-col"
                        >
                            <div className="aspect-video bg-zinc-800 relative">
                                {/* Placeholder or Image */}
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                                    <BookOpen className="w-12 h-12 opacity-20" />
                                </div>
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-semibold border border-white/10">
                                        {course.category}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors line-clamp-2">
                                    {course.title}
                                </h3>
                                <p className="text-zinc-400 text-sm line-clamp-2 mb-4 flex-1">
                                    {course.description}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                                            {course.mentor.name.charAt(0)}
                                        </div>
                                        <span className="text-sm text-zinc-400">{course.mentor.name}</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded border capitalize ${course.level === 'beginner' ? 'border-green-500/20 text-green-400' :
                                        course.level === 'intermediate' ? 'border-yellow-500/20 text-yellow-400' :
                                            'border-red-500/20 text-red-400'
                                        }`}>
                                        {course.level}
                                    </span>
                                </div>

                                <div className="mt-6">
                                    {course.isEnrolled ? (
                                        <div className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-colors text-center">
                                            Continue Learning
                                        </div>
                                    ) : course.accessType === 'free' ? (
                                        <div className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors text-center">
                                            Start Learning
                                        </div>
                                    ) : (
                                        <div className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 text-center">
                                            Enroll • ${course.price}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {total > 9 && (
                <div className="mt-12 flex justify-center gap-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => updateParams({ page: page - 1 })}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-zinc-400">
                        Page {page} of {Math.ceil(total / 9)}
                    </span>
                    <button
                        disabled={page >= Math.ceil(total / 9)}
                        onClick={() => updateParams({ page: page + 1 })}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default function CoursesPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
            <NavBar />
            <Suspense fallback={
                <div className="flex justify-center items-center py-32">
                    <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
                </div>
            }>
                <CoursesContent />
            </Suspense>
        </div>
    );
}
