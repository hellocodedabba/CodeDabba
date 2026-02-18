"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { NavBar } from "@/components/landing/NavBar";
import api from "@/lib/axios";
import { Loader2, BookOpen, CheckCircle, Lock, PlayCircle, FileText, Code } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "react-hot-toast";

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    mentor: { name: string; email: string };
    totalModules?: number;
    totalChapters?: number;
    accessType: 'free' | 'paid';
    price: number;
    isEnrolled?: boolean;
    modules: any[];
}

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            const { data } = await api.get(`/courses/${courseId}`);
            setCourse(data);
        } catch (error) {
            console.error("Failed to fetch course", error);
            toast.error("Failed to load course details");
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!course) return;
        setEnrolling(true);
        try {
            await api.post(`/courses/${course.id}/enroll`);
            toast.success("Enrolled successfully!");
            // Refresh course to get updated enrollment status
            fetchCourse();
            // Or redirect to learn page
            // router.push(`/learn/${course.id}`);
        } catch (error: any) {
            console.error("Enrollment failed", error);
            if (error.response?.status === 401) {
                toast.error("Please login to enroll");
                router.push('/login');
            } else {
                toast.error(error.response?.data?.message || "Failed to enroll");
            }
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    if (!course) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Course not found</div>;

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            <NavBar />

            {/* Hero Section */}
            <div className="pt-24 pb-12 bg-zinc-900/30 border-b border-zinc-800">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-block px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full text-xs font-medium uppercase tracking-wider">
                                {course.accessType === 'free' ? 'Free Course' : 'Premium Course'}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{course.title}</h1>
                            <p className="text-zinc-400 text-lg leading-relaxed">{course.description}</p>

                            <div className="flex items-center gap-4 text-sm text-zinc-500">
                                <span className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">
                                        {course.mentor.name.charAt(0)}
                                    </div>
                                    By {course.mentor.name}
                                </span>
                                <span>•</span>
                                <span>{course.modules.length} Modules</span>
                                <span>•</span>
                                <span>{course.modules.reduce((acc, m) => acc + (m.chapters?.length || 0), 0)} Lessons</span>
                            </div>

                            <div className="pt-4">
                                {course.isEnrolled ? (
                                    <button
                                        onClick={() => router.push(`/learn/${course.id}`)}
                                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-green-900/20 flex items-center gap-2"
                                    >
                                        <PlayCircle className="w-5 h-5" />
                                        Continue Learning
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleEnroll}
                                        disabled={enrolling}
                                        className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-violet-900/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {enrolling ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
                                        {course.accessType === 'free' ? 'Start Learning for Free' : `Enroll for $${course.price}`}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="relative aspect-video bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl">
                            {course.thumbnailUrl ? (
                                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                    <BookOpen className="w-16 h-16 opacity-20" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Curriculum */}
            <div className="container mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold mb-8">Course Curriculum</h2>
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {course.modules.map((module) => (
                            <div key={module.id} className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
                                <div className="p-4 bg-zinc-900/50 border-b border-zinc-800/50 flex justify-between items-center">
                                    <h3 className="font-medium text-zinc-200">{module.title}</h3>
                                    <span className="text-xs text-zinc-500">{module.chapters?.length || 0} Lessons</span>
                                </div>
                                <div className="divide-y divide-zinc-800/50">
                                    {module.chapters?.map((chapter: any) => (
                                        <div key={chapter.id} className="p-4 flex items-center justify-between group hover:bg-zinc-800/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-zinc-950 rounded border border-zinc-800 text-zinc-500 group-hover:text-violet-400 group-hover:border-violet-500/20 transition-all">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">{chapter.title}</p>
                                                    {/* <span className="text-xs text-zinc-600">{chapter.duration} min</span> */}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {chapter.isFreePreview && !course.isEnrolled ? (
                                                    <button
                                                        onClick={() => router.push(`/learn/${course.id}?chapterId=${chapter.id}`)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-all group-hover:shadow-lg shadow-violet-900/20"
                                                    >
                                                        <PlayCircle className="w-3.5 h-3.5" />
                                                        Preview
                                                    </button>
                                                ) : course.isEnrolled ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Unlocked
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                                        <Lock className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(!module.chapters || module.chapters.length === 0) && (
                                        <div className="p-4 text-center text-sm text-zinc-600 italic">No lessons yet</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 sticky top-24">
                            <h3 className="font-bold mb-4">What you'll learn</h3>
                            <div className="space-y-2 text-sm text-zinc-400">
                                {/* Placeholder for learning outcomes - could be added to Course entity later */}
                                <p>• Comprehensive understanding of the subject</p>
                                <p>• Hands-on projects and coding exercises</p>
                                <p>• Real-world applications and styling</p>
                                <p>• Certificate of completion</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
