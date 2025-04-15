export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://examquiz.dedicated.co.za/public/learn'
export const HOST_URL = process.env.NEXT_PUBLIC_HOST_URL || 'https://examquiz.dedicated.co.za'

// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/public/learn'
// export const HOST_URL = process.env.NEXT_PUBLIC_HOST_URL || 'http://127.0.0.1:8000'
// Types
export interface Grade {
  id: number
  number: number
  active: number
}

export interface LeaderboardEntry {
  name: string
  points: number
  position: number
  isCurrentLearner: boolean
  avatar: string
} 

export interface LeaderboardResponse {
  status: string
  rankings: LeaderboardEntry[]
  currentLearnerPoints: number
  currentLearnerPosition: number | null
  totalLearners: number
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
  totalQuestions?: number
  total_questions?: number
  answered_questions?: number
  correct_answers?: number
  question_count?: number
  result_count?: number
  correct_count?: number
}

export interface QuestionPayload {
  question: string
  type: string
  subject: string
  subject_id: number
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
  grade: string
  curriculum: string
  otherContextImages?: string[]
  answer_sheet?: Array<{
    A: string | { value: string }
    B: string | { 
      value: string
      isEditable: boolean
      correct: string
      options: string[]
    }
  }>
}

export interface ApiResponse {
  status: 'OK' | 'NOK'
  message?: string
  question_id?: number
  fileName?: string
}

export interface CheckAnswerResponse {
  status: string
  correct: boolean
  explanation: string | null
  correctAnswer: string
  points: number
  message: string
  lastThreeCorrect: boolean
  subject: string
  streakUpdated: boolean
  streak: number
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

export interface DetailedQuestion {
  id: number
  question: string
  type: 'multiple_choice'
  context: string
  answer: string
  options: string[] | {
    option1: string
    option2: string
    option3: string
    option4: string
  }
  term: number
  explanation: string
  active: boolean
  year: number
  capturer: {
    id: number
    uid: string
    name: string
    grade: any
    points: number
  }
  status: string
  message?: string
  comment?: string
  reviewer: {
    id: number
    uid: string
    name: string
    grade: any
    points: number
  }
  created: string
  subject: {
    id: number
    name: string
    active: boolean
    grade: any
  }
  image_path?: string
  question_image_path?: string
  answer_image?: string
  curriculum: string
  posted: boolean
  reviewed_at?: string
  updated?: string
  other_context_images?: string[]
}

export interface MySubjectsResponse {
  status: string
  subjects: {
    id: number
    name: string
    active: boolean
    totalSubjectQuestions: number
    totalResults: number
    correctAnswers: number
  }[]
}

export interface RandomAIQuestion {
  status: string;
  question: {
    id: number;
    question: string;
    type: string;
    context: string;
    answer: string;
    options: string[];
    term: number;
    higher_grade: number;
    active: boolean;
    posted: boolean;
    year: number;
    ai_explanation: string;
    subject: {
      id: number;
      name: string;
      active: boolean;
      grade: {
        id: number;
        number: number;
        active: number;
      };
    };
  };
}

export interface Badge {
  id: number
  name: string
  image: string
  rules: string
  category: string
}

export interface LearnerBadge {
  id: number
  badge_id: number
  learner_id: number
  earned_at: string
  badge: Badge
}

// Helper functions
function ensureHttps(url: string): string {
  return url
}

// API Functions
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
  type: 'question_context' | 'question' | 'answer' | 'other_context',
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

export async function getGrades(): Promise<Grade[]> {
  try {
    const response = await fetch(ensureHttps(`${API_BASE_URL}/grades`))

    if (!response.ok) {
      throw new Error('Failed to fetch grades')
    }

    const data = await response.json()
    return data.grades
  } catch (error) {
    console.error('Error fetching grades:', error)
    throw error
  }
}

export async function getActiveSubjects(grade: string): Promise<Subject[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/active?grade=${grade}`)

    if (!response.ok) {
      throw new Error('Failed to fetch subjects')
    }

    const data = await response.json()
    return data.subjects
  } catch (error) {
    console.error('Error fetching subjects:', error)
    throw error
  }
}

export async function setQuestionImagePath(data: {
  question_id: string
  image_name: string
  image_type: 'question_context' | 'question' | 'answer'
  uid: string
}): Promise<ApiResponse> {
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

export async function getQuestions(
  grade: string,
  subject: string,
  status?: string,
  uid?: string,
  social?: boolean
): Promise<Question[]> {
  try {
    let url = `${API_BASE_URL}/questions/by-grade-subject?grade=${grade}&subject=${subject}`
    if (status) {
      url += `&status=${status}`
    }
    if (social) {
      url += `&social=${social}`
    }

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch questions')
    }

    const data = await response.json()
    return data.questions
  } catch (error) {
    console.error('Error fetching questions:', error)
    throw error
  }
}

export async function deleteQuestion(questionId: string, uid: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/question/delete`, {
      method: 'DELETE',
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

    const question = data[0]
    if (question.answer) {
      question.answer = question.answer.replace(/[\[\]"]/g, '')
    }

    return question
  } catch (error) {
    console.error('Error fetching question:', error)
    throw error
  }
}

export async function createLearner(
  uid: string,
  data: {
    name: string
    grade: number
    school: string
    school_address: string
    school_latitude: number
    school_longitude: number
    terms: string
    curriculum: string
    email: string
    avatar: string
  }
): Promise<{ status: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/learner/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uid,
        name: data.name,
        grade: data.grade.toString(),
        school_name: data.school,
        school_address: data.school_address,
        school_latitude: data.school_latitude,
        school_longitude: data.school_longitude,
        terms: data.terms,
        curriculum: data.curriculum,
        email: data.email,
        avatar: data.avatar
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update learner' }))
      throw new Error(error.message || 'Failed to update learner')
    }

    return response.json()
  } catch (error) {
    console.error('Error creating learner:', error)
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

export async function getRejectedQuestions(uid: string): Promise<Question[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/rejected?capturer=${uid}`)

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

export async function getRejectedQuestionsCount(uid: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/rejected?capturer=${uid}`)
    const data = await response.json()
    return data.count || 0
  } catch (error) {
    console.error('Error fetching rejected count:', error)
    return 0
  }
}

export async function updatePostedStatus(questionId: string, posted: boolean): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/question/update-posted-status?questionId=${questionId}&posted=${posted}`,
      {
        method: 'POST'
      }
    )

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

export async function fetchMySubjects(uid: string): Promise<MySubjectsResponse> {
  const response = await fetch(`${API_BASE_URL}/learner/subjects?uid=${uid}`)

  if (!response.ok) {
    throw new Error('Failed to fetch enrolled subjects')
  }

  return response.json()
}

export async function checkAnswer(
  uid: string,
  questionId: number,
  answer: string,
  duration: number
): Promise<CheckAnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/learner/check-answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uid,
      question_id: questionId,
      answer,
      answers: [],
      requesting_type: 'real',
      duration: duration
    })
  })

  if (!response.ok) {
    throw new Error('Failed to check answer')
  }

  const data = await response.json()
  return data
}


export async function checkRecordingAnswer(
  uid: string,  
  questionId: number,
  answer: string,
  duration: number
): Promise<CheckAnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/learner/check-answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uid,
      question_id: questionId,
      answer,
      answers: [],
      requesting_type: 'real',
      duration: duration,
      mode: 'recording'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to check answer')
  }

  const data = await response.json()
  return data
}

export async function getLearner(uid: string): Promise<{
  id: number
  uid: string
  name: string
  grade: {
    id: number
    number: number
    active: number
  }
  school_name: string
  school_address: string
  school_latitude: number
  school_longitude: number
  curriculum: string
  terms: string
  email: string
  role?: string
  points: number
  streak: number
  avatar: string
}> {
  const response = await fetch(`${API_BASE_URL}/learner?uid=${uid}`)

  if (!response.ok) {
    throw new Error('Failed to fetch learner')
  }

  const data = await response.json()
  return { ...data, role: data.role || 'learner', points: data.points || 0 }
}

export async function removeResults(uid: string, subjectName: string): Promise<void> {
  const response = await fetch(
    ensureHttps(`${API_BASE_URL}/learner/remove-results?uid=${uid}&subject_name=${subjectName}`),
    {
      method: 'DELETE',
      body: JSON.stringify({
        uid,
        subject_name: subjectName
      })
    }
  )
  if (!response.ok) {
    throw new Error('Failed to remove results')
  }
}

export async function getSubjectStats(uid: string, subjectName: string): Promise<{
  status: string
  data: {
    subject: {
      id: number
      name: string
    }
    stats: {
      total_answers: number
      correct_answers: number
      incorrect_answers: number
      correct_percentage: number
      incorrect_percentage: number
    }
  }
}> {
  try {
    const response = await fetch(
      ensureHttps(`${API_BASE_URL}/learner/subject-stats?uid=${uid}&subject_name=${subjectName}`),
      { method: 'GET' }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch subject stats')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching subject stats:', error)
    throw error
  }
}

export async function setQuestionStatus(data: {
  question_id: number
  status: 'approved' | 'rejected'
  email: string
  uid: string
  comment: string
}): Promise<void> {
  try {
    const response = await fetch(ensureHttps(`${API_BASE_URL}/question/set-status`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update question status')
    }

    return response.json()
  } catch (error) {
    console.error('Error setting question status:', error)
    throw error
  }
}

export async function updatePushToken(uid: string, pushToken: string): Promise<void> {
  const response = await fetch(`${HOST_URL}/api/push-notifications/update-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uid,
      push_token: pushToken
    })
  })

  if (!response.ok) {
    throw new Error('Failed to update push token')
  }
}

export async function getRandomQuestion(
  subjectName: string,
  paper: string,
  uid: string
): Promise<DetailedQuestion> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/question/byname?subject_name=${subjectName}&paper_name=${paper}&uid=${uid}&question_id=0&platform=web`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch random question')
    }

    const data = await response.json()
    console.log("data ", data)
    if (!data) {
      throw new Error('No questions available')
    }

    // The API returns the question directly, not wrapped in a question property
    return data
  } catch (error) {
    console.error('Error fetching random question:', error)
    throw error
  }
}

export async function getRecordignRandomQuestion(
  subjectName: string,
  uid: string,
  term: number,
  grade: string
): Promise<DetailedQuestion> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/question/recording?subjectName=${subjectName}&uid=${uid}&grade=${grade}&learnerTerms=${term}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch random question')
    }

    const data = await response.json()
    console.log("data ", data)
    if (!data) {
      throw new Error('No questions available')
    }

    // The API returns the question directly, not wrapped in a question property
    return data
  } catch (error) {
    console.error('Error fetching random question:', error)
    throw error
  }
}

export async function getRandomAIQuestion(uid: string): Promise<RandomAIQuestion> {
  try {
    const response = await fetch(`${API_BASE_URL}/question/random-ai?uid=${uid}`);

    if (!response.ok) {
      throw new Error('Failed to fetch random AI question');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching random AI question:', error);
    throw error;
  }
}

export async function getAllBadges(): Promise<Badge[]> {
  try {
    const response = await fetch(`${HOST_URL}/api/badges`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch badges')
    }

    const data = await response.json()
    return data.badges
  } catch (error) {
    console.error('Error fetching badges:', error)
    throw error
  }
}

export async function getLearnerBadges(uid: string): Promise<LearnerBadge[]> {
  try {
    const response = await fetch(`${HOST_URL}/api/badges/learner/${uid}`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch learner badges')
    }

    const data = await response.json()
    return data.badges
  } catch (error) {
    console.error('Error fetching learner badges:', error)
    throw error
  }
}

export async function getLeaderboard(uid: string, limit: number = 10): Promise<LeaderboardResponse> {
  try {
    const response = await fetch(`${HOST_URL}/api/leaderboard?uid=${uid}&limit=${limit}`)
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard')
    }
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    throw error
  }
} 