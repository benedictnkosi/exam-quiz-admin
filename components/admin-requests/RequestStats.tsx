interface StatsProps {
  stats: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
}

export default function RequestStats({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Total Requests</div>
        <div className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-yellow-500">Pending</div>
        <div className="mt-1 text-3xl font-semibold text-yellow-600">{stats.pending}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-green-500">Approved</div>
        <div className="mt-1 text-3xl font-semibold text-green-600">{stats.approved}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-red-500">Rejected</div>
        <div className="mt-1 text-3xl font-semibold text-red-600">{stats.rejected}</div>
      </div>
    </div>
  )
} 