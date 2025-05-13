import Link from 'next/link';

export default function Page() {
    return (
        <div>
            <Link href="/admin/ai-questions/upload-exam-paper">
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4">
                    Upload Exam Paper PDF
                </button>
            </Link>
        </div>
    );
} 