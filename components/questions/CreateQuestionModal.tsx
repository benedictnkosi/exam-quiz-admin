'use client'

import QuestionForm from './QuestionForm'

interface CreateQuestionModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateQuestionModal({ onClose }: CreateQuestionModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Create Question</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <QuestionForm
            mode="create"
          // Remove or comment out onSuccess to prevent modal from closing
          // onSuccess={() => {
          //   onSuccess()
          //   onClose()
          // }}
          />
        </div>
      </div>
    </div>
  )
} 