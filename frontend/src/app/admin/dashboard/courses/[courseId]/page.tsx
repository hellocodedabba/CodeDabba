"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Loader2, BookOpen, FileText, Code, CheckCircle2, ChevronDown, ChevronRight, Video, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NavBar } from "@/components/landing/NavBar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    level: string;
    category: string;
    price: number;
    accessType: string;
    status: string;
    submittedAt: string;
    mentor: { name: string; email: string };
    modules: any[];
}

export default function CourseReviewPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Reject Dialog
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            const { data } = await api.get(`/courses/${courseId}`);
            setCourse(data);
            setExpandedModules(data.modules.map((m: any) => m.id));
        } catch (error) {
            console.error("Failed to fetch course", error);
            toast.error("Failed to load course details");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!confirm("Are you sure you want to approve and publish this course?")) return;
        setActionLoading(true);
        try {
            await api.post(`/courses/${courseId}/approve`);
            toast.success("Course approved and published!");
            router.push("/admin/dashboard");
        } catch (error) {
            console.error("Failed to approve course", error);
            toast.error("Failed to approve course");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }
        setActionLoading(true);
        try {
            await api.post(`/courses/${courseId}/reject`, { reason: rejectReason });
            toast.success("Course rejected");
            setIsRejectDialogOpen(false);
            router.push("/admin/dashboard");
        } catch (error) {
            console.error("Failed to reject course", error);
            toast.error("Failed to reject course");
        } finally {
            setActionLoading(false);
        }
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
        );
    }

    if (!course) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Course not found</div>;

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <div className="min-h-screen bg-black text-white pb-24">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/dashboard" className="text-zinc-500 hover:text-white transition-colors">
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold">{course.title}</h1>
                                <p className="text-zinc-400">Review Submission • Submitted by {course.mentor.name} on {new Date(course.submittedAt).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsRejectDialogOpen(true)}
                                disabled={actionLoading}
                                className="px-6 py-2 bg-red-600/10 text-red-500 border border-red-900/50 rounded-xl hover:bg-red-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <XCircle className="w-5 h-5" />
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                Approve & Publish
                            </button>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Metadata Section */}
                            <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-pink-500" />
                                    Course Details
                                </h2>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="aspect-video bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700">
                                        {course.thumbnailUrl ? (
                                            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-600 italic">No Thumbnail</div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Category</label>
                                            <p className="text-white">{course.category}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Level</label>
                                            <p className="text-white capitalize">{course.level}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Pricing</label>
                                            <p className="text-white capitalize">{course.accessType === 'free' ? 'Free Course' : `$${course.price}`}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Mentor Email</label>
                                            <p className="text-zinc-300">{course.mentor.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8">
                                    <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Description</label>
                                    <div className="mt-2 prose prose-invert prose-sm max-w-none text-zinc-400">
                                        <ReactMarkdown>{course.description}</ReactMarkdown>
                                    </div>
                                </div>
                            </section>

                            {/* Curriculum Preview */}
                            <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-pink-500" />
                                    Curriculum Preview
                                </h2>
                                <div className="space-y-4">
                                    {course.modules.map((module) => (
                                        <div key={module.id} className="border border-zinc-800 rounded-xl overflow-hidden">
                                            <div
                                                className="p-4 bg-zinc-900 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors"
                                                onClick={() => toggleModule(module.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {expandedModules.includes(module.id) ? (
                                                        <ChevronDown className="w-5 h-5 text-zinc-500" />
                                                    ) : (
                                                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                                                    )}
                                                    <h3 className="font-medium">{module.title}</h3>
                                                </div>
                                                <span className="text-xs text-zinc-500">{module.chapters?.length || 0} Chapters</span>
                                            </div>

                                            {expandedModules.includes(module.id) && (
                                                <div className="p-4 space-y-4 bg-black/20">
                                                    {module.chapters?.map((chapter: any) => (
                                                        <div key={chapter.id} className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-lg">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <FileText className="w-4 h-4 text-zinc-500" />
                                                                <h4 className="font-medium text-zinc-200">{chapter.title}</h4>
                                                            </div>

                                                            {/* Lesson Blocks */}
                                                            <div className="pl-7 space-y-6">
                                                                {chapter.blocks?.map((block: any) => {
                                                                    // Sanitize URL if it has a prefix like "filehttps" or "imagehttps" due to data corruption
                                                                    const cleanContent = (['image', 'video', 'file'].includes(block.type) && block.content && block.content.indexOf('http') > 0)
                                                                        ? block.content.substring(block.content.indexOf('http'))
                                                                        : block.content;

                                                                    return (
                                                                        <div key={block.id} className="text-sm">
                                                                            {block.type === 'text' && (
                                                                                <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
                                                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanContent}</ReactMarkdown>
                                                                                </div>
                                                                            )}
                                                                            {block.type === 'image' && (
                                                                                <div className="my-4 rounded-xl overflow-hidden border border-zinc-800 bg-black relative group">
                                                                                    <img src={cleanContent} alt="Lesson Content" className="w-full h-auto object-contain max-h-[500px]" />
                                                                                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs flex items-center gap-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                        <ImageIcon className="w-3 h-3" /> Image
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {block.type === 'video' && (
                                                                                <div className="my-4 rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video relative group">
                                                                                    <video src={cleanContent} controls className="w-full h-full" />
                                                                                    <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs flex items-center gap-1 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                                        <Video className="w-3 h-3" /> Video
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {block.type === 'file' && (
                                                                                <div className="my-4">
                                                                                    <a href={cleanContent} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors group">
                                                                                        <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 group-hover:border-violet-500/30 transition-colors">
                                                                                            <FileText className="w-6 h-6 text-zinc-400 group-hover:text-violet-400" />
                                                                                        </div>
                                                                                        <div className="flex-1 overflow-hidden">
                                                                                            <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                                                                                                {cleanContent.split('/').pop() || 'Download File'}
                                                                                            </p>
                                                                                            <p className="text-xs text-zinc-500">Click to open/download</p>
                                                                                        </div>
                                                                                    </a>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}

                                                                {/* Tasks */}
                                                                {chapter.tasks?.length > 0 && (
                                                                    <div className="mt-8 pt-6 border-t border-zinc-800">
                                                                        <h5 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                                            <CheckCircle2 className="w-4 h-4" /> Tasks & Assignments
                                                                        </h5>
                                                                        <div className="space-y-4">
                                                                            {chapter.tasks?.map((task: any) => (
                                                                                <div key={task.id} className="bg-zinc-950/30 border border-zinc-800 rounded-xl overflow-hidden">
                                                                                    <div className="p-4 bg-zinc-900/50 flex items-start gap-3 border-b border-zinc-800/50">
                                                                                        {task.type === 'CODING' ? (
                                                                                            <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 border border-blue-500/20">
                                                                                                <Code className="w-4 h-4" />
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="bg-violet-500/10 p-2 rounded-lg text-violet-400 border border-violet-500/20">
                                                                                                <CheckCircle2 className="w-4 h-4" />
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="flex-1">
                                                                                            <div className="flex justify-between items-start">
                                                                                                <h4 className="font-semibold text-zinc-200">{task.title}</h4>
                                                                                                <span className="text-xs font-mono bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-zinc-400">
                                                                                                    {task.points} pts
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="mt-2 text-sm text-zinc-400 prose prose-invert prose-sm max-w-none">
                                                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.problemStatement}</ReactMarkdown>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="p-4 space-y-4 bg-black/20">
                                                                                        {task.type === 'MCQ' && task.options && (
                                                                                            <div className="space-y-2">
                                                                                                <p className="text-xs font-semibold text-zinc-500 uppercase">Options</p>
                                                                                                {task.options.map((opt: any, idx: number) => (
                                                                                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${opt.isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-zinc-900/50 border-zinc-800'}`}>
                                                                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${opt.isCorrect ? 'border-green-500' : 'border-zinc-700'}`}>
                                                                                                            {opt.isCorrect && <div className="w-2 h-2 rounded-full bg-green-500" />}
                                                                                                        </div>
                                                                                                        <span className={opt.isCorrect ? 'text-green-300' : 'text-zinc-400'}>{opt.optionText}</span>
                                                                                                        {opt.isCorrect && <span className="ml-auto text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Correct Answer</span>}
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}

                                                                                        {task.type === 'CODING' && (
                                                                                            <div className="space-y-4">
                                                                                                <div className="flex gap-4 text-xs">
                                                                                                    <div className="px-3 py-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-400">
                                                                                                        <span className="text-zinc-500 mr-2">Language:</span>{task.language}
                                                                                                    </div>
                                                                                                    <div className="px-3 py-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-400">
                                                                                                        <span className="text-zinc-500 mr-2">Time:</span>{task.timeLimit}s
                                                                                                    </div>
                                                                                                    <div className="px-3 py-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-400">
                                                                                                        <span className="text-zinc-500 mr-2">Memory:</span>{task.memoryLimit}MB
                                                                                                    </div>
                                                                                                </div>

                                                                                                {task.testCases && task.testCases.length > 0 && (
                                                                                                    <div className="space-y-2">
                                                                                                        <p className="text-xs font-semibold text-zinc-500 uppercase">Test Cases</p>
                                                                                                        <div className="grid gap-2">
                                                                                                            {task.testCases.map((tc: any, i: number) => (
                                                                                                                <div key={i} className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono space-y-2">
                                                                                                                    {tc.isHidden && (
                                                                                                                        <div className="mb-2 text-amber-500 flex items-center gap-1">
                                                                                                                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Hidden Case
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                                                        <div>
                                                                                                                            <span className="text-zinc-600 block mb-1">Input</span>
                                                                                                                            <div className="bg-black/50 p-2 rounded border border-zinc-800 text-zinc-300 overflow-x-auto">
                                                                                                                                {tc.input}
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                        <div>
                                                                                                                            <span className="text-zinc-600 block mb-1">Expected Output</span>
                                                                                                                            <div className="bg-black/50 p-2 rounded border border-zinc-800 text-zinc-300 overflow-x-auto">
                                                                                                                                {tc.expectedOutput}
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!module.chapters || module.chapters.length === 0) && (
                                                        <p className="text-center text-zinc-600 text-sm py-4 italic">No chapters in this module</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {course.modules.length === 0 && (
                                        <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-600">
                                            No modules created for this course.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="space-y-6">
                            {/* Summary Card */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sticky top-24">
                                <h3 className="font-bold mb-4">Review Summary</h3>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Modules</span>
                                        <span className="text-white">{course.modules.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Chapters</span>
                                        <span className="text-white">{course.modules.reduce((acc, m) => acc + (m.chapters?.length || 0), 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Total Tasks</span>
                                        <span className="text-white">
                                            {course.modules.reduce((acc, m) =>
                                                acc + (m.chapters?.reduce((cAcc: any, c: any) => cAcc + (c.tasks?.length || 0), 0) || 0)
                                                , 0)}
                                        </span>
                                    </div>
                                    <div className="pt-4 border-t border-zinc-800">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-zinc-500">Access</span>
                                            <span className="text-white capitalize">{course.accessType}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Price Tag</span>
                                            <span className="text-pink-500 font-bold">{course.accessType === 'free' ? 'FREE' : `$${course.price}`}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reject Dialog */}
                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject Course Submission</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <p className="text-sm text-zinc-400">Please provide a clear reason for rejecting this course. The mentor will see this and can make corrections.</p>
                            <textarea
                                autoFocus
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g. Content quality needs improvement, chapter 2 is missing video..."
                                className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-pink-500 transition-colors resize-none"
                            />
                        </div>
                        <DialogFooter>
                            <button
                                onClick={() => setIsRejectDialogOpen(false)}
                                className="px-4 py-2 text-sm text-zinc-500 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actionLoading || !rejectReason.trim()}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Reject"}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
}
