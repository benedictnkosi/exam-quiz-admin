"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, API_HOST } from '@/config/constants';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
const terms = ["1", "2", "3", "4"];

export default function UploadExamPaperPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    // Shared fields
    const [subjectName, setSubjectName] = useState("");
    const [grade, setGrade] = useState("");
    const [year, setYear] = useState(years[0].toString());
    const [term, setTerm] = useState(terms[0]);
    const [grades, setGrades] = useState<{ id: number; number: number }[]>([]);
    const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    // Step 1 fields
    const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
    // Step 2 fields
    const [memoFile, setMemoFile] = useState<File | null>(null);
    const [examPaperId, setExamPaperId] = useState("");
    // Step 3 fields
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [questionNumber, setQuestionNumber] = useState("");
    const [uploadedImages, setUploadedImages] = useState<{ name: string; questionNumber: string; url?: string }[]>([]);
    const [imageUploadSuccess, setImageUploadSuccess] = useState(false);
    const [questionNumberError, setQuestionNumberError] = useState("");
    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [removingImage, setRemovingImage] = useState<string | null>(null);
    const [removeSuccess, setRemoveSuccess] = useState("");
    const [examPapers, setExamPapers] = useState<any[]>([]);
    const [loadingPapers, setLoadingPapers] = useState(false);

    // Load grades on mount
    useEffect(() => {
        async function fetchGrades() {
            setGrades([
                { id: 10, number: 10 },
                { id: 11, number: 11 },
                { id: 12, number: 12 },
            ]);
        }
        fetchGrades();
    }, []);

    // Load subjects when grade changes
    useEffect(() => {
        if (!grade) {
            setSubjects([]);
            setSubjectName("");
            return;
        }
        setLoadingSubjects(true);
        setSubjectName("");
        fetch(`${API_BASE_URL}/subjects/active?grade=${grade}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === "OK" && data.subjects) {
                    // Filter out subjects containing specified terms
                    const filteredSubjects = data.subjects.filter((subject: { name: string }) => {
                        const subjectName = subject.name.toLowerCase();
                        return !subjectName.includes("physical sciences") &&
                            !subjectName.includes("mathematics") &&
                            !subjectName.includes("accounting");
                    });
                    setSubjects(filteredSubjects);
                } else {
                    setSubjects([]);
                }
            })
            .catch(() => setSubjects([]))
            .finally(() => setLoadingSubjects(false));
    }, [grade]);

    // Load exam papers on mount
    useEffect(() => {
        async function fetchExamPapers() {
            setLoadingPapers(true);
            try {
                const res = await fetch(`${API_HOST}/api/exam-papers`);
                if (!res.ok) throw new Error("Failed to fetch exam papers");
                const data = await res.json();
                setExamPapers(data.examPapers || []);
            } catch (err) {
                console.error("Error fetching exam papers:", err);
            } finally {
                setLoadingPapers(false);
            }
        }
        fetchExamPapers();
    }, []);

    // Regex for allowed question number formats
    const questionNumberRegex = /^\d+(\.\d+)*(\s*\([a-zA-Z]\))?$/;

    // Step 1: Upload Question Paper
    const handleQuestionPaperSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setLoading(true);
        try {
            if (!questionPaperFile) throw new Error("Please select a PDF file.");
            if (!subjectName || !grade || !year || !term) throw new Error("All fields are required.");
            if (!user?.uid) throw new Error("User not authenticated");
            const formData = new FormData();
            formData.append("file", questionPaperFile);
            formData.append("type", "paper");
            formData.append("subjectName", subjectName);
            formData.append("grade", grade);
            formData.append("year", year);
            formData.append("term", term);
            formData.append("userUid", user.uid);
            const res = await fetch(`${API_HOST}/api/exam-papers/upload`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            if (data.examPaper && data.examPaper.id) {
                setExamPaperId(data.examPaper.id.toString());
                localStorage.setItem('uploadedExamPaperId', data.examPaper.id.toString());
                setStep(2);
            } else {
                throw new Error("No exam paper ID returned");
            }
        } catch (err: any) {
            setError(err.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Upload Memo
    const handleMemoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setLoading(true);
        try {
            if (!memoFile) throw new Error("Please select a PDF file.");
            if (!examPaperId) throw new Error("Exam Paper ID is required.");
            const formData = new FormData();
            formData.append("file", memoFile);
            formData.append("type", "memo");
            formData.append("subjectName", subjectName);
            formData.append("grade", grade);
            formData.append("year", year);
            formData.append("term", term);
            formData.append("examPaperId", examPaperId);
            formData.append("userUid", user?.uid || "");
            const res = await fetch(`${API_HOST}/api/exam-papers/upload`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            if (data.examPaper && data.examPaper.id) {
                localStorage.setItem('uploadedExamPaperId', data.examPaper.id.toString());
            }
            setSuccess(true);
            setMemoFile(null);
            setStep(3);
        } catch (err: any) {
            setError(err.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Upload Images
    const handleImageUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setImageUploadSuccess(false);
        setQuestionNumberError("");
        setLoading(true);
        try {
            if (!imageFile) throw new Error("Please select an image file.");
            if (!questionNumber) throw new Error("Please enter a question number.");
            if (!questionNumberRegex.test(questionNumber.trim())) {
                setQuestionNumberError("Invalid format. Examples: 2.1, 2.1.1, 2.1 (a), 2.1.1 (b)");
                setLoading(false);
                return;
            }
            if (!examPaperId) throw new Error("Exam Paper ID is missing.");
            const formData = new FormData();
            formData.append("image", imageFile);
            formData.append("questionNumber", questionNumber);
            const res = await fetch(`${API_HOST}/api/exam-papers/${examPaperId}/upload-images`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("Image upload failed");
            // Create a local preview URL for the image
            const localUrl = URL.createObjectURL(imageFile);
            setUploadedImages(prev => [
                ...prev,
                { name: imageFile.name, questionNumber, url: localUrl }
            ]);
            setImageUploadSuccess(true);
            setImageFile(null);
            setQuestionNumber("");
        } catch (err: any) {
            setError(err.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    // Remove image handler
    const handleRemoveImage = async (questionNumber: string) => {
        if (!examPaperId) return;
        setRemovingImage(questionNumber);
        setRemoveSuccess("");
        setError("");
        try {
            const res = await fetch(`${API_HOST}/api/exam-papers/${examPaperId}/remove-images?questionNumber=${encodeURIComponent(questionNumber)}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to remove image");
            setUploadedImages(prev => prev.filter(img => img.questionNumber !== questionNumber));
            setRemoveSuccess("Image removed successfully");
        } catch (err: any) {
            setError(err.message || "Unknown error");
        } finally {
            setRemovingImage(null);
        }
    };

    // Handle paste event
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    setImageFile(file);
                }
            }
        }
    };

    // Get status badge color
    const getStatusColor = (status: string) => {
        switch (status) {
            case "done":
                return "bg-green-100 text-green-800";
            case "in_progress":
                return "bg-blue-100 text-blue-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 flex flex-col items-center justify-start py-10 px-2">
                <div className="w-full max-w-6xl">
                    <h1 className="text-3xl font-bold mb-2 text-gray-800 flex items-center gap-2">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Upload Exam Paper
                    </h1>
                    <p className="text-gray-500 mb-6">Easily upload question papers, memos, and images for each question. Follow the steps below to complete your upload.</p>

                    {/* Exam Papers List */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                        <h2 className="text-xl font-semibold mb-4">Uploaded Exam Papers</h2>
                        {loadingPapers ? (
                            <div className="flex items-center justify-center py-8">
                                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            </div>
                        ) : examPapers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No exam papers uploaded yet</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {examPapers.map((paper) => {
                                            interface QuestionProgress {
                                                status: string;
                                                updated_at: string;
                                            }

                                            const progress = (paper.question_progress || {}) as Record<string, QuestionProgress>;
                                            const doneCount = Object.values(progress).filter(q => q.status === "Done").length;
                                            const failedCount = Object.values(progress).filter(q => q.status === "Failed").length;
                                            const totalCount = Object.keys(progress).length;

                                            return (
                                                <tr key={paper.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{paper.subject_name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paper.grade}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paper.year}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paper.term}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex flex-col">
                                                            <span className="text-green-600">Done: {doneCount}</span>
                                                            <span className="text-red-600">Failed: {failedCount}</span>
                                                            <span className="text-gray-600">Total: {totalCount}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(paper.status)}`}>
                                                            {paper.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {paper.created ? new Date(paper.created).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <div className="flex items-center justify-between mb-8">
                            {[1, 2, 3].map((s, idx) => (
                                <div key={s} className="flex-1 flex items-center">
                                    <div className={`flex items-center justify-center rounded-full w-10 h-10 text-lg font-bold border-2 transition-all duration-200
                                        ${step === s ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : step > s ? 'bg-green-500 text-white border-green-500' : 'bg-gray-200 text-gray-400 border-gray-200'}`}
                                    >
                                        {step > s ? (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        ) : s}
                                    </div>
                                    {idx < 2 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mb-8 text-sm font-medium">
                            <span className={step === 1 ? 'text-blue-600' : 'text-gray-400'}>Question Paper</span>
                            <span className={step === 2 ? 'text-blue-600' : 'text-gray-400'}>Memo</span>
                            <span className={step === 3 ? 'text-blue-600' : 'text-gray-400'}>Images</span>
                        </div>
                        {/* Step 1 */}
                        {step === 1 && (
                            <form onSubmit={handleQuestionPaperSubmit} className="space-y-6">
                                <div>
                                    <label className="block mb-2 font-medium text-gray-700">PDF File (Question Paper)</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={e => setQuestionPaperFile(e.target.files?.[0] || null)}
                                            required
                                            className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        />
                                        {questionPaperFile && (
                                            <span className="text-green-600 flex items-center gap-1 text-xs font-semibold">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                {questionPaperFile.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Grade</label>
                                        <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required>
                                            <option value="">Select Grade</option>
                                            {grades.map(g => (
                                                <option key={g.id} value={g.number}>{g.number}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Subject Name</label>
                                        <select
                                            value={subjectName}
                                            onChange={e => setSubjectName(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            required
                                            disabled={!grade || loadingSubjects}
                                        >
                                            <option value="">{loadingSubjects ? "Loading..." : "Select Subject"}</option>
                                            {subjects.map(s => (
                                                <option key={s.id} value={s.name}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Year</label>
                                        <select value={year} onChange={e => setYear(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required>
                                            {years.map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Term</label>
                                        <select value={term} onChange={e => setTerm(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required>
                                            {terms.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {error && <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>{error}</div>}
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 font-semibold flex items-center justify-center gap-2 transition"
                                    disabled={loading}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16m8-8H4" /></svg>
                                    {loading ? "Uploading..." : "Upload Question Paper"}
                                </button>
                            </form>
                        )}
                        {/* Step 2 */}
                        {step === 2 && (
                            <form onSubmit={handleMemoSubmit} className="space-y-6">
                                <div>
                                    <label className="block mb-2 font-medium text-gray-700">PDF File (Memo)</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={e => setMemoFile(e.target.files?.[0] || null)}
                                            required
                                            className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        />
                                        {memoFile && (
                                            <span className="text-green-600 flex items-center gap-1 text-xs font-semibold">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                {memoFile.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Exam Paper ID</label>
                                        <input
                                            type="text"
                                            value={examPaperId}
                                            readOnly
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Grade</label>
                                        <input type="text" value={grade} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Subject Name</label>
                                        <input type="text" value={subjectName} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Year</label>
                                        <input type="text" value={year} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Term</label>
                                        <input type="text" value={term} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed" />
                                    </div>
                                </div>
                                {error && <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>{error}</div>}
                                {success && <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Memo uploaded successfully!</div>}
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 font-semibold flex items-center justify-center gap-2 transition"
                                    disabled={loading}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16m8-8H4" /></svg>
                                    {loading ? "Uploading..." : "Upload Memo"}
                                </button>
                            </form>
                        )}
                        {/* Step 3 */}
                        {step === 3 && (
                            <div>
                                <form onSubmit={handleImageUpload} className="space-y-6">
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Image File</label>
                                        <div
                                            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            onPaste={handlePaste}
                                            tabIndex={0}
                                        >
                                            {imageFile ? (
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                    <span className="text-sm font-medium">{imageFile.name}</span>
                                                </div>
                                            ) : (
                                                <div className="text-center text-gray-500">
                                                    <p className="text-sm font-medium">Click to focus and paste image (Ctrl/Cmd + V)</p>
                                                    <p className="text-xs mt-1">or drag and drop an image here</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Question Number</label>
                                        <input
                                            type="text"
                                            value={questionNumber}
                                            onChange={e => {
                                                setQuestionNumber(e.target.value);
                                                setQuestionNumberError("");
                                            }}
                                            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${questionNumberError ? 'border-red-500' : ''}`}
                                            required
                                            placeholder="e.g. 2.1, 2.1.1, 2.1 (a), 2.1.1 (b)"
                                        />
                                        {questionNumberError && <div className="text-red-600 text-sm mt-1">{questionNumberError}</div>}
                                    </div>
                                    {error && <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>{error}</div>}
                                    {imageUploadSuccess && <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Image uploaded successfully!</div>}
                                    <button
                                        type="submit"
                                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 font-semibold flex items-center justify-center gap-2 transition"
                                        disabled={loading}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16m8-8H4" /></svg>
                                        {loading ? "Uploading..." : "Upload Image"}
                                    </button>
                                </form>
                                <div className="mt-6">
                                    <button
                                        onClick={async () => {
                                            if (!examPaperId) return;
                                            setLoading(true);
                                            setError("");
                                            try {
                                                const res = await fetch(`${API_HOST}/api/exam-papers/${examPaperId}/status`, {
                                                    method: "PUT",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                    },
                                                    body: JSON.stringify({ status: "pending" }),
                                                });
                                                if (!res.ok) throw new Error("Failed to update status");
                                                const data = await res.json();
                                                if (data.message === "Status updated successfully") {
                                                    setSuccess(true);
                                                    // Show success message for 2 seconds before redirecting
                                                    setTimeout(() => {
                                                        router.push("/admin/ai-questions/upload-exam-paper");
                                                    }, 2000);
                                                } else {
                                                    throw new Error("Unexpected response format");
                                                }
                                            } catch (err: any) {
                                                setError(err.message || "Failed to update status");
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 font-semibold flex items-center justify-center gap-2 transition"
                                        disabled={loading}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        {loading ? "Updating..." : "Done"}
                                    </button>
                                </div>
                                {success && (
                                    <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Status updated successfully! Redirecting...
                                    </div>
                                )}
                                {uploadedImages.length > 0 && (
                                    <div className="mt-8">
                                        <h2 className="text-lg font-semibold mb-4">Uploaded Images This Session</h2>
                                        {removeSuccess && <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm mb-4"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>{removeSuccess}</div>}
                                        <div className="grid grid-cols-2 gap-6">
                                            {uploadedImages.map((img, idx) => (
                                                <div key={idx} className="flex flex-col items-center bg-gray-50 rounded-xl shadow p-3 hover:shadow-lg transition group cursor-pointer">
                                                    <div className="w-28 h-28 bg-white border rounded-lg flex items-center justify-center overflow-hidden mb-2 group-hover:scale-105 group-hover:shadow-xl transition-transform">
                                                        {img.url && (
                                                            <img src={img.url} alt={img.name} className="object-contain w-full h-full rounded-lg" />
                                                        )}
                                                    </div>
                                                    <div className="font-mono text-xs text-gray-700 truncate w-full text-center">{img.name}</div>
                                                    <div className="text-xs text-blue-600 font-semibold mt-1">Question {img.questionNumber}</div>
                                                    <button
                                                        onClick={() => handleRemoveImage(img.questionNumber)}
                                                        disabled={removingImage === img.questionNumber}
                                                        className={`mt-2 px-3 py-1 text-xs rounded-lg border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 flex items-center gap-1 transition ${removingImage === img.questionNumber ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {removingImage === img.questionNumber ? (
                                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                                        ) : (
                                                            <>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                Remove
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
} 