"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Loader2, BookOpen, FileText, Code, CheckCircle2, ChevronDown, ChevronRight, Video, Image as ImageIcon, AlertTriangle } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NavBar } from "@/components/landing/NavBar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "react-hot-toast";
import TaskPreview from "@/components/TaskPreview";
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
    const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
    const [expandedTasks, setExpandedTasks] = useState<string[]>([]);

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            const { data } = await api.get(`/courses/${courseId}`);
            setCourse(data);
            if (data.modules) {
                setExpandedModules(data.modules.map((m: any) => m.id));
                const allChapterIds = data.modules.flatMap((m: any) => m.chapters?.map((c: any) => c.id) || []);
                setExpandedChapters(allChapterIds);
            }
        } catch (error) {
            console.error("Failed to fetch course", error);
            toast.error("Failed to load course details");
        } finally {
            setLoading(false);
        }
    };

    const isCurriculumReview = course?.status === 'curriculum_under_review';
    const isContentReview = course?.status === 'content_under_review';

    const handleApprove = async () => {
        if (!course) return;

        const action = isCurriculumReview ? 'curriculum' : isContentReview ? 'content' : null;
        if (!action) {
            toast.error("Invalid status for approval");
            return;
        }

        if (!confirm(`Are you sure you want to approve the ${action}?`)) return;

        setActionLoading(true);
        try {
            await api.post(`/courses/${courseId}/approve-${action}`);
            toast.success(`${action === 'curriculum' ? 'Curriculum' : 'Content'} approved!`);
            router.push("/admin/dashboard");
        } catch (error) {
            console.error("Failed to approve", error);
            toast.error("Failed to approve");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        const action = isCurriculumReview ? 'curriculum' : isContentReview ? 'content' : null;
        if (!action) {
            toast.error("Invalid status for rejection");
            return;
        }

        setActionLoading(true);
        try {
            await api.post(`/courses/${courseId}/reject-${action}`, { reason: rejectReason });
            toast.success(`${action === 'curriculum' ? 'Curriculum' : 'Content'} rejected`);
            setIsRejectDialogOpen(false);
            router.push("/admin/dashboard");
        } catch (error) {
            console.error("Failed to reject", error);
            toast.error("Failed to reject");
        } finally {
            setActionLoading(false);
        }
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
        );
    };

    const toggleChapter = (chapterId: string) => {
        setExpandedChapters(prev =>
            prev.includes(chapterId) ? prev.filter(id => id !== chapterId) : [...prev, chapterId]
        );
    };

    const toggleTask = (taskId: string) => {
        setExpandedTasks(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
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

    const reviewPhaseLabel = isCurriculumReview ? "Phase 1: Curriculum Review" : isContentReview ? "Phase 2: Content Review" : "Listing Details";
    const submissionTime = isCurriculumReview ? (course as any).submittedCurriculumAt : isContentReview ? (course as any).submittedContentAt : (course as any).submittedAt || course.submittedAt;

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <div className="min-h-screen bg-black text-white pb-24">
                <NavBar />
                <div className="container mx-auto px-6 py-24">

                    {/* Phase Banner */}
                    {(isCurriculumReview || isContentReview) && (
                        <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3 text-yellow-500">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-bold">{reviewPhaseLabel}</span>
                            <span className="text-sm text-yellow-500/70 ml-2">
                                {isCurriculumReview
                                    ? "Review structure (Modules & Chapters), metadata, and pricing. Content might be empty."
                                    : "Review full lesson content, tasks, and media."}
                            </span>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/dashboard" className="text-zinc-500 hover:text-white transition-colors">
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold">{course.title}</h1>
                                <p className="text-zinc-400">Review Submission • Submitted by {course.mentor.name} {submissionTime ? `on ${new Date(submissionTime).toLocaleString()}` : ''}</p>
                            </div>
                        </div>

                        {(isCurriculumReview || isContentReview) && (
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsRejectDialogOpen(true)}
                                    disabled={actionLoading}
                                    className="px-6 py-2 bg-red-600/10 text-red-500 border border-red-900/50 rounded-xl hover:bg-red-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Reject {isCurriculumReview ? 'Curriculum' : 'Content'}
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                    Approve & {isContentReview ? 'Publish' : 'Unlock Phase 2'}
                                </button>
                            </div>
                        )}
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
                                    {isCurriculumReview ? 'Structure Preview' : 'Curriculum & Content Preview'}
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
                                                            <div
                                                                className="flex items-center justify-between cursor-pointer group"
                                                                onClick={() => toggleChapter(chapter.id)}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    {expandedChapters.includes(chapter.id) ? (
                                                                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                                                                    ) : (
                                                                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                                                                    )}
                                                                    <FileText className="w-4 h-4 text-zinc-500" />
                                                                    <h4 className="font-medium text-zinc-200 group-hover:text-white transition-colors">{chapter.title}</h4>
                                                                    {chapter.isFreePreview && (
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                                                                            Free Preview
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">
                                                                    {chapter.blocks?.length || 0} Blocks • {chapter.tasks?.length || 0} Tasks
                                                                </span>
                                                            </div>

                                                            {/* Lesson Content (Only show if expanded) */}
                                                            {expandedChapters.includes(chapter.id) && (
                                                                <div className="mt-6 pl-7 space-y-6">
                                                                    {/* Chapter Description if any? (Not in schema but good to have) */}

                                                                    {chapter.blocks?.map((block: any) => {
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
                                                                                        <div
                                                                                            className="p-4 bg-zinc-900/50 flex items-start gap-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                                                                                            onClick={() => toggleTask(task.id)}
                                                                                        >
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
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <h4 className="font-semibold text-zinc-200">{task.title}</h4>
                                                                                                        {expandedTasks.includes(task.id) ? (
                                                                                                            <ChevronDown className="w-3 h-3 text-zinc-500" />
                                                                                                        ) : (
                                                                                                            <ChevronRight className="w-3 h-3 text-zinc-500" />
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <span className="text-xs font-mono bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-zinc-400">
                                                                                                        {task.points} pts
                                                                                                    </span>
                                                                                                </div>

                                                                                                {expandedTasks.includes(task.id) && (
                                                                                                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                                                                                                        <TaskPreview task={task as any} showResults={true} />
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Empty state for curriculum review */}
                                                            {isCurriculumReview && (!chapter.blocks || chapter.blocks.length === 0) && (
                                                                <div className="pl-7 mt-2">
                                                                    <p className="text-xs text-zinc-600 italic">Content Pending (Phase 2)</p>
                                                                </div>
                                                            )}
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
                            <DialogTitle>Reject {isCurriculumReview ? 'Curriculum' : 'Content'}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <p className="text-sm text-zinc-400">Please provide a clear reason for rejection. This feedback will be sent to the mentor.</p>
                            <textarea
                                autoFocus
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g. Structure needs work, descriptions are vague..."
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

