interface StatsCardProps {
  title: string
  value: string
  description: string
}

export default function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-gray-600 text-sm mt-1">{description}</p>
    </div>
  )
} 