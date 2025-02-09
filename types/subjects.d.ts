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