"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { ArrowLeft, Menu, CheckCircle, Circle, PlayCircle, Loader2, Video, FileText, Download, Code, ChevronDown, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "react-hot-toast";

interface LessonBlock {
    id: string;
    type: 'text' | 'video' | 'image' | 'file';
    content: string;
    orderIndex: number;
}

interface Task {
    id: string;
    title: string;
    type: 'MCQ' | 'CODING';
    problemStatement: string;
    points: number;
    options?: any[];
}

interface Chapter {
    id: string;
    title: string;
    blocks: LessonBlock[];
    tasks: Task[];
    isCompleted?: boolean;
    isFreePreview?: boolean;
}

interface Module {
    id: string;
    title: string;
    chapters: Chapter[];
}


interface Course {
    id: string;
    title: string;
    modules: Module[];
    progress?: {
        percentage: number;
        currentChapterId: string;
        completedChapterIds: string[];
    };
    isEnrolled?: boolean;
}

export default function LearnPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    useEffect(() => {
        fetchCourseAndProgress();
    }, [courseId]);

    const fetchCourseAndProgress = async () => {
        try {
            const { data } = await api.get(`/courses/${courseId}`);

            // params search extraction (basic)
            const searchParams = new URLSearchParams(window.location.search);
            const initialChapterId = searchParams.get('chapterId');

            let targetChapter: Chapter | null = null;
            let firstFreeChapter: Chapter | null = null;
            let firstChapter: Chapter | null = null;

            // Analyze chapters to find targets
            if (data.modules) {
                for (const m of data.modules) {
                    if (m.chapters) {
                        for (const c of m.chapters) {
                            if (!firstChapter) firstChapter = c;
                            if (c.isFreePreview && !firstFreeChapter) firstFreeChapter = c;
                            if (c.id === initialChapterId) targetChapter = c;
                        }
                    }
                }
            }

            // Access Control Logic
            if (!data.isEnrolled) {
                // If requesting specific chapter
                if (initialChapterId && targetChapter) {
                    if (!targetChapter.isFreePreview) {
                        toast.error("This lesson is locked. Please enroll to access.");
                        router.push(`/courses/${courseId}`);
                        return;
                    }
                    // Allowed
                } else {
                    // No specific chapter requested.
                    // If there are free chapters, default to first free one?
                    // Or just show first chapter if it's free?
                    // Let's show first free chapter if available, else redirect.
                    if (firstFreeChapter) {
                        targetChapter = firstFreeChapter;
                        toast('Welcome to the free preview!', { icon: '👋' });
                    } else if (firstChapter && firstChapter.isFreePreview) {
                        targetChapter = firstChapter;
                    } else {
                        toast.error("You must enroll in this course first");
                        router.push(`/courses/${courseId}`);
                        return;
                    }
                }
            } else {
                // Enrolled
                // Default to target or first or current progress (TODO: fetch progress)
                if (!targetChapter) {
                    // use progress.currentChapterId if available
                    if (data.progress?.currentChapterId) {
                        // find chapter obj
                        for (const m of data.modules) {
                            const found = m.chapters.find((c: any) => c.id === data.progress.currentChapterId);
                            if (found) {
                                targetChapter = found;
                                break;
                            }
                        }
                    }
                    if (!targetChapter) targetChapter = firstChapter;
                }
            }

            setCourse(data);

            if (data.modules) {
                setExpandedModules(data.modules.map((m: any) => m.id));
                if (targetChapter) {
                    setCurrentChapter(targetChapter);
                }
            }

        } catch (error) {
            console.error("Failed to load course", error);
            toast.error("Failed to load course content");
            router.push(`/courses/${courseId}`);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!course || !currentChapter) return;

        try {
            const { data } = await api.post(`/courses/${courseId}/chapters/${currentChapter.id}/complete`);

            if (data.completed) {
                toast.success("Lesson completed!");
                // Update local state
                setCourse(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        progress: {
                            percentage: data.progress.percentage,
                            currentChapterId: data.progress.currentChapterId,
                            completedChapterIds: data.progress.completedChapterIds
                        }
                    };
                });

                // Navigate to next chapter if available
                if (data.progress.currentChapterId && data.progress.currentChapterId !== currentChapter.id) {
                    // Find next chapter object
                    let nextChap: Chapter | null = null;
                    for (const m of course.modules) {
                        const found = m.chapters.find(c => c.id === data.progress.currentChapterId);
                        if (found) { nextChap = found; break; }
                    }
                    if (nextChap) {
                        setCurrentChapter(nextChap);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to complete lesson", error);
            toast.error("Failed to update progress");
        }
    };

    const handleChapterClick = (chapter: Chapter) => {
        if (!course?.isEnrolled && !chapter.isFreePreview) {
            toast.error("This lesson is locked. Enroll to continue.");
            return;
        }

        setCurrentChapter(chapter);
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    if (!course) return null;

    return (
        <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50 backdrop-blur-md z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/student/dashboard')} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-zinc-400" />
                    </button>
                    <h1 className="font-bold text-lg truncate max-w-md hidden md:block">{course.title}</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Progress Bar in Header */}
                    <div className="hidden md:flex flex-col w-48 gap-1">
                        <div className="flex justify-between text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                            <span>Progress</span>
                            <span>{course.progress?.percentage || 0}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${course.progress?.percentage || 0}%` }}
                            ></div>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 md:hidden"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    {!course.isEnrolled && (
                        <button
                            onClick={() => router.push(`/courses/${courseId}`)}
                            className="text-xs px-3 py-1.5 bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
                        >
                            Enroll Now
                        </button>
                    )}
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Sidebar - Curriculum */}
                <aside className={`
                    absolute md:relative z-10 w-80 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-none md:opacity-0'}
                `}>
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="font-bold text-zinc-200">Curriculum</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {course.modules.map((module) => (
                            <div key={module.id} className="space-y-1">
                                <button
                                    onClick={() => toggleModule(module.id)}
                                    className="w-full flex items-center justify-between p-2 hover:bg-zinc-800 rounded-lg text-sm font-medium text-zinc-300 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        {expandedModules.includes(module.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        <span className="truncate">{module.title}</span>
                                    </div>
                                </button>

                                {expandedModules.includes(module.id) && (
                                    <div className="pl-6 space-y-1">
                                        {module.chapters?.map((chapter) => (
                                            <button
                                                key={chapter.id}
                                                onClick={() => handleChapterClick(chapter)}
                                                className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors text-left group ${currentChapter?.id === chapter.id
                                                    ? 'bg-violet-600/10 text-violet-400 border border-violet-600/20'
                                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                                                    }`}
                                            >
                                                {/* Status Icon */}
                                                <div className="shrink-0">
                                                    {course.progress?.completedChapterIds?.includes(chapter.id) ? (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    ) : chapter.id === currentChapter?.id ? (
                                                        <PlayCircle className="w-4 h-4" />
                                                    ) : (
                                                        <Circle className="w-4 h-4 opacity-50" />
                                                    )}
                                                </div>
                                                <span className={`truncate flex-1 ${course.progress?.completedChapterIds?.includes(chapter.id) ? 'line-through opacity-70' : ''}`}>{chapter.title}</span>
                                                {chapter.isFreePreview && !course.isEnrolled && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">Free</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-black p-4 md:p-8 lg:p-12 scroll-smooth">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {!currentChapter ? (
                            <div className="text-center py-20">
                                <div className="inline-flex p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-6">
                                    <Video className="w-8 h-8 text-zinc-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Select a lesson to start</h2>
                                <p className="text-zinc-400">Choose a chapter from the curriculum on the left.</p>
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="mt-8 px-6 py-2 bg-violet-600 text-white rounded-lg md:hidden"
                                >
                                    Open Menu
                                </button>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-8 border-b border-zinc-800 pb-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        {currentChapter.isFreePreview && !course.isEnrolled && (
                                            <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs font-bold uppercase tracking-wider">
                                                Free Preview
                                            </span>
                                        )}
                                        <h2 className="text-3xl font-bold text-white">{currentChapter.title}</h2>
                                    </div>
                                    {/* <p className="text-zinc-400">Chapter description usually goes here if available.</p> */}
                                </div>

                                {/* Blocks Renderer */}
                                <div className="space-y-8">
                                    {currentChapter.blocks?.sort((a: any, b: any) => a.orderIndex - b.orderIndex).map((block) => (
                                        <div key={block.id} className="text-zinc-300 leading-relaxed text-lg">
                                            {block.type === 'text' && (
                                                <div className="prose prose-invert prose-lg max-w-none">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
                                                </div>
                                            )}

                                            {block.type === 'video' && (
                                                <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video shadow-2xl relative group">
                                                    {/* Sanitize URL logic should be here or in renderer */}
                                                    <video
                                                        src={block.content.includes('http') && block.content.indexOf('http') > 0 ? block.content.substring(block.content.indexOf('http')) : block.content}
                                                        controls
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'image' && (
                                                <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black my-6">
                                                    <img
                                                        src={block.content.includes('http') && block.content.indexOf('http') > 0 ? block.content.substring(block.content.indexOf('http')) : block.content}
                                                        alt="Lesson visual"
                                                        className="w-full h-auto object-contain"
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'file' && (
                                                <div className="my-6">
                                                    <a
                                                        href={block.content.includes('http') && block.content.indexOf('http') > 0 ? block.content.substring(block.content.indexOf('http')) : block.content}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-violet-500/30 transition-all group"
                                                    >
                                                        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-zinc-400 group-hover:text-violet-400 transition-colors">
                                                            <Download className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-white group-hover:text-violet-200 transition-colors">Download Resource</h4>
                                                            <p className="text-sm text-zinc-500">Click to open or download attached file</p>
                                                        </div>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Tasks Section */}
                                {currentChapter.tasks && currentChapter.tasks.length > 0 && (
                                    <div className="mt-16 pt-8 border-t border-zinc-800">
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                            <Code className="w-6 h-6 text-violet-500" />
                                            Tasks & Assignments
                                        </h3>
                                        <div className="space-y-6">
                                            {currentChapter.tasks.map((task) => (
                                                <div key={task.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 ${task.type === 'CODING' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
                                                                {task.type} Challenge
                                                            </span>
                                                            <h4 className="text-xl font-bold text-white">{task.title}</h4>
                                                        </div>
                                                        <div className="text-sm font-mono text-zinc-500 bg-black/50 px-3 py-1 rounded border border-zinc-800">
                                                            {task.points} pts
                                                        </div>
                                                    </div>

                                                    <div className="prose prose-invert prose-sm max-w-none text-zinc-400 mb-6">
                                                        <ReactMarkdown>{task.problemStatement}</ReactMarkdown>
                                                    </div>

                                                    {/* Interactive placeholder for tasks - since we don't have submission system yet */}
                                                    <div className="bg-black/50 border border-zinc-800 rounded-xl p-8 text-center">
                                                        <p className="text-zinc-500 italic mb-4">Task submission system coming soon.</p>
                                                        <button disabled className="px-6 py-2 bg-zinc-800 text-zinc-500 rounded-lg cursor-not-allowed">
                                                            Start Assignment
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Actions - Next/Prev */}
                                <div className="mt-12 flex justify-between pt-8 border-t border-zinc-800">
                                    <button className="px-6 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50" disabled>
                                        Previous Lesson
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!course?.isEnrolled) {
                                                router.push(`/courses/${courseId}`);
                                            } else {
                                                handleComplete();
                                            }
                                        }}
                                        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-900/20 transition-all"
                                    >
                                        {course?.isEnrolled ? "Mark Complete & Next" : "Enroll to Track Progress"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
