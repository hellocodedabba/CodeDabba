"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Type, Video, Image as ImageIcon, FileText, Trash2, GripVertical, Loader2, Edit3, Eye, X } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { Reorder } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NavBar } from "@/components/landing/NavBar";
import MarkdownEditor from "@/components/MarkdownEditor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TaskEditor, { Task } from "@/components/TaskEditor";
import { Code, CheckCircle } from "lucide-react";

// Interfaces
interface LessonBlock {
    id: string;
    type: "video" | "text" | "image" | "file";
    content: string;
    orderIndex: number;
}

interface Chapter {
    id: string;
    title: string;
    blocks: LessonBlock[];
    tasks: Task[];
}

export default function ChapterEditPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;
    const chapterId = params.chapterId as string;

    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [blocks, setBlocks] = useState<LessonBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // UI State for adding blocks
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [activeTextEditor, setActiveTextEditor] = useState<string | null>(null); // Block ID being edited
    const [textEditorContent, setTextEditorContent] = useState("");
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Task State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isTaskEditorOpen, setIsTaskEditorOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<Task | null>(null);

    useEffect(() => {
        fetchChapter();
    }, [chapterId]);

    const fetchChapter = async () => {
        try {
            // Updated backend endpoint to fetch chapter with blocks sorted
            // Assuming GET /chapters/:id returns chapter with blocks
            // If strictly needed, we might need a specific endpoint or updated existing one
            // Trying standard endpoint first

            // Wait, standard endpoint likely lives in `CoursesService` -> `findOne` (course) or something. 
            // We probably need `GET /courses/chapters/:chapterId` or similar.
            // But I didn't create a GET endpoint in ChaptersController.
            // I should assume the existing `Get /courses/:id` returns nested modules/chapters but maybe not blocks.
            // Or maybe there is `GET /chapters/:id`.
            // Let's assume I need to fetch it.
            // If I can't fetch it, I can't render it.
            // Checking previous `CoursesService.findOne` implementation for course:
            // It included `modules.chapters`. It didn't include `blocks`.

            // I should use the existing course fetch for navigation context, but better to fetch chapter directly.
            // I'll try fetching `/chapters/${chapterId}` if it exists, otherwise I might need to add it.
            // But let's try assuming the backend has it or I can add it quickly.
            // Actually, I didn't add GET to ChaptersController.
            // But maybe I can use `GET /courses/chapters/:chapterId` if it exists.

            // Wait! I forgot to add a GET endpoint for the chapter!
            // I MUST implement GET /chapters/:id in ChaptersController or update CoursesController to include blocks.
            // Since user wants "Clean separation", I'll add GET /chapters/:id to ChaptersController.
            // But first let me finish frontend code assuming the endpoint will exist.

            const { data } = await api.get(`/chapters/${chapterId}`);
            setChapter(data);
            setBlocks(data.blocks || []);
            setTasks(data.tasks || []);
        } catch (error) {
            console.error("Failed to fetch chapter", error);
            // Fallback: try fetching course and finding chapter? No, need blocks.
        } finally {
            setLoading(false);
        }
    };

    const handleReorder = async (newOrder: LessonBlock[]) => {
        setBlocks(newOrder); // Optimistic update

        // Prepare payload: [{ id, order_index }]
        const payload = newOrder.map((block, index) => ({
            id: block.id,
            order_index: index + 1 // 1-based index
        }));

        try {
            await api.patch(`/chapters/${chapterId}/blocks/reorder`, payload);
        } catch (error) {
            console.error("Failed to reorder blocks", error);
            fetchChapter(); // Revert on error
        }
    };

    const handleAddBlock = async (type: "video" | "text" | "image" | "file", content: string) => {
        try {
            setSaving(true);
            const { data } = await api.post(`/chapters/${chapterId}/blocks`, {
                type: type,
                content
            });
            setBlocks(prev => [...prev, data]);
            setShowAddMenu(false);

            if (type === 'text') {
                // Automatically open editor for new text block?
                // Or maybe just add it with empty content/placeholder and let user edit.
            }
        } catch (error) {
            console.error("Failed to add block", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBlock = async (blockId: string) => {
        if (!confirm("Are you sure you want to delete this block?")) return;
        try {
            await api.delete(`/chapters/${chapterId}/blocks/${blockId}`);
            setBlocks(prev => prev.filter(b => b.id !== blockId));
        } catch (error) {
            console.error("Failed to delete block", error);
        }
    };

    const uploadFile = async (file: File, type: "video" | "image" | "file"): Promise<string> => {
        // 1. Get signature
        const folder = `courses/${courseId}/chapters/${chapterId}/${type}s`;
        const { data: signData } = await api.post('/chapters/upload-signature', { folder });

        // 2. Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signData.apiKey);
        formData.append('timestamp', signData.timestamp);
        formData.append('signature', signData.signature);
        formData.append('folder', signData.folder);

        const uploadRes = await fetch(signData.uploadUrl, {
            method: 'POST',
            body: formData
        });

        if (!uploadRes.ok) throw new Error('Upload failed');

        const uploadData = await uploadRes.json();
        return uploadData.secure_url;
    }

    const handleUpload = async (file: File, type: "video" | "image" | "file") => {
        try {
            setSaving(true);
            const url = await uploadFile(file, type);
            // 3. Create Block
            await handleAddBlock(type, url);

        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBlockContent = async (blockId: string, newContent: string) => {
        try {
            // Optimistic update
            setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content: newContent } : b));
            setActiveTextEditor(null);

            // API call - assuming we have a PATCH endpoint for block content
            // If not, we might need to delete and recreate or add a dedicated endpoint?
            // "CourseService" has `reorderBlocks` but no `updateBlock`.
            // I should double check if I have update block endpoint. 
            // In "Step 46" view_file of courses.service.ts, I see `createBlock`, `reorderBlocks`.
            // I DO NOT SEE `updateBlock`.
            // I need to add `updateBlock` to backend or use a workaround.
            // For now, I will assume I can add it or it exists. 
            // Wait, I am the one writing the backend too. I should add it.
            // But let's write the frontend call first.
            await api.patch(`/chapters/${chapterId}/blocks/${blockId}`, { content: newContent });
        } catch (error) {
            console.error("Failed to update block", error);
            alert("Failed to save changes.");
            fetchChapter(); // Revert
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "video" | "image" | "file") => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0], type);
        }
    };

    // --- Task Handlers ---

    const handleReorderTasks = async (newOrder: Task[]) => {
        setTasks(newOrder);
        const payload = newOrder.map((t, i) => ({ id: t.id!, order_index: i + 1 }));
        try {
            await api.patch(`/chapters/${chapterId}/tasks/reorder`, payload);
        } catch (error) {
            console.error("Failed to reorder tasks", error);
            fetchChapter();
        }
    };

    const handleSaveTask = async (task: Task) => {
        try {
            if (task.id) {
                // Update
                const { data } = await api.patch(`/chapters/${chapterId}/tasks/${task.id}`, task);
                setTasks(prev => prev.map(t => t.id === task.id ? data : t));
            } else {
                // Create
                const { data } = await api.post(`/chapters/${chapterId}/tasks`, task);
                setTasks(prev => [...prev, data]);
            }
            setIsTaskEditorOpen(false);
            setCurrentTask(null);
        } catch (error) {
            console.error("Failed to save task", error);
            alert("Failed to save task");
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("Delete this task?")) return;
        try {
            await api.delete(`/chapters/${chapterId}/tasks/${taskId}`);
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (error) {
            console.error("Failed to delete task", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
            <div className="min-h-screen bg-black text-white pb-24">
                <NavBar />

                <div className="container mx-auto px-6 py-24 max-w-4xl">
                    <div className="flex items-center gap-4 mb-8 justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={`/mentor/dashboard/courses/${courseId}/builder`} className="text-zinc-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{chapter?.title || 'Chapter Editor'}</h1>
                                <p className="text-zinc-400 text-sm">Add and arrange content blocks</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isPreviewMode ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                        >
                            {isPreviewMode ? (
                                <>
                                    <Edit3 className="w-4 h-4" />
                                    Back to Edit
                                </>
                            ) : (
                                <>
                                    <Eye className="w-4 h-4" />
                                    Preview Lesson
                                </>
                            )}
                        </button>
                    </div>

                    {
                        isPreviewMode ? (
                            <div className="space-y-8 max-w-3xl mx-auto" >
                                {
                                    blocks.map((block) => (
                                        <div key={block.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {block.type === 'text' && (
                                                <div className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-violet-400 prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {block.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                            {block.type === 'video' && (
                                                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
                                                    <video src={block.content} controls className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            {block.type === 'image' && (
                                                <div className="rounded-xl overflow-hidden border border-zinc-800">
                                                    <img src={block.content} alt="Lesson content" className="w-full h-auto" />
                                                </div>
                                            )}
                                            {block.type === 'file' && (
                                                <a
                                                    href={block.content}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-violet-500/50 hover:bg-zinc-900/80 transition-all group"
                                                >
                                                    <div className="p-3 bg-violet-500/10 rounded-full group-hover:bg-violet-500/20 transition-colors">
                                                        <FileText className="w-6 h-6 text-violet-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">Attached Resource</p>
                                                        <p className="text-sm text-zinc-400 truncate max-w-xs">{block.content.split('/').pop()}</p>
                                                    </div>
                                                </a>
                                            )}
                                        </div>
                                    ))
                                }
                                {blocks.length === 0 && (
                                    <div className="text-center py-20 text-zinc-500">
                                        <p>No content added yet.</p>
                                    </div>
                                )}

                                {tasks.length > 0 && (
                                    <div className="mt-12 border-t border-zinc-800 pt-8">
                                        <h2 className="text-xl font-bold mb-6 text-white">Review Tasks</h2>
                                        <div className="space-y-4">
                                            {tasks.map(task => (
                                                <div key={task.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`p-3 rounded-lg ${task.type === 'CODING' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                            {task.type === 'CODING' ? <Code className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{task.type}</span>
                                                                {task.isRequired && <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-500/10 text-red-400">Required</span>}
                                                                <span className="text-xs text-zinc-500">{task.points} pts</span>
                                                            </div>
                                                            <h3 className="text-lg font-semibold text-white mb-2">{task.title}</h3>
                                                            <div className="prose prose-invert prose-sm max-w-none text-zinc-400">
                                                                <ReactMarkdown>{task.problemStatement}</ReactMarkdown>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-12">
                                <section>
                                    <h2 className="text-lg font-semibold text-zinc-400 mb-4 px-1">Lesson Content</h2>
                                    <Reorder.Group axis="y" values={blocks} onReorder={handleReorder} className="space-y-4">
                                        {blocks.map((block) => (
                                            <Reorder.Item key={block.id} value={block} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4 group">
                                                <div className="pt-1 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-medium text-violet-400 uppercase tracking-wider bg-violet-500/10 px-2 py-1 rounded">
                                                            {block.type}
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeleteBlock(block.id)}
                                                            className="text-zinc-500 hover:text-red-400 transition-colors hidden group-hover:block"
                                                            title="Delete Block"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        {block.type === 'text' && !activeTextEditor && (
                                                            <button
                                                                onClick={() => setActiveTextEditor(block.id)}
                                                                className="text-zinc-500 hover:text-violet-400 transition-colors hidden group-hover:block"
                                                                title="Edit Content"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Block Content Rendering */}
                                                    {block.type === 'text' && (
                                                        activeTextEditor === block.id ? (
                                                            <div className="h-96">
                                                                <MarkdownEditor
                                                                    initialValue={block.content}
                                                                    onSave={(val) => handleSaveBlockContent(block.id, val)}
                                                                    onCancel={() => setActiveTextEditor(null)}
                                                                    onImageUpload={(file) => uploadFile(file, 'image')}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-violet-400 prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {block.content}
                                                                </ReactMarkdown>
                                                            </div>
                                                        )
                                                    )}

                                                    {block.type === 'video' && (
                                                        <div className="aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800">
                                                            <video src={block.content} controls className="w-full h-full object-cover" />
                                                        </div>
                                                    )}

                                                    {block.type === 'image' && (
                                                        <div className="rounded-lg overflow-hidden border border-zinc-800 mt-2">
                                                            <img src={block.content} alt="Block content" className="max-w-full h-auto" />
                                                        </div>
                                                    )}

                                                    {block.type === 'file' && (
                                                        <a
                                                            href={block.content}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-violet-500/50 transition-colors"
                                                        >
                                                            <FileText className="w-5 h-5 text-violet-400" />
                                                            <span className="text-sm text-zinc-300 truncate">{block.content.split('/').pop()}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>

                                    {/* Add Block Area */}
                                    <div className="relative mt-8">
                                        {!showAddMenu ? (
                                            <button
                                                onClick={() => setShowAddMenu(true)}
                                                className="w-full py-4 bg-zinc-900/50 border border-dashed border-zinc-800 hover:border-violet-500 hover:bg-violet-500/5 text-zinc-400 hover:text-violet-400 rounded-xl flex items-center justify-center gap-2 transition-all font-medium"
                                            >
                                                <Plus className="w-5 h-5" />
                                                Add Block
                                            </button>
                                        ) : (
                                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-sm font-medium text-white">Select Block Type</h3>
                                                    <button onClick={() => setShowAddMenu(false)} className="text-zinc-500 hover:text-white text-sm">Cancel</button>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    <button onClick={() => handleAddBlock('text', '## New Text Block\nEdit checks content here.')} className="flex flex-col items-center gap-2 p-4 bg-zinc-950 border border-zinc-800 hover:border-violet-500/50 rounded-lg transition-all group">
                                                        <Type className="w-6 h-6 text-zinc-500 group-hover:text-violet-400" />
                                                        <span className="text-sm text-zinc-400 group-hover:text-white">Text</span>
                                                    </button>

                                                    <label className="flex flex-col items-center gap-2 p-4 bg-zinc-950 border border-zinc-800 hover:border-violet-500/50 rounded-lg transition-all group cursor-pointer">
                                                        <Video className="w-6 h-6 text-zinc-500 group-hover:text-violet-400" />
                                                        <span className="text-sm text-zinc-400 group-hover:text-white">Video</span>
                                                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileSelect(e, 'video')} />
                                                    </label>

                                                    <label className="flex flex-col items-center gap-2 p-4 bg-zinc-950 border border-zinc-800 hover:border-violet-500/50 rounded-lg transition-all group cursor-pointer">
                                                        <ImageIcon className="w-6 h-6 text-zinc-500 group-hover:text-violet-400" />
                                                        <span className="text-sm text-zinc-400 group-hover:text-white">Image</span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
                                                    </label>

                                                    <label className="flex flex-col items-center gap-2 p-4 bg-zinc-950 border border-zinc-800 hover:border-violet-500/50 rounded-lg transition-all group cursor-pointer">
                                                        <FileText className="w-6 h-6 text-zinc-500 group-hover:text-violet-400" />
                                                        <span className="text-sm text-zinc-400 group-hover:text-white">PDF / File</span>
                                                        <input type="file" className="hidden" onChange={(e) => handleFileSelect(e, 'file')} />
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Tasks Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <h2 className="text-lg font-semibold text-zinc-400">Pop Quizzes & Coding Challenges</h2>
                                        <button
                                            onClick={() => { setCurrentTask(null); setIsTaskEditorOpen(true); }}
                                            className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" /> Add Task
                                        </button>
                                    </div>

                                    <Reorder.Group axis="y" values={tasks} onReorder={handleReorderTasks} className="space-y-4">
                                        {tasks.map((task) => (
                                            <Reorder.Item key={task.id} value={task} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4 group">
                                                <div className="pt-1 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded ${task.type === 'CODING' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                                {task.type === 'CODING' ? <Code className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-white font-medium">{task.title}</h4>
                                                                <div className="flex gap-2 text-xs text-zinc-500">
                                                                    <span>{task.type}</span>
                                                                    <span>•</span>
                                                                    <span>{task.points} pts</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setCurrentTask(task); setIsTaskEditorOpen(true); }}
                                                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTask(task.id!)}
                                                                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>

                                    {tasks.length === 0 && (
                                        <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                                            <p className="text-sm">No tasks added yet.</p>
                                            <button
                                                onClick={() => { setCurrentTask(null); setIsTaskEditorOpen(true); }}
                                                className="mt-2 text-violet-400 hover:underline text-sm"
                                            >
                                                Create your first task
                                            </button>
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}

                    {isTaskEditorOpen && (
                        <TaskEditor
                            initialTask={currentTask}
                            onSave={handleSaveTask}
                            onCancel={() => { setIsTaskEditorOpen(false); setCurrentTask(null); }}
                        />
                    )}
                </div>
            </div >
        </ProtectedRoute >
    );
}
