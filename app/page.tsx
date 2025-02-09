
import StatsCard from '@/components/dashboard/StatsCard'

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Questions" 
          value="1,234" 
          description="Across all grades"
        />
        <StatsCard 
          title="Your Questions" 
          value="123" 
          description="Questions you've created"
        />
        <StatsCard 
          title="Pending Approval" 
          value="45" 
          description="Questions awaiting review"
        />
        <StatsCard 
          title="Registered Learners" 
          value="5,678" 
          description="Total app users"
        />
      </div>
    </div>
  );
}
