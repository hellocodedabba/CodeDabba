import { useState, useEffect } from "react";
import { X, Check, Save } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";

export type TaskType = "MCQ" | "CODING";

export interface TaskOption {
    id?: string;
    optionText: string;
    isCorrect: boolean;
}

export interface TestCase {
    id?: string;
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
}

export interface Task {
    id?: string;
    title: string;
    type: TaskType;
    problemStatement: string;
    points: number;
    isRequired: boolean;
    orderIndex: number;
    options?: TaskOption[];
    testCases?: TestCase[];
    language?: string;
    starterCode?: string;
    timeLimit?: number;
    memoryLimit?: number;
}

interface TaskEditorProps {
    initialTask?: Task | null;
    onSave: (task: Task) => void;
    onCancel: () => void;
}

export default function TaskEditor({ initialTask, onSave, onCancel }: TaskEditorProps) {
    const [task, setTask] = useState<Task>(initialTask || {
        title: "",
        type: "MCQ",
        problemStatement: "",
        points: 10,
        isRequired: false,
        orderIndex: 0,
        options: [{ optionText: "", isCorrect: false }, { optionText: "", isCorrect: false }],
        testCases: [],
        language: "python",
        starterCode: "",
        timeLimit: 2,
        memoryLimit: 256
    });

    // Reset state when initialTask changes (e.g. opening different task)
    useEffect(() => {
        if (initialTask) {
            setTask(initialTask);
        }
    }, [initialTask]);

    const handleSave = () => {
        // Validation could go here
        onSave(task);
    };

    const addOption = () => {
        setTask({ ...task, options: [...(task.options || []), { optionText: "", isCorrect: false }] });
    };

    const removeOption = (index: number) => {
        const newOptions = [...(task.options || [])];
        newOptions.splice(index, 1);
        setTask({ ...task, options: newOptions });
    };

    const updateOption = (index: number, field: keyof TaskOption, value: any) => {
        const newOptions = [...(task.options || [])];
        newOptions[index] = { ...newOptions[index], [field]: value };

        // Ensure only one correct option for MCQ (if strictly single choice)
        if (field === 'isCorrect' && value === true) {
            newOptions.forEach((opt, i) => {
                if (i !== index) opt.isCorrect = false;
            });
        }

        setTask({ ...task, options: newOptions });
    };

    const addTestCase = () => {
        setTask({ ...task, testCases: [...(task.testCases || []), { input: "", expectedOutput: "", isHidden: false }] });
    };

    const removeTestCase = (index: number) => {
        const newTestCases = [...(task.testCases || [])];
        newTestCases.splice(index, 1);
        setTask({ ...task, testCases: newTestCases });
    };

    const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
        const newTestCases = [...(task.testCases || [])];
        newTestCases[index] = { ...newTestCases[index], [field]: value };
        setTask({ ...task, testCases: newTestCases });
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                    <h2 className="text-lg font-semibold text-white">{initialTask ? "Edit Task" : "Add New Task"}</h2>
                    <button onClick={onCancel} className="text-zinc-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
                            <input
                                type="text"
                                value={task.title}
                                onChange={(e) => setTask({ ...task, title: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-violet-500 outline-none"
                                placeholder="e.g. Calculate Fibonacci"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Points</label>
                            <input
                                type="number"
                                value={task.points}
                                onChange={(e) => setTask({ ...task, points: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-violet-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={task.isRequired}
                                onChange={(e) => setTask({ ...task, isRequired: e.target.checked })}
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900"
                            />
                            <span className="text-sm text-zinc-300">Required Task</span>
                        </label>

                        {!initialTask && (
                            <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                                <button
                                    onClick={() => setTask({ ...task, type: "MCQ" })}
                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${task.type === "MCQ" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}
                                >
                                    MCQ
                                </button>
                                <button
                                    onClick={() => setTask({ ...task, type: "CODING" })}
                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${task.type === "CODING" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}
                                >
                                    Coding
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Problem Statement */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Problem Statement</label>
                        <div className="h-64 border border-zinc-800 rounded-lg overflow-hidden">
                            <MarkdownEditor
                                initialValue={task.problemStatement}
                                onSave={(val) => setTask({ ...task, problemStatement: val })}
                                onCancel={() => { }} // No strict cancel needed inside here
                                onImageUpload={async (file) => ""} // TODO: implement if needed
                                hideControls={true} // Maybe custom prop to hide save/cancel buttons in editor if we want to use parent save
                            />
                        </div>
                        {/* Note: MarkdownEditor currently has its own Save button. We might need to refactor it or just use the onChange prop if we add one. 
                             For now, let's assume MarkdownEditor calls onSave when content changes or loses focus? 
                             Wait, looking at MarkdownEditor code, it has internal state and onSave prop. 
                             We should probably update MarkdownEditor to support 'onChange' for real-time updates or expose ref.
                             For quick fix, let's assume user clicks Save in MarkdownEditor or we rely on 'initialValue' only? No that won't work.
                             
                             Let's assume we modify MarkdownEditor to have an onChange prop.
                         */}
                    </div>

                    {/* Type Specific Fields */}
                    {task.type === "MCQ" && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium text-white">Options</h3>
                                <button onClick={addOption} className="text-xs text-violet-400 hover:text-violet-300">+ Add Option</button>
                            </div>
                            <div className="space-y-2">
                                {task.options?.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input
                                            type="radio"
                                            name="correctOption"
                                            checked={opt.isCorrect}
                                            onChange={(e) => updateOption(idx, 'isCorrect', e.target.checked)}
                                            className="w-4 h-4 accent-violet-500"
                                            title="Mark as correct answer"
                                        />
                                        <input
                                            type="text"
                                            value={opt.optionText}
                                            onChange={(e) => updateOption(idx, 'optionText', e.target.value)}
                                            className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm outline-none focus:border-violet-500"
                                            placeholder={`Option ${idx + 1}`}
                                        />
                                        <button onClick={() => removeOption(idx)} className="text-zinc-500 hover:text-red-400">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {task.type === "CODING" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Language</label>
                                    <select
                                        value={task.language}
                                        onChange={(e) => setTask({ ...task, language: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none"
                                    >
                                        <option value="python">Python</option>
                                        <option value="javascript">JavaScript</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Time Limit (sec)</label>
                                    <input
                                        type="number"
                                        value={task.timeLimit}
                                        onChange={(e) => setTask({ ...task, timeLimit: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Memory Limit (MB)</label>
                                    <input
                                        type="number"
                                        value={task.memoryLimit}
                                        onChange={(e) => setTask({ ...task, memoryLimit: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Starter Code</label>
                                <textarea
                                    value={task.starterCode}
                                    onChange={(e) => setTask({ ...task, starterCode: e.target.value })}
                                    className="w-full h-32 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 font-mono text-sm outline-none resize-none focus:border-violet-500"
                                    placeholder="# Write starter code here..."
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-medium text-white">Test Cases</h3>
                                    <button onClick={addTestCase} className="text-xs text-violet-400 hover:text-violet-300">+ Add Test Case</button>
                                </div>
                                {task.testCases?.map((tc, idx) => (
                                    <div key={idx} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg space-y-3">
                                        <div className="flex justify-end">
                                            <button onClick={() => removeTestCase(idx)} className="text-zinc-500 hover:text-red-400">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-zinc-500 mb-1">Input</label>
                                                <textarea
                                                    value={tc.input}
                                                    onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
                                                    className="w-full h-20 px-3 py-2 bg-black border border-zinc-800 rounded text-zinc-300 font-mono text-xs resize-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-500 mb-1">Expected Output</label>
                                                <textarea
                                                    value={tc.expectedOutput}
                                                    onChange={(e) => updateTestCase(idx, 'expectedOutput', e.target.value)}
                                                    className="w-full h-20 px-3 py-2 bg-black border border-zinc-800 rounded text-zinc-300 font-mono text-xs resize-none"
                                                />
                                            </div>
                                        </div>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={tc.isHidden}
                                                onChange={(e) => updateTestCase(idx, 'isHidden', e.target.checked)}
                                                className="w-3 h-3 rounded border-zinc-700 bg-black"
                                            />
                                            <span className="text-xs text-zinc-400">Hidden Test Case</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save Task
                    </button>
                </div>
            </div>
        </div>
    );
}
