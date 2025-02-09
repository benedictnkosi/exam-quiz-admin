interface Subject {
  id: string
  name: string
  isActive: boolean
}

interface SubjectListProps {
  subjects: Subject[]
  onToggleSubject: (id: string) => void
}

export default function SubjectList({ subjects, onToggleSubject }: SubjectListProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-medium">Subject List</h2>
      </div>
      <ul className="divide-y divide-gray-200">
        {subjects.map((subject) => (
          <li 
            key={subject.id}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <span className={`w-2 h-2 rounded-full ${
                subject.isActive ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-gray-900">{subject.name}</span>
            </div>
            <button
              onClick={() => onToggleSubject(subject.id)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                subject.isActive
                  ? 'text-red-600 hover:text-red-700'
                  : 'text-green-600 hover:text-green-700'
              }`}
            >
              {subject.isActive ? 'Hide' : 'Show'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
} 