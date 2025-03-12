'use client'

import { useState } from 'react'
import StatsCard from './StatsCard'

export default function PendingApprovalsCard() {
    const [count, setCount] = useState(0)
    const [loading, setLoading] = useState(true)

    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             const newCount = await getNewQuestionsCount()
    //             setCount(newCount)
    //         } catch (err) {
    //             console.error('Failed to fetch pending count:', err)
    //         } finally {
    //             setLoading(false)
    //         }
    //     }

    //     fetchData()
    // }, [])

    return (
        <StatsCard
            title="Pending Approvals"
            value={loading ? '...' : count.toString()}
            description="Questions awaiting review"
        />
    )
} 