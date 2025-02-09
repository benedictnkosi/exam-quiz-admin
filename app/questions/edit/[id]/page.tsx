import EditQuestionForm from '@/components/questions/EditQuestionForm'

export default function EditQuestionPage({ params }: { params: { id: string } }) {
  return <EditQuestionForm questionId={params.id} />
} 