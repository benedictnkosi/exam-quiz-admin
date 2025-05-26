'use client'

import { useState, useEffect } from 'react'
import ImageUpload from './ImageUpload'
import {
  createQuestion,
  getGrades,
  uploadQuestionImage,
  setQuestionImagePath,
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
  subjectId: number
  term: string
  context: string
  answer: string
  explanation: string
  options: string[]
  contextImage: ImageInfo | null
  otherContextImages: ImageInfo[]
  questionImage: ImageInfo | null
  explanationImage: File | null
  curriculum: string
  question_number?: string | null
  answerSheet: {
    rows: Array<{
      column1: string
      column2: string
      column3: string
      column4: string
    }>
  }
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

// Add type guard
function isOptionsObject(options: string[] | { option1: string; option2: string; option3: string; option4: string; }):
  options is { option1: string; option2: string; option3: string; option4: string; } {
  return !Array.isArray(options) && 'option1' in options;
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
  const [isConverting, setIsConverting] = useState(false)
  const [showAnswerSheet, setShowAnswerSheet] = useState(false)
  const [jsonOutput, setJsonOutput] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})

  const initialFormState = {
    questionText: '',
    examYear: new Date().getFullYear(),
    grade: '',
    subject: '',
    subjectId: 0,
    term: '',
    context: '',
    answer: '',
    explanation: '',
    options: ['', '', '', ''],
    contextImage: null,
    otherContextImages: [],
    questionImage: null,
    explanationImage: null,
    curriculum: 'CAPS',
    question_number: null,
    answerSheet: {
      rows: []
    }
  }

  // Update the initialization code
  const initialOptionsRaw = initialData?.options ?
    (isOptionsObject(initialData.options) ? [
      initialData.options.option1 || '',
      initialData.options.option2 || '',
      initialData.options.option3 || '',
      initialData.options.option4 || '',
    ] : initialData.options) : ['', '', '', ''];
  // Always ensure 4 options (pad with empty strings if needed)
  const initialOptions = [
    ...(initialOptionsRaw || []),
    '', '', '', ''
  ].slice(0, 4);

  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) {
      // Get grade as a string to ensure consistency
      const gradeValue = initialData.subject?.grade?.number?.toString() || '';
      console.log('Initializing form with data:', initialData);
      console.log('Grade from initialData:', gradeValue);

      // Initialize answer sheet if it exists
      let answerSheetRows: Array<{
        column1: string;
        column2: string;
        column3: string;
        column4: string;
      }> = [];

      if (initialData.answer_sheet) {
        try {
          const parsedSheet = JSON.parse(initialData.answer_sheet);
          answerSheetRows = parsedSheet.map((row: any) => ({
            column1: row.A,
            column2: typeof row.B === 'string' ? row.B : row.B.correct,
            column3: typeof row.B === 'string' ? '' : row.B.options?.join(', ') || '',
            column4: typeof row.B === 'string' ? '' : row.B.explanation || ''
          }));
          setShowAnswerSheet(true);
        } catch (error) {
          console.error('Error parsing answer sheet:', error);
        }
      }

      return {
        questionText: initialData.question || '',
        examYear: initialData.year || new Date().getFullYear(),
        grade: gradeValue,
        subject: initialData.subject?.name || '',
        subjectId: initialData.subject?.id || 0,
        term: initialData.term?.toString() || '',
        context: initialData.context || '',
        answer: initialData.answer || '',
        explanation: initialData.explanation || '',
        options: initialOptions,
        contextImage: initialData.image_path ? {
          file: null,
          path: initialData.image_path,
          isNew: false
        } : null,
        otherContextImages: initialData.other_context_images ? initialData.other_context_images.map(path => ({
          file: null,
          path: path,
          isNew: false
        })) : [],
        questionImage: initialData.question_image_path ? {
          file: null,
          path: initialData.question_image_path,
          isNew: false
        } : null,
        explanationImage: null,
        curriculum: initialData.curriculum || 'CAPS',
        question_number: initialData.question_number || null,
        answerSheet: {
          rows: answerSheetRows
        }
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
      if (field === 'contextImage' || field === 'questionImage') {
        const newImage = file ? {
          file,
          path: imagePath || '',
          isNew: !imagePath
        } : null;
        setFormData({
          ...formData,
          [field]: newImage
        });
        if (field === 'contextImage' && file) {
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

  const handleResetQuestionImage = () => {
    setFormData(prev => ({
      ...prev,
      questionImage: null
    }));
  }

  const handleImageUpload = async (file: File, type: 'question_context' | 'question' | 'answer' | 'other_context', qId: string) => {
    if (!user?.uid) return null;

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('question_id', qId);
      formData.append('image_type', type);
      formData.append('uid', user.uid);

      const response = await fetch(`${API_BASE_URL}/learner/upload-image`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.status === 'NOK') {
        throw new Error(result.message || 'Failed to upload image');
      }

      return result.fileName;
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error);
      return null;
    }
  }

  const handleAddContextImage = (file: File | null, imagePath?: string) => {
    if (file) {
      const newImage = {
        file,
        path: imagePath || '',
        isNew: !imagePath
      };
      setFormData(prev => ({
        ...prev,
        otherContextImages: [...prev.otherContextImages, newImage]
      }));
    }
  };

  const handleRemoveContextImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      otherContextImages: prev.otherContextImages.filter((_, i) => i !== index)
    }));
  };

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

      // Check for image-related words in question text and context
      const imageRelatedWords = [
        'diagram',
        'illustration',
        'image',
        'picture',
        'pictures',
        'scenario',
        'extract',
        'graph',
        'annexure',
        'information below',
        'map'
      ]

      const questionText = formData.questionText.toLowerCase()
      const contextText = formData.context.toLowerCase()

      const hasImageRelatedWords = imageRelatedWords.some(word =>
        questionText.includes(word) || contextText.includes(word)
      )

      if (hasImageRelatedWords && !formData.contextImage && !formData.questionImage) {
        const shouldProceed = window.confirm(
          'The question or context contains words that suggest an image might be needed. ' +
          'Are you sure you want to proceed without uploading an image?'
        )

        if (!shouldProceed) {
          setLoading(false)
          return
        }
      }

      // Create a copy of the options array
      const options = [...formData.options];

      // Only validate options and answer if there's no answer sheet table
      if (!showAnswerSheet || formData.answerSheet.rows.length === 0) {
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
      }

      // Prepare answer sheet JSON if table exists
      let answerSheetJson: Array<{
        A: string | { value: string }
        B: string | {
          value: string
          isEditable: boolean
          correct: string
          options: string[]
          explanation?: string
        }
      }> | undefined;

      if (showAnswerSheet && formData.answerSheet.rows.length > 0) {
        answerSheetJson = formData.answerSheet.rows.map(row => {
          const item: any = {
            A: row.column1,
            B: {
              value: "",
              isEditable: true,
              correct: row.column2,
              options: row.column3
                ? [...row.column3.split(',').map(opt => opt.trim()), row.column2]
                : [],
              explanation: row.column4 || undefined
            }
          };

          // If no options, make it a simple value
          if (!row.column3) {
            item.B = row.column2;
          }

          return item;
        });
      }

      const payload: QuestionPayload = {
        question: formData.questionText,
        type: 'multiple_choice',
        subject: formData.subject,
        subject_id: formData.subjectId,
        context: formData.context || '',
        answer: formData.answer,
        options: {
          option1: options[0],
          option2: options[1],
          option3: options[2],
          option4: options[3],
        },
        explanation: formData.explanation || '',
        year: formData.examYear,
        term: formData.term,
        capturer: user.email,
        uid: user.uid,
        question_id: mode === 'edit' && initialData ? initialData.id : 0,
        grade: formData.grade,
        curriculum: formData.curriculum,
        answer_sheet: answerSheetJson
      }

      const response: ApiResponse = await createQuestion(payload)

      if (response.status === 'NOK') {
        throw new Error(response.message || 'Failed to create question')
      }

      const questionId = response.question_id
      if (!questionId) {
        throw new Error('Question ID not received from server')
      }

      // Handle main context image
      if (formData.contextImage?.file && formData.contextImage.isNew) {
        const fileName = await handleImageUpload(formData.contextImage.file, 'question_context', questionId.toString())
        if (fileName) {
          setLastContextImage(fileName);
          setFormData(prev => ({
            ...prev,
            contextImage: {
              ...prev.contextImage!,
              path: fileName,
              isNew: false
            }
          }));
        }
      } else if (formData.contextImage?.path) {
        await setQuestionImagePath({
          question_id: questionId.toString(),
          image_name: formData.contextImage.path,
          image_type: 'question_context',
          uid: user.uid
        });
      }

      // Handle additional context images
      const otherContextImagePaths: string[] = [];

      for (const image of formData.otherContextImages) {
        if (image.file && image.isNew) {
          const fileName = await handleImageUpload(image.file, 'other_context', questionId.toString());
          if (fileName) {
            otherContextImagePaths.push(fileName);
          }
        } else if (image.path) {
          otherContextImagePaths.push(image.path);
        }
      }

      // Update the question with additional context images
      if (otherContextImagePaths.length > 0) {
        const response = await fetch(`${API_BASE_URL}/question/set-other-context-images`, {
          method: 'POST',
          body: JSON.stringify({
            question_id: questionId.toString(),
            other_context_images: otherContextImagePaths,
            uid: user.uid
          })
        });
      }

      // Handle question image - only upload if it's a new file
      if (formData.questionImage?.file && formData.questionImage.isNew) {
        const fileName = await handleImageUpload(formData.questionImage.file, 'question', questionId.toString())
        if (fileName) {
          setFormData(prev => ({
            ...prev,
            questionImage: {
              ...prev.questionImage!,
              path: fileName,
              isNew: false
            }
          }));
        }
      } else if (formData.questionImage?.path) {
        // Reuse existing question image
        await setQuestionImagePath({
          question_id: questionId.toString(),
          image_name: formData.questionImage.path,
          image_type: 'question',
          uid: user.uid
        });
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
    // Handle LaTeX content first
    if (text.startsWith('$') && text.endsWith('$')) {
      const latex = text.slice(1, -1);
      return <InlineMath math={latex} />;
    }

    // Split by LaTeX delimiters and preserve them
    const parts = text.split(/(\$[^$]+\$)/g);

    return parts.map((chunk, index) => {
      if (chunk.startsWith('$') && chunk.endsWith('$')) {
        const latex = chunk.slice(1, -1).trim();
        return <InlineMath key={index} math={latex} />;
      }
      return <span key={index}>{chunk}</span>;
    });
  }

  const handleConvertImageToText = async () => {
    if (!formData.contextImage?.path) return;

    try {
      setIsConverting(true);
      const response = await fetch(`${API_BASE_URL}/question/convert-image-to-text?image_name=${formData.contextImage.path}`);
      const data = await response.json();

      if (data.status === 'OK') {
        navigator.clipboard.writeText(data.message);
      } else {
        alert('Conversion failed. Please try again.');
      }
    } catch (error) {
      console.error('Error converting image to text:', error);
      alert('An error occurred. Please try again later.');
    } finally {
      setIsConverting(false);
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

  const handleAddTable = () => {
    setFormData(prev => ({
      ...prev,
      answerSheet: {
        rows: [
          { column1: '', column2: '', column3: '', column4: '' },
          { column1: '', column2: '', column3: '', column4: '' }
        ]
      }
    }));
    setShowAnswerSheet(true);
  };

  const handleRemoveTable = () => {
    setFormData(prev => ({
      ...prev,
      answerSheet: {
        rows: []
      }
    }));
    setShowAnswerSheet(false);
    setJsonOutput('');
  };

  const handleAddRow = () => {
    setFormData(prev => ({
      ...prev,
      answerSheet: {
        rows: [...prev.answerSheet.rows, { column1: '', column2: '', column3: '', column4: '' }]
      }
    }));
  };

  const validateNumber = (value: string): boolean => {
    // Remove spaces from the input
    const trimmedValue = value.replace(/\s/g, '');
    // Allow empty string, negative numbers, and positive numbers
    if (trimmedValue === '') return true;
    // Check if it's a valid number (including negative numbers)
    return /^-?\d*\.?\d*$/.test(trimmedValue);
  };

  const generateRandomOptions = (baseValue: string): string[] => {
    const num = parseFloat(baseValue);
    if (isNaN(num)) return [];

    // Determine the rounding factor based on the magnitude of the number
    const absNum = Math.abs(num);
    let roundingFactor = 50;

    if (absNum >= 1000) {
      roundingFactor = 100;
    } else if (absNum >= 100) {
      roundingFactor = 50;
    } else if (absNum >= 10) {
      roundingFactor = 10;
    } else {
      roundingFactor = 5;
    }

    // Generate 3 random numbers within ±20% of the base value
    const options = new Set<string>();
    while (options.size < 3) {
      const variation = (Math.random() * 0.4 - 0.2) * num; // ±20% variation
      const newValue = num + variation;

      // Round to the nearest rounding factor
      const roundedValue = Math.round(newValue / roundingFactor) * roundingFactor;

      // Format the number to match the original's decimal places
      const decimalPlaces = (baseValue.split('.')[1] || '').length;
      const formattedValue = roundedValue.toFixed(decimalPlaces);

      // Only add if it's different from the original value
      if (formattedValue !== baseValue) {
        options.add(formattedValue);
      }
    }

    return Array.from(options);
  };

  const handleGenerateOptions = () => {
    const newRows = formData.answerSheet.rows.map(row => {
      // Only generate options if there's a value in column2
      if (row.column2 && row.column2.trim() !== '') {
        const options = generateRandomOptions(row.column2);
        return {
          ...row,
          column3: options.join(', ')
        };
      }
      // Return row unchanged if column2 is empty
      return row;
    });

    setFormData(prev => ({
      ...prev,
      answerSheet: {
        rows: newRows
      }
    }));
  };

  const areAllColumnBValuesFilled = () => {
    return true; // Always return true to enable the button
  };

  const handleTableInputChange = (rowIndex: number, column: 'column1' | 'column2' | 'column3' | 'column4', value: string) => {
    // Special validation for column2 (Amount)
    if (column === 'column2') {
      // Remove spaces from the value before validation and storage
      const trimmedValue = value.replace(/\s/g, '');
      // Allow empty string or validate number
      if (trimmedValue !== '' && !validateNumber(trimmedValue)) {
        setValidationErrors(prev => ({
          ...prev,
          [`row-${rowIndex}-column2`]: 'Please enter a valid number'
        }));
        return;
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`row-${rowIndex}-column2`];
          return newErrors;
        });
      }

      // Update form data with the trimmed value
      setFormData(prev => {
        const newRows = [...prev.answerSheet.rows];
        newRows[rowIndex] = { ...newRows[rowIndex], [column]: trimmedValue };
        return {
          ...prev,
          answerSheet: {
            rows: newRows
          }
        };
      });
      return;
    }

    // For other columns, update normally
    setFormData(prev => {
      const newRows = [...prev.answerSheet.rows];
      newRows[rowIndex] = { ...newRows[rowIndex], [column]: value };
      return {
        ...prev,
        answerSheet: {
          rows: newRows
        }
      };
    });
  };

  const convertToJson = () => {
    // Check for validation errors before generating JSON
    const hasErrors = Object.keys(validationErrors).length > 0;
    if (hasErrors) {
      alert('Please fix the validation errors before generating JSON');
      return;
    }

    const jsonData = formData.answerSheet.rows.map(row => {
      const item: any = {
        A: row.column1 || { value: "" },
        B: row.column2 || { value: "" }
      };

      // If column C (options) is populated, modify the B field
      if (row.column3) {
        const options = row.column3.split(',').map(opt => opt.trim());
        item.B = {
          value: "",
          isEditable: true,
          correct: row.column2,
          options: options,
          explanation: row.column4 || undefined
        };
      }

      return item;
    });

    const jsonString = JSON.stringify(jsonData, null, 2);
    setJsonOutput(jsonString);

    // Copy to clipboard
    navigator.clipboard.writeText(jsonString).then(() => {
      alert('JSON copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy JSON:', err);
    });
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
              imageName={formData.questionImage?.path}
              showResetButton={true}
              onResetImage={handleResetQuestionImage}
            />
            {formData.questionImage && !formData.questionImage.isNew && (
              <div className="mt-2">
                <img
                  src={`${IMAGE_BASE_URL}${formData.questionImage.path}`}
                  alt="Question Preview"
                  className="w-80 h-auto object-cover rounded"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Question Number (Optional)
            </label>
            <input
              type="text"
              value={formData.question_number || ''}
              onChange={(e) => setFormData({ ...formData, question_number: e.target.value || null })}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter question number (e.g. 1.5.1)"
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
              onChange={(e) => {
                const selectedSubject = subjects.find(s => s.name === e.target.value);
                setFormData(prev => ({
                  ...prev,
                  subject: e.target.value,
                  subjectId: selectedSubject?.id || 0
                }));
              }}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loadingSubjects || !formData.grade}
            >
              <option value="">Select Subject</option>
              {subjects.length > 0 ? (
                Object.entries(
                  subjects.reduce((acc: { [key: string]: Subject[] }, subject) => {
                    // Remove the filter that excludes subjects
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
            <p className="text-sm text-gray-500">*** at the beginning of a line for new paragraph </p>
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
                  {renderLatex(formData.context)}
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
                  <img
                    src={`${IMAGE_BASE_URL}${formData.contextImage.path}`}
                    alt="Context Preview"
                    className="w-80 h-auto object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={handleConvertImageToText}
                    disabled={isConverting}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
                  >
                    {isConverting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Converting...
                      </>
                    ) : (
                      'Convert Image to Text'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Additional Context Images Section */}
            <div className="mt-4">
              <label className="block text-sm text-gray-700 mb-2">
                Additional Context Images (Max 10)
              </label>
              {formData.otherContextImages.length < 10 && (
                <ImageUpload
                  key={`additional-context-image-${resetKey}`}
                  onFileSelect={handleAddContextImage}
                  label="Add Another Context Image"
                  showResetButton={false}
                />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {formData.otherContextImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.file ? URL.createObjectURL(image.file) : `${IMAGE_BASE_URL}${image.path}`}
                      alt={`Additional Context ${index + 1}`}
                      className="w-full h-48 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveContextImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>



          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm text-gray-700">Answer Sheet</label>
              <label className="block text-sm text-gray-700">Leave options empty if the learner is not required to fill in the field</label>
              {formData.subject.toLowerCase().includes('accounting') && (
                !showAnswerSheet ? (
                  <button
                    type="button"
                    onClick={handleAddTable}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add Table
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRemoveTable}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Remove Table
                  </button>
                )
              )}
            </div>
            {showAnswerSheet && formData.answerSheet.rows.length > 0 && (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2">Description</th>
                      <th className="border border-gray-300 px-4 py-2">Amount</th>
                      <th className="border border-gray-300 px-4 py-2">Options (comma-separated)</th>
                      <th className="border border-gray-300 px-4 py-2">Explanation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.answerSheet.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="text"
                            value={row.column1}
                            onChange={(e) => handleTableInputChange(rowIndex, 'column1', e.target.value)}
                            className="w-full border-0 focus:ring-0"
                            placeholder="Enter description"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="text"
                            value={row.column2}
                            onChange={(e) => handleTableInputChange(rowIndex, 'column2', e.target.value)}
                            className={`w-full border-0 focus:ring-0 ${validationErrors[`row-${rowIndex}-column2`] ? 'bg-red-50' : ''}`}
                            placeholder="Enter amount (numbers only)"
                          />
                          {validationErrors[`row-${rowIndex}-column2`] && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors[`row-${rowIndex}-column2`]}</p>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="text"
                            value={row.column3}
                            onChange={(e) => handleTableInputChange(rowIndex, 'column3', e.target.value)}
                            className="w-full border-0 focus:ring-0"
                            placeholder="Enter options (comma-separated)"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <textarea
                            value={row.column4}
                            onChange={(e) => handleTableInputChange(rowIndex, 'column4', e.target.value)}
                            className="w-full border-0 focus:ring-0 resize-none"
                            placeholder="Enter explanation"
                            rows={3}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Add Row
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateOptions}
                    disabled={!areAllColumnBValuesFilled()}
                    className={`px-3 py-1 text-sm rounded focus:outline-none focus:ring-2 ${areAllColumnBValuesFilled()
                      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    Generate Options
                  </button>
                  <button
                    type="button"
                    onClick={convertToJson}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    Generate JSON
                  </button>
                </div>
                {jsonOutput && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-700 mb-1">Generated JSON:</label>
                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                      {jsonOutput}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {!showAnswerSheet && (
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
          )}

          {!showAnswerSheet && (
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
          )}

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
                  {renderLatex(formData.explanation)}
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