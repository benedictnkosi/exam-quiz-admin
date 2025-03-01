import { API_BASE_URL } from '../config/constants.js'


export interface QuestionPayload {
  question: string
  type: string
  subject: string
  context: string
  answer: string
  options: {
    option1: string
    option2: string
    option3: string
    option4: string
  }
  explanation: string
  year: number
  term: string
  capturer: string
  uid: string
  question_id?: number
  grade: string,
  curriculum: string
}


interface ApiResponse {
  status: 'OK' | 'NOK'
  message?: string
  question_id?: number
  fileName?: string
}

export async function createQuestion(data: QuestionPayload): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/question/create`, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        question_id: data.question_id || 0
      }),
    })

    const result: ApiResponse = await response.json()
    if (!response.ok || result.status === 'NOK') {
      throw new Error(result.message || 'Failed to create question')
    }

    return result
  } catch (error) {
    console.error('Error creating question:', error)
    throw error
  }
}

export async function uploadQuestionImage(
  file: File,
  questionId: string,
  type: 'question_context' | 'question' | 'answer',
  uid: string
): Promise<ApiResponse> {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('question_id', questionId)
  formData.append('image_type', type)
  formData.append('uid', uid)

  try {
    const response = await fetch(`${API_BASE_URL}/learner/upload-image`, {
      method: 'POST',
      body: formData,
    })

    const result: ApiResponse = await response.json()

    if (!response.ok || result.status === 'NOK') {
      throw new Error(result.message || 'Failed to upload image')
    }

    return result
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

export interface Grade {
  id: number
  number: number
  active: number
}

interface GradesResponse {
  status: string
  grades: Grade[]
}

export async function getGrades() {
  try {
    const response = await fetch(`${API_BASE_URL}/grades`)

    if (!response.ok) {
      throw new Error('Failed to fetch grades')
    }

    const data: GradesResponse = await response.json()
    return data.grades
  } catch (error) {
    console.error('Error fetching grades:', error)
    throw error
  }
}

export interface Subject {
  id: number
  name: string
  active: boolean
  grade: {
    id: number
    number: number
    active: number
  }
}

interface SubjectsResponse {
  status: string
  subjects: Subject[]
}

export async function getActiveSubjects(grade: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/active?grade=${grade}`)

    if (!response.ok) {
      throw new Error('Failed to fetch subjects')
    }

    const data: SubjectsResponse = await response.json()
    return data.subjects
  } catch (error) {
    console.error('Error fetching subjects:', error)
    throw error
  }
}

// Update the interface and function for setting image path
interface SetImagePathPayload {
  question_id: string
  image_name: string  // Changed from image_path to image_name
  image_type: 'question_context' | 'question' | 'answer',
  uid: string
}

export async function setQuestionImagePath(data: SetImagePathPayload): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/question/set-image-path`, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    const result: ApiResponse = await response.json()

    if (!response.ok || result.status === 'NOK') {
      throw new Error(result.message || 'Failed to set image path')
    }

    return result
  } catch (error) {
    console.error('Error setting image path:', error)
    throw error
  }
}

export interface Question {
  id: number
  question: string
  type: 'multiple_choice' | 'single' | 'true_false'
  answer: string
  status: string
  capturer: string
  grade: string
  subject: string | { id: number; name: string; active: boolean; grade: any }
  createdAt: string
  comment?: string
  posted: boolean
  image_path: string
}

interface QuestionsResponse {
  status: string
  questions: Question[]
}

export async function getQuestions(grade: string, subject: string, status?: string, uid?: string, social?: boolean) {
  try {
    let url = `${API_BASE_URL}/questions/by-grade-subject?grade=${grade}&subject=${subject}`
    if (status) {
      url += `&status=${status}`
    }
    if (social) {
      url += `&social=${social}`
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch questions')
    }

    const data: QuestionsResponse = await response.json()
    return data.questions
  } catch (error) {
    console.error('Error fetching questions:', error)
    throw error
  }
}

export async function setQuestionInactive(questionId: string, uid: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/question/set-inactive`, {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, uid }),
    })

    const result: ApiResponse = await response.json()

    if (!response.ok || result.status === 'NOK') {
      throw new Error(result.message || 'Failed to delete question')
    }

    return result
  } catch (error) {
    console.error('Error deleting question:', error)
    throw error
  }
}

export interface DetailedQuestion {
  id: number
  question: string
  type: 'multiple_choice' | 'single' | 'true_false'
  context: string
  answer: string
  options: {
    option1: string
    option2: string
    option3: string
    option4: string
  }
  term: number
  explanation: string
  active: boolean
  year: number
  capturer: string
  status: string
  comment?: string
  reviewer: string
  created: string
  subject: {
    id: number
    name: string
    active: boolean
    grade: {
      id: number
      number: number
      active: number
    }
  }
  image_path?: string          // For question context image
  question_image_path?: string // For question image
  answer_image?: string        // For answer explanation image
}

interface QuestionResponse {
  status: string
  message?: string
  question: DetailedQuestion
}

export async function getQuestionById(id: string): Promise<DetailedQuestion> {
  try {
    const response = await fetch(`${API_BASE_URL}/questions?id=${id}`)

    if (!response.ok) {
      throw new Error('Failed to fetch question')
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Question not found')
    }

    // Clean up the answer by removing brackets and quotes
    const question = data[0]
    question.answer = question.answer.replace(/[\[\]"]/g, '')

    return question
  } catch (error) {
    console.error('Error fetching question:', error)
    throw error
  }
}

export async function requestAdminAccess(uid: string) {
  const response = await fetch(`${API_BASE_URL}/public/learner/role/update`, {
    method: 'POST',
    body: JSON.stringify({
      role: 'admin_pending',
      uid
    }),
  })
  return response.json()
}

export async function getPendingAdminRequests() {
  const response = await fetch(`${API_BASE_URL}/public/learners/by-role?role=admin_pending`)
  return response.json()
}

export async function approveAdminRequest(userId: string, uid: string) {
  const response = await fetch(`${API_BASE_URL}/public/learner/role/update`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      role: 'admin',
      uid
    }),
  })
  return response.json()
}

export async function createLearner(uid: string, email: string, displayName?: string | null) {
  try {
    const response = await fetch(`${API_BASE_URL}/learner/create`, {
      method: 'POST',
      body: JSON.stringify({
        uid,
        email,
        name: displayName || email.split('@')[0]
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create learner')
    }

    return response.json()
  } catch (error) {
    console.error('Error creating learner:', error)
    throw error
  }
}

interface SubjectGradePayload {
  subject_id: number
  active: boolean
  grade?: number  // Made optional since it's not needed for status updates
}

export async function addSubjectToGrade(data: SubjectGradePayload, uid: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/subject/add-to-grade`, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        uid
      }),
    })

    const result = await response.json()
    if (!response.ok || result.status === 'NOK') {
      throw new Error(result.message || 'Failed to add subject to grade')
    }

    return result
  } catch (error) {
    console.error('Error adding subject to grade:', error)
    throw error
  }
}

export async function updateSubjectGradeStatus(data: SubjectGradePayload, uid: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/subject/update-active`, {
      method: 'POST',
      body: JSON.stringify({
        subject_id: data.subject_id,
        active: data.active,
        uid
      }),
    })

    const result = await response.json()
    if (!response.ok || result.status === 'NOK') {
      throw new Error(result.message || 'Failed to update subject status')
    }

    return result
  } catch (error) {
    console.error('Error updating subject status:', error)
    throw error
  }
}

export async function getSubjectsForGrade(gradeId: string, uid: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/by-grade?grade=${gradeId}&uid=${uid}`)

    if (!response.ok) {
      throw new Error('Failed to fetch subjects')
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching subjects:', error)
    throw error
  }
}

export async function addSubject(data: { name: string, grade: number }, uid: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/subject/create`, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        uid
      }),
    })

    const result = await response.json()
    if (!response.ok || result.status === 'NOK') {
      throw new Error(result.message || 'Failed to add subject')
    }

    return result
  } catch (error) {
    console.error('Error adding subject:', error)
    throw error
  }
}

export async function getSubjectNames(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/names`)

    if (!response.ok) {
      throw new Error('Failed to fetch subject names')
    }

    const result = await response.json()
    return result.subjects || []
  } catch (error) {
    console.error('Error fetching subject names:', error)
    throw error
  }
}

export async function getNextNewQuestion(questionId: string): Promise<DetailedQuestion> {
  try {
    const response = await fetch(`${API_BASE_URL}/question/next-new?question_id=${questionId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch next question')
    }

    const data = await response.json()
    if (data.status !== 'OK' || !data.question) {
      throw new Error('No more questions to review')
    }

    return data.question
  } catch (error) {
    console.error('Error fetching next question:', error)
    throw error
  }
}

export async function getRejectedQuestions(email: string): Promise<Question[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/rejected?capturer=${email}`)

    if (!response.ok) {
      throw new Error('Failed to fetch rejected questions')
    }

    const data = await response.json()
    return data.questions || []
  } catch (error) {
    console.error('Error fetching rejected questions:', error)
    throw error
  }
}

export async function getRejectedQuestionsCount(email: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/rejected?capturer=${email}`)
    const data = await response.json()
    return data.count || 0
  } catch (error) {
    console.error('Error fetching rejected count:', error)
    return 0
  }
}

export async function getSocialMediaQuestions(email: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/rejected?capturer=${email}`)
    const data = await response.json()
    return data.count || 0
  } catch (error) {
    console.error('Error fetching rejected count:', error)
    return 0
  }
}

export async function updatePostedStatus(questionId: string, posted: boolean): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/question/update-posted-status?questionId=${questionId}&posted=${posted}`, {
      method: 'POST'

    })

    if (!response.ok) {
      throw new Error('Failed to update posted status')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error updating posted status:', error)
    throw error
  }
} 