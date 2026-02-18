"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
    Code, Quote, GripHorizontal, HelpCircle, X, Check, Eye, Edit3, Heading1, Heading2
} from "lucide-react";
import { toast } from "react-hot-toast";

// Helper to insert text at cursor position
const insertText = (
    textarea: HTMLTextAreaElement,
    textToInsert: string,
    cursorOffset: number = 0
) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const newValue = value.slice(0, start) + textToInsert + value.slice(end);

    // Return new value and new cursor position
    return {
        value: newValue,
        cursor: start + textToInsert.length + cursorOffset
    };
};

interface MarkdownEditorProps {
    initialValue?: string;
    value?: string;
    onSave?: (value: string) => void;
    onCancel?: () => void;
    onImageUpload?: (file: File) => Promise<string>; // Returns URL
    onChange?: (value: string) => void;
    hideControls?: boolean;
    placeholder?: string;
}

export default function MarkdownEditor({ initialValue = "", value: controlledValue, onSave, onCancel, onImageUpload, onChange, hideControls, placeholder }: MarkdownEditorProps) {
    const [internalValue, setInternalValue] = useState(initialValue);
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const setValue = (val: string) => {
        if (controlledValue === undefined) setInternalValue(val);
        if (onChange) onChange(val);
    };

    const [previewMode, setPreviewMode] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
    };

    const handleInsert = (template: string, offset = 0) => {
        if (!textareaRef.current) return;
        const { value: newValue, cursor } = insertText(textareaRef.current, template, offset);
        setValue(newValue);
        // Need to focus back and set cursor after render
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(cursor, cursor);
            }
        }, 0);
    };

    const handleImageClick = () => {
        if (!onImageUpload) {
            toast.error("Image upload not configured");
            return;
        }
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                try {
                    const url = await onImageUpload(file);
                    handleInsert(`![Alt text](${url})`, 0);
                } catch (err) {
                    console.error("Image upload failed", err);
                    toast.error("Failed to upload image.");
                }
            }
        };
        input.click();
    };

    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 bg-zinc-900 border-b border-zinc-800">
                <div className="flex items-center gap-1">
                    <button onClick={() => handleInsert("# ", 0)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
                    <button onClick={() => handleInsert("## ", 0)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-zinc-700 mx-1" />
                    <button onClick={() => handleInsert("**bold**", -2)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Bold"><Bold className="w-4 h-4" /></button>
                    <button onClick={() => handleInsert("*italic*", -1)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Italic"><Italic className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-zinc-700 mx-1" />
                    <button onClick={() => handleInsert("- ", 0)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Unordered List"><List className="w-4 h-4" /></button>
                    <button onClick={() => handleInsert("1. ", 0)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Ordered List"><ListOrdered className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-zinc-700 mx-1" />
                    <button onClick={() => handleInsert("`code`", -1)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Inline Code"><Code className="w-4 h-4" /></button>
                    <button onClick={() => handleInsert("```python\n\n```", -4)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Code Block"><div className="font-mono text-xs font-bold border rounded px-1">{ }</div></button>
                    <button onClick={() => handleInsert("> ", 0)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Blockquote"><Quote className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-zinc-700 mx-1" />
                    <button onClick={() => handleInsert("[Link Text](url)", -1)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Link"><LinkIcon className="w-4 h-4" /></button>
                    <button onClick={handleImageClick} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Image"><ImageIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleInsert("\n---\n", 0)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Horizontal Rule"><GripHorizontal className="w-4 h-4" /></button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHelp(true)}
                        className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded flex items-center gap-1"
                    >
                        <HelpCircle className="w-4 h-4" />
                        <span className="text-xs">Help</span>
                    </button>
                    <div className="w-px h-4 bg-zinc-700 mx-1" />
                    <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className={`p-1.5 rounded flex items-center gap-1 text-xs font-medium ${previewMode ? "text-violet-400 bg-violet-500/10" : "text-zinc-400 hover:text-white"}`}
                    >
                        {previewMode ? <><Edit3 className="w-3 h-3" /> Edit</> : <><Eye className="w-3 h-3" /> Preview</>}
                    </button>
                </div>
            </div>

            {/* Editor / Preview Area */}
            <div className="flex-1 overflow-auto bg-zinc-950 p-4 min-h-[300px]">
                {previewMode ? (
                    <div className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-violet-400 prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {value}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        className="w-full h-full bg-transparent text-zinc-300 font-mono text-sm focus:outline-none resize-none"
                        placeholder={placeholder || "# Start writing text..."}
                    />
                )}
            </div>

            {/* Footer Actions */}
            {!hideControls && (onSave || onCancel) && (
                <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex justify-end gap-2">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    {onSave && (
                        <button
                            onClick={() => onSave(value)}
                            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-md transition-colors flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Save Changes
                        </button>
                    )}
                </div>
            )}


            {/* Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 sticky top-0">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-violet-500" />
                                Markdown Helper
                            </h3>
                            <button onClick={() => setShowHelp(false)} className="text-zinc-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">

                            {/* Headings */}
                            <section>
                                <h4 className="text-violet-400 font-medium mb-2 border-b border-zinc-800 pb-1">1. Headings</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <pre className="bg-zinc-950 p-2 rounded text-zinc-400">
                                        # Heading 1<br />
                                        ## Heading 2<br />
                                        ### Heading 3
                                    </pre>
                                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                                        <h1 className="text-xl font-bold">Heading 1</h1>
                                        <h2 className="text-lg font-semibold">Heading 2</h2>
                                        <h3 className="text-base font-medium">Heading 3</h3>
                                    </div>
                                </div>
                            </section>

                            {/* Formatting */}
                            <section>
                                <h4 className="text-violet-400 font-medium mb-2 border-b border-zinc-800 pb-1">2. Basic Formatting</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <pre className="bg-zinc-950 p-2 rounded text-zinc-400">
                                        **Bold Text**<br />
                                        *Italic Text*<br />
                                        ~~Strikethrough~~
                                    </pre>
                                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                                        <strong>Bold Text</strong><br />
                                        <em>Italic Text</em><br />
                                        <span className="line-through">Strikethrough</span>
                                    </div>
                                </div>
                            </section>

                            {/* Lists */}
                            <section>
                                <h4 className="text-violet-400 font-medium mb-2 border-b border-zinc-800 pb-1">3. Lists</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <pre className="bg-zinc-950 p-2 rounded text-zinc-400">
                                        - Item 1<br />
                                        - Item 2<br /><br />
                                        1. First thing<br />
                                        2. Second thing
                                    </pre>
                                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800 pl-4">
                                        <ul className="list-disc list-inside">
                                            <li>Item 1</li>
                                            <li>Item 2</li>
                                        </ul>
                                        <ol className="list-decimal list-inside mt-2">
                                            <li>First thing</li>
                                            <li>Second thing</li>
                                        </ol>
                                    </div>
                                </div>
                            </section>

                            {/* Code */}
                            <section>
                                <h4 className="text-violet-400 font-medium mb-2 border-b border-zinc-800 pb-1">4. Code</h4>
                                <div className="space-y-2 text-sm">
                                    <p className="text-zinc-400">Inline: `variable`</p>
                                    <pre className="bg-zinc-950 p-2 rounded text-zinc-400">
                                        ```javascript<br />
                                        console.log("Hello");<br />
                                        ```
                                    </pre>
                                </div>
                            </section>

                            {/* Links & Images */}
                            <section>
                                <h4 className="text-violet-400 font-medium mb-2 border-b border-zinc-800 pb-1">5. Links & Images</h4>
                                <div className="space-y-2 text-sm">
                                    <p className="text-zinc-400">Link: <code className="text-violet-300">[Google](https://google.com)</code></p>
                                    <p className="text-zinc-400">Image: <code className="text-violet-300">![Alt Text](https://image.url)</code></p>
                                    <p className="text-xs text-zinc-500 italic mt-1">* Use the Image button in toolbar to upload automatically.</p>
                                </div>
                            </section>

                            {/* Tables */}
                            <section>
                                <h4 className="text-violet-400 font-medium mb-2 border-b border-zinc-800 pb-1">6. Tables</h4>
                                <pre className="bg-zinc-950 p-2 rounded text-zinc-400 text-xs">
                                    | Column A | Column B |<br />
                                    |----------|----------|<br />
                                    | Value 1  | Value 2  |
                                </pre>
                            </section>

                            {/* Blockquotes */}
                            <section>
                                <h4 className="text-violet-400 font-medium mb-2 border-b border-zinc-800 pb-1">7. Blockquotes</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <pre className="bg-zinc-950 p-2 rounded text-zinc-400">
                                        &gt; Important Note
                                    </pre>
                                    <div className="bg-zinc-950 p-2 rounded border-l-4 border-zinc-600 pl-4 italic text-zinc-400">
                                        Important Note
                                    </div>
                                </div>
                            </section>

                        </div>
                        <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-end">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
