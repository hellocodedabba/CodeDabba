import { useState, useEffect } from "react";
import { X, Download, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

interface InvoiceModalProps {
    paymentId: string;
    onClose: () => void;
}

export function InvoiceModal({ paymentId, onClose }: InvoiceModalProps) {
    const [htmlContent, setHtmlContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const { data } = await api.get(`/payments/${paymentId}/receipt`);
                if (data.status === 'success') {
                    setHtmlContent(data.html);
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Failed to load invoice");
                onClose();
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [paymentId, onClose]);

    const handleDownloadPdf = () => {
        // Construct the full backend API URL pointing directly to the generated PDF Express stream
        const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const pdfUrl = `${baseApiUrl.replace(/\/+$/, '')}/api/v1/payments/${paymentId}/invoice-pdf`;
        
        // Open in new tab or trigger direct download
        window.open(pdfUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <h2 className="text-xl font-bold text-white">Payment Receipt</h2>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white relative">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
                            <p className="text-zinc-500 font-medium tracking-wide">Retrieving secured invoice...</p>
                        </div>
                    ) : (
                        htmlContent ? (
                            <div 
                                className="invoice-container"
                                dangerouslySetInnerHTML={{ __html: htmlContent }} 
                            />
                        ) : (
                            <p className="text-center text-red-500 py-10">Invoice data unavailable</p>
                        )
                    )}
                </div>

                {/* Footer Bar */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-4">
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
                    >
                        Close
                    </button>
                    <button 
                        onClick={handleDownloadPdf}
                        disabled={loading || !htmlContent}
                        className="px-6 py-3 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Download PDF
                    </button>
                </div>

            </div>
        </div>
    );
}
