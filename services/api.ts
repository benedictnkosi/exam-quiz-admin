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
    const response = await fetch(`${API_BASE_URL}/question`, {
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
    const response = await fetch(`https://api.examquiz.co.za/public/learn/learner/upload-image`, {
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
    const response = await fetch(`${API_BASE_URL}/question/image/update`, {
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
  type: 'multiple_choice'
  answer: string
  status: string
  capturer: {
    name: string
  }
  grade: string
  subject: string | { id: number; name: string; active: boolean; grade: any }
  createdAt: string
  comment?: string
  posted: boolean
  image_path: string
  question_image_path: string
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
    const response = await fetch(`${API_BASE_URL}/question/delete?question_id=${questionId}&uid=${uid}`, {
      method: 'DELETE'
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
  type: 'multiple_choice'
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
  curriculum: string
}

interface QuestionResponse {
  status: string
  message?: string
  question: DetailedQuestion
}

export async function getQuestionById(id: string): Promise<DetailedQuestion> {
  try {
    const response = await fetch(`${API_BASE_URL}/question?id=${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch question');
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error(`Error fetching question ID ${id}:`, error);
    throw error;
  }
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


export async function getSubjectsForGrade(gradeId: string, uid: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/active?grade=${gradeId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch subjects')
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching subjects:', error)
    throw error
  }
}


interface RejectedCountResponse {
  status: 'OK' | 'NOK'
  count: number
}

export async function getRejectedQuestionsCount(uid: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/rejected-count?uid=${uid}`)

    if (!response.ok) {
      throw new Error('Failed to fetch rejected questions count')
    }

    const result: RejectedCountResponse = await response.json()
    if (result.status === 'NOK') {
      throw new Error('Failed to fetch rejected questions count')
    }

    return result.count
  } catch (error) {
    console.error('Error fetching rejected count:', error)
    return 0
  }
}


export async function updatePostedStatus(questionId: string, posted: boolean, uid: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/question/posted-status?question_id=${questionId}&posted=${posted}&uid=${uid}`,
      { method: 'PUT' }
    )

    if (!response.ok) {
      throw new Error('Failed to update posted status')
    }

    const result: ApiResponse = await response.json()
    if (result.status === 'NOK') {
      throw new Error(result.message || 'Failed to update posted status')
    }

    return result
  } catch (error) {
    console.error('Error updating posted status:', error)
    throw error
  }
}

interface RejectedQuestionsResponse {
  status: 'OK' | 'NOK'
  questions: Question[]
  count: number
}

export async function getRejectedQuestionsByUid(uid: string): Promise<RejectedQuestionsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/rejected-by-uid?uid=${uid}`)

    if (!response.ok) {
      throw new Error('Failed to fetch rejected questions')
    }

    const result = await response.json()
    if (result.status === 'NOK') {
      throw new Error(result.message || 'Failed to fetch rejected questions')
    }

    return result
  } catch (error) {
    console.error('Error fetching rejected questions:', error)
    throw error
  }
}

interface CheckAnswerPayload {
  uid: string
  question_id: number | string
  answer: string
}

interface CheckAnswerResponse {
  status: 'OK' | 'NOK'
  correct: boolean
  explanation?: string
  correctAnswer?: string | string[]
  message: string
  subject?: string
}

export async function checkLearnerAnswer(data: CheckAnswerPayload): Promise<CheckAnswerResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/learner/check-answer`, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to check answer')
    }

    const result = await response.json()
    if (result.status === 'NOK') {
      throw new Error(result.message || 'Failed to check answer')
    }

    return result
  } catch (error) {
    console.error('Error checking answer:', error)
    throw error
  }
}

interface StatusCountResponse {
  status: 'OK' | 'NOK'
  count: number
}

export async function getNewQuestionsCount(): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/new-count`)

    if (!response.ok) {
      throw new Error('Failed to fetch new questions count')
    }

    const result: StatusCountResponse = await response.json()
    if (result.status === 'NOK') {
      throw new Error('Failed to fetch new questions count')
    }

    return result.count
  } catch (error) {
    console.error('Error fetching new questions count:', error)
    return 0
  }
}

interface ReviewedQuestion {
  id: number
  question: string
  answer: string
  correct_answer: string | string[]
  is_correct: boolean
  answered_at: string
  subject: string
  grade: number
  question_status: string
  type: string
}

interface ReviewedQuestionsResponse {
  status: 'OK' | 'NOK'
  questions: {
    items: ReviewedQuestion[]
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export async function getQuestionsReviewedByLearner(
  uid: string,
  page: number = 1,
  limit: number = 20
): Promise<ReviewedQuestionsResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/learner/reviewed-questions?uid=${uid}&page=${page}&limit=${limit}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch reviewed questions')
    }

    const result: ReviewedQuestionsResponse = await response.json()
    if (result.status === 'NOK') {
      throw new Error('Failed to fetch reviewed questions')
    }

    return result
  } catch (error) {
    console.error('Error fetching reviewed questions:', error)
    throw error
  }
}

export async function getNextNewQuestion(currentQuestionId: string): Promise<DetailedQuestion> {
  try {
    const response = await fetch(`${API_BASE_URL}/question/next-new?current_question_id=${currentQuestionId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch next question');
    }

    const data = await response.json();

    if (data.status === 'NOK' || !data.question) {
      throw new Error(data.message || 'No more questions available');
    }

    // Clean up the answer by removing brackets and quotes if needed
    const question = data.question;
    if (question.answer) {
      question.answer = question.answer.replace(/[\[\]"]/g, '');
    }

    return question;
  } catch (error) {
    console.error('Error fetching next question:', error);
    throw error;
  }
} 