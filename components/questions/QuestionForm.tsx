'use client'

import { useState, useEffect } from 'react'
import ImageUpload from './ImageUpload'
import {
  createQuestion,
  getGrades,
  uploadQuestionImage,
  type QuestionPayload,
  type DetailedQuestion
} from '@/services/api'
import { API_BASE_URL, IMAGE_BASE_URL } from '@/config/constants'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AIOptionsGenerator from './AIOptionsGenerator'
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex'
import ImageToLatex from './ImageToLatex'


interface ImageInfo {
  file: File | null
  path?: string  // Only used for context images
  isNew: boolean // Only used for context images
}

interface FormData {
  questionText: string
  examYear: number
  grade: string
  subject: string
  term: string
  context: string
  answer: string
  explanation: string
  options: string[]
  contextImage: ImageInfo | null
  questionImage: File | null
  explanationImage: File | null
  curriculum: string
}

interface QuestionFormProps {
  initialData?: DetailedQuestion
  mode?: 'create' | 'edit'
  onSuccess?: () => void
}

interface Grade {
  id: number
  number: number
  active: number
}

interface Subject {
  id: number
  name: string
  active: boolean
  grade: {
    id: number
    number: number
    active: number
  }
}

interface ApiResponse {
  status: 'OK' | 'NOK'
  message?: string
  question_id?: number
}

// Add the new interfaces for the nested subject structure
interface Paper {
  id: number;
  name: string;
}

// Define nested subject data structure interfaces
interface GradeData {
  grade: number;
  subjects: SubjectCategory[];
}

interface SubjectCategory {
  name: string;
  papers: Paper[];
}

// Helper function to clean the answer string
function cleanAnswer(answer: string): string {
  try {
    // If it's a JSON array, parse first
    let cleanedAnswer = answer;
    if (answer.startsWith('[')) {
      cleanedAnswer = JSON.parse(answer)
        .map((a: string) => a.trim())
        .join(', ');
    }

    // If answer contains pipe character, split into new lines
    if (cleanedAnswer.includes('|')) {
      return cleanedAnswer
        .split('|')
        .map(part => part.trim())
        .join('\n');
    }

    // Return single line answer
    return cleanedAnswer.trim();
  } catch {
    // If parsing fails, return the original answer
    return answer;
  }
}

export default function QuestionForm({ initialData, mode = 'create', onSuccess }: QuestionFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [grades, setGrades] = useState<Grade[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingGrades, setLoadingGrades] = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [lastContextImage, setLastContextImage] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [showLatex, setShowLatex] = useState(false)
  const [showLatexContext, setShowLatexContext] = useState(false)
  const [showLatexAnswer, setShowLatexAnswer] = useState(false)
  const [showLatexExplanation, setShowLatexExplanation] = useState(false)

  const initialFormState = {
    questionText: '',
    examYear: new Date().getFullYear(),
    grade: '',
    subject: '',
    term: '',
    context: '',
    answer: '',
    explanation: '',
    options: ['', '', '', ''],
    contextImage: null,
    questionImage: null,
    explanationImage: null,
    curriculum: 'CAPS'
  }

  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) {
      // Get grade as a string to ensure consistency
      const gradeValue = initialData.subject?.grade?.number?.toString() || '';
      console.log('Initializing form with data:', initialData);
      console.log('Grade from initialData:', gradeValue);

      return {
        questionText: initialData.question || '',
        examYear: initialData.year || new Date().getFullYear(),
        grade: gradeValue,
        subject: initialData.subject?.name || '',
        term: initialData.term?.toString() || '',
        context: initialData.context || '',
        answer: cleanAnswer(initialData.answer || ''),
        explanation: initialData.explanation || '',
        options: [
          initialData.options?.option1 || '',
          initialData.options?.option2 || '',
          initialData.options?.option3 || '',
          initialData.options?.option4 || '',
        ],
        contextImage: initialData.image_path ? {
          file: null,
          path: initialData.image_path,
          isNew: false
        } : null,
        questionImage: null,
        explanationImage: null,
        curriculum: initialData.curriculum || 'CAPS'
      }
    }
    return initialFormState
  })

  useEffect(() => {
    // Log initial data to see the structure
    if (initialData) {
      console.log('Initial data loaded:', initialData);
      console.log('Subject structure:', initialData.subject);
      console.log('Grade structure:', initialData.subject?.grade);
    }

    const fetchGrades = async () => {
      try {
        const gradesData = await getGrades()
        setGrades(gradesData)

        // Log grades for debugging
        console.log('Grades loaded:', gradesData);
        console.log('Current form grade:', formData.grade);

        // If we have initialData but grade is not set, try to set it now
        if (initialData?.subject) {
          // Handle both grade formats - direct number or object with number property
          let gradeValue: string | undefined;

          if (typeof initialData.subject.grade === 'object' && initialData.subject.grade?.number !== undefined) {
            gradeValue = initialData.subject.grade.number.toString();
          } else if (initialData.subject.grade !== undefined) {
            gradeValue = String(initialData.subject.grade);
          }

          if (gradeValue) {
            console.log('Setting grade from initialData:', gradeValue);
            setFormData(prev => ({
              ...prev,
              grade: gradeValue
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch grades:', err)
        setError('Failed to load grades')
      } finally {
        setLoadingGrades(false)
      }
    }

    fetchGrades()
  }, [initialData, initialData?.subject?.grade, formData.grade])

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!formData.grade) {
        setSubjects([])
        return
      }

      console.log(`Fetching subjects for grade ${formData.grade}, current selected subject: ${formData.subject}`);
      setLoadingSubjects(true)

      try {
        const response = await fetch(`${API_BASE_URL}/subjects/active?grade=${formData.grade}`);
        const data = await response.json();

        if (data.status === 'OK' && data.subjects) {
          setSubjects(data.subjects);

          // In edit mode, if we don't have a subject set yet, but have initialData, set it now
          if (mode === 'edit' && !formData.subject && initialData?.subject?.name) {
            console.log('Setting subject to:', initialData.subject.name);
            setFormData(prev => ({
              ...prev,
              subject: initialData.subject.name
            }));
          }
        } else {
          setSubjects([]);
          console.error('Invalid or empty subjects data', data);
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err)
        setError('Failed to load subjects')
        setSubjects([]);
      } finally {
        setLoadingSubjects(false)
      }
    }

    fetchSubjects()
  }, [formData.grade, mode, initialData, formData.subject])

  // Improve the edit mode effect to handle grade selection
  useEffect(() => {
    // Define a function to ensure the grade is set
    const ensureGradeSet = () => {
      // First, check if we're in edit mode and have initialData
      if (mode === 'edit' && initialData?.subject) {
        // Handle both grade formats - direct number or object with number property
        let initialGradeValue: string | undefined;

        if (typeof initialData.subject.grade === 'object' && initialData.subject.grade?.number !== undefined) {
          initialGradeValue = initialData.subject.grade.number.toString();
        } else if (initialData.subject.grade !== undefined) {
          initialGradeValue = String(initialData.subject.grade);
        }

        if (initialGradeValue) {
          console.log('EditMode effect - Initial grade value:', initialGradeValue);
          console.log('EditMode effect - Current form grade:', formData.grade);

          // Make sure the grade is set in the form
          if (!formData.grade || formData.grade !== initialGradeValue) {
            console.log('EditMode effect - Setting grade to:', initialGradeValue);

            // Force a new value, even if it appears the same, to trigger re-rendering
            setFormData(prev => ({
              ...prev,
              grade: initialGradeValue
            }));
          }
        }
      }
    };

    // Call immediately and also after a short delay to ensure it runs after any other state updates
    ensureGradeSet();
    const timer = setTimeout(ensureGradeSet, 300); // Increased timeout for more reliability

    return () => clearTimeout(timer);
  }, [mode, initialData, initialData?.subject, initialData?.subject?.grade, formData.grade]);

  const terms = ['1', '2', '3', '4']

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  useEffect(() => {
    // Update option 4 to match the answer
    const newOptions = [...formData.options];
    newOptions[3] = formData.answer;

    // Only update if option 4 is different from the answer
    if (newOptions[3] !== formData.options[3]) {
      setFormData(prev => ({
        ...prev,
        options: newOptions
      }));
    }
  }, [formData.answer, formData.options]);

  const handleImageChange = (field: 'contextImage' | 'questionImage' | 'explanationImage') =>
    (file: File | null, imagePath?: string) => {
      if (field === 'contextImage') {
        const newContextImage = file ? {
          file,
          path: imagePath || '',
          isNew: !imagePath
        } : null;
        setFormData({
          ...formData,
          [field]: newContextImage
        });
        if (file) {
          setLastContextImage(null); // Clear last used when new file selected
        }
      } else {
        setFormData({
          ...formData,
          [field]: file
        });
      }
    }

  const handleReuseContextImage = () => {
    if (lastContextImage) {
      setFormData(prev => ({
        ...prev,
        contextImage: {
          file: null,
          path: lastContextImage,
          isNew: false
        }
      }));
    }
  }

  const handleResetContextImage = () => {
    setFormData(prev => ({
      ...prev,
      contextImage: null
    }));
    setLastContextImage(null);
  }

  const handleImageUpload = async (file: File, type: 'question_context' | 'question' | 'answer', qId: string) => {
    if (!user?.uid) return null;

    try {
      const response = await uploadQuestionImage(
        file,
        qId,
        type,
        user.uid
      )
      return response.fileName
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) return

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      if (!user?.email) {
        throw new Error('User email not found')
      }

      // Create a copy of the options array
      const options = [...formData.options];

      // Check if options are filled
      if (options.some(option => !option.trim())) {
        throw new Error('All options are required for multiple choice questions')
      }

      // Check if there are duplicate options
      const uniqueOptions = new Set(options.map(opt => opt.trim()));
      if (uniqueOptions.size !== options.length) {
        throw new Error('All options must be unique')
      }

      // Ensure answer is the same as option 4
      if (options[3] !== formData.answer) {
        throw new Error('Option 4 must be the same as the answer')
      }

      const payload: QuestionPayload = {
        question: formData.questionText,
        type: 'multiple_choice',
        subject: formData.subject,
        context: formData.context || '',
        answer: formData.answer,
        options: {
          option1: options[0],
          option2: options[1],
          option3: options[2],
          option4: options[3], // This is now guaranteed to be the same as the answer
        },
        explanation: formData.explanation || '',
        year: formData.examYear,
        term: formData.term,
        capturer: user.email,
        uid: user.uid,
        question_id: mode === 'edit' && initialData ? initialData.id : 0,  // Set proper question_id for updates
        grade: formData.grade,
        curriculum: formData.curriculum
      }

      const response: ApiResponse = await createQuestion(payload)

      if (response.status === 'NOK') {
        throw new Error(response.message || 'Failed to create question')
      }

      const questionId = response.question_id
      if (!questionId) {
        throw new Error('Question ID not received from server')
      }

      // Handle context image - only upload if it's a new file
      if (formData.contextImage?.file && formData.contextImage.isNew) {
        const fileName = await handleImageUpload(formData.contextImage.file, 'question_context', questionId.toString())
        if (fileName) {
          setLastContextImage(fileName);
        }
      } else if (formData.contextImage?.path) {
        // Reuse existing context image
        await fetch(`${API_BASE_URL}/question/set-image-path`, {
          method: 'POST',
          body: JSON.stringify({
            question_id: questionId.toString(),
            image_name: formData.contextImage.path,
            image_type: 'question_context',
            uid: user.uid
          })
        })
      }

      // Handle other images normally...
      if (formData.questionImage) {
        await handleImageUpload(formData.questionImage, 'question', questionId.toString())
      }

      if (formData.explanationImage) {
        await handleImageUpload(formData.explanationImage, 'answer', questionId.toString())
      }

      setSuccess(true)
      // Only reset question-specific fields
      setFormData(prev => ({
        ...prev,
        questionText: '',
        answer: '',
        explanation: '',
        options: ['', '', '', ''],
        questionImage: null,
        explanationImage: null,
      }))
      setResetKey(prev => prev + 1) // Still reset images
      // Call onSuccess if provided (for edit mode)
      if (mode === 'edit') {
        onSuccess?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question')
      console.error('Error creating question:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderLatex = (text: string) => {
    return text.split(/(\$.*?\$)/).map((chunk, index) => {
      if (chunk.startsWith('$') && chunk.endsWith('$')) {
        const latex = chunk.slice(1, -1)
        return <InlineMath key={index} math={latex} />
      }
      return <span key={index}>{chunk}</span>
    })
  }

  const handleConvertImageToText = async () => {
    if (!formData.contextImage?.path) return;

    try {
      const response = await fetch(`${API_BASE_URL}/question/convert-image-to-text?image_name=${formData.contextImage.path}`);
      const data = await response.json();

      if (data.status === 'OK') {
        navigator.clipboard.writeText(data.message);
        alert('Conversion successful! Text copied to clipboard.');
      } else {
        alert('Conversion failed. Please try again.');
      }
    } catch (error) {
      console.error('Error converting image to text:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  const renderMixedContent = (text: string) => {
    // Split the text into lines
    const lines = text.split('\n');

    return (
      <div className="text-gray-700">
        {lines.map((line, index) => {
          // Handle bold text
          const boldProcessedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

          if (line.trim().startsWith('- ')) {
            // If line starts with "- ", render as bullet point
            return (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ marginRight: '0.5rem' }}>•</span>
                <div dangerouslySetInnerHTML={{ __html: boldProcessedLine.substring(2) }} />
              </div>
            );
          } else {
            // Regular line
            return (
              <div
                key={index}
                dangerouslySetInnerHTML={{ __html: boldProcessedLine }}
                style={{ marginBottom: '0.5rem' }}
              />
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="bg-white">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">
              Question Text
            </label>
            <ImageToLatex
              onLatexGenerated={(latex) => {
                console.log(latex);
              }}
            />
            <textarea
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              onBlur={() => {
                const text = formData.questionText
                const dollarCount = (text.match(/\$/g) || []).length
                if (dollarCount >= 2) {
                  setShowLatex(true)
                }
              }}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              required
            />
            {showLatex && formData.questionText && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  {renderLatex(formData.questionText)}
                </p>
              </div>
            )}
            <ImageUpload
              key={`question-image-${resetKey}`}
              onFileSelect={handleImageChange('questionImage')}
              label="Upload Question Image"
              imageName={formData.questionImage ? undefined : undefined}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Exam Year
            </label>
            <input
              type="number"
              value={formData.examYear}
              onChange={(e) => setFormData({ ...formData, examYear: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Grade {formData.grade ? `(Selected: ${formData.grade})` : '(None selected)'}
            </label>
            <select
              value={formData.grade}
              onChange={(e) => {
                console.log('Grade changed to:', e.target.value);
                setFormData({ ...formData, grade: e.target.value });
              }}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loadingGrades}
            >
              <option value="">Select Grade</option>
              {grades.map((grade) => {
                const gradeValue = grade.number.toString();
                const isSelected = gradeValue === formData.grade;
                console.log(`Grade option: ${gradeValue}, selected: ${isSelected}, formData.grade: ${formData.grade}`);
                return (
                  <option
                    key={grade.id}
                    value={gradeValue}
                  >
                    Grade {grade.number}
                  </option>
                );
              })}
            </select>
            {loadingGrades && (
              <p className="text-sm text-gray-500 mt-1">Loading grades...</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Subject
            </label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loadingSubjects || !formData.grade}
            >
              <option value="">Select Subject</option>
              {subjects.length > 0 ? (
                Object.entries(
                  subjects.reduce((acc: { [key: string]: Subject[] }, subject) => {
                    const baseName = subject.name.split(' P')[0];
                    if (!acc[baseName]) {
                      acc[baseName] = [];
                    }
                    acc[baseName].push(subject);
                    return acc;
                  }, {})
                ).map(([baseName, papers]) => (
                  <optgroup key={baseName} label={baseName}>
                    {papers.map(subject => (
                      <option key={subject.id} value={subject.name}>
                        {subject.name}
                      </option>
                    ))}
                  </optgroup>
                ))
              ) : null}
            </select>
            {loadingSubjects && (
              <p className="text-sm text-gray-500 mt-1">Loading subjects...</p>
            )}
            {!formData.grade && (
              <p className="text-sm text-gray-500 mt-1">Select a grade first</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Term
            </label>
            <select
              value={formData.term}
              onChange={(e) => setFormData({ ...formData, term: e.target.value })}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Term</option>
              {terms.map((term) => (
                <option key={term} value={term}>
                  Term {term}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Curriculum
            </label>
            <select
              value={formData.curriculum}
              onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="CAPS">CAPS</option>
              <option value="IEB">IEB</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">
              Question Context
            </label>
            <p className="text-sm text-gray-500">
              **bold** </p>
            <p className="text-sm text-gray-500">
              new line and - for bullet points </p>
            <p className="text-sm text-gray-500">### at the beginning of a line for headings </p>
            <textarea
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              onBlur={() => {
                const text = formData.context
                const dollarCount = (text.match(/\$/g) || []).length
                if (dollarCount >= 2) {
                  setShowLatexContext(true)
                }
              }}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            />
            {showLatexContext && formData.context && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  {renderMixedContent(formData.context)}
                </p>
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <ImageUpload
                key={`context-image-${resetKey}`}
                onFileSelect={handleImageChange('contextImage')}
                label="Upload Context Image (Optional)"
                imageName={formData.contextImage?.path}
                showReuseOption={true}
                lastUsedImage={lastContextImage}
                onReuseImage={handleReuseContextImage}
                onResetImage={handleResetContextImage}
                showResetButton={true}
              />
              {formData.contextImage && !formData.contextImage.isNew && (
                <div className="mt-2">
                  <img src={`${IMAGE_BASE_URL}${formData.contextImage.path}`} alt="Context Preview" className="w-80 h-auto object-cover rounded" />
                  <button
                    type="button"
                    onClick={handleConvertImageToText}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Convert Image to Text
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm text-gray-700">Answer</label>
            </div>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              onBlur={() => {
                const text = formData.answer
                const dollarCount = (text.match(/\$/g) || []).length
                if (dollarCount >= 2) {
                  setShowLatexAnswer(true)
                }
              }}
              className="w-full border border-gray-300 rounded p-2"
              required
              rows={2}
            />
            {showLatexAnswer && formData.answer && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  {renderLatex(formData.answer)}
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm text-gray-700">Answer Options</label>
              <AIOptionsGenerator
                questionText={formData.questionText}
                context={formData.context}
                correctAnswer={formData.answer}
                length={formData.answer.length}
                disabled={!formData.questionText || !formData.answer}
                onOptionsGenerated={(options) => {
                  // Ensure option 4 is the answer
                  const newOptions = [...options];
                  newOptions[3] = formData.answer;
                  setFormData(prev => ({
                    ...prev,
                    options: newOptions
                  }));
                }}
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {formData.options.map((option, index) => (
                <div key={index}>
                  <label className="block text-xs text-gray-500 mb-1">
                    Option {index + 1}
                    {index === 3 && ' (Correct Answer)'}
                  </label>
                  <textarea
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className={`w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${index === 3 ? 'bg-gray-100' : ''}`}
                    required
                    rows={2}
                    disabled={index === 3} // Disable option 4 since it's automatically set to the answer
                  />
                  {option && option.includes('$') && (
                    <div className="mt-1 p-2 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">
                        {renderLatex(option)}
                      </p>
                    </div>
                  )}
                  {index === 3 && (
                    <p className="text-xs text-blue-600 mt-1">
                      This option is automatically set to match your answer
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">
              Answer Explanation (Optional)
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              onBlur={() => {
                const text = formData.explanation
                const dollarCount = (text.match(/\$/g) || []).length
                if (dollarCount >= 2) {
                  setShowLatexExplanation(true)
                }
              }}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            />
            {showLatexExplanation && formData.explanation && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  {renderMixedContent(formData.explanation)}
                </p>
              </div>
            )}
            <ImageUpload
              key={`explanation-image-${resetKey}`}
              onFileSelect={handleImageChange('explanationImage')}
              label="Upload Explanation Image (Optional)"
              imageName={formData.explanationImage ? undefined : undefined}
            />
          </div>
        </div>

        {
          error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )
        }

        {
          success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded space-y-1">
              <p>Question {mode === 'edit' ? 'updated' : 'created'} successfully!</p>
              {formData.contextImage?.path && !formData.contextImage.isNew && (
                <p className="text-sm">
                  Used existing image: <span className="font-medium">{formData.contextImage.path}</span>
                </p>
              )}
            </div>
          )
        }

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : mode === 'edit' ? 'Update Question' : 'Create Question'}
          </button>
        </div>
      </form >
    </div >
  )
} 