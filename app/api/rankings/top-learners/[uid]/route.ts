import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
    request: Request,
    { params }: { params: { uid: string } }
) {
    try {
        const uid = params.uid;

        if (!uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'UID is required'
            }, { status: 400 });
        }

        // Get current learner
        const { data: currentLearner, error: currentLearnerError } = await supabase
            .from('learner')
            .select('id, uid, name, score')
            .eq('uid', uid)
            .single();

        if (currentLearnerError || !currentLearner) {
            console.error('Error fetching current learner:', currentLearnerError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Current learner not found'
            }, { status: 404 });
        }

        // Get ALL learners with their scores
        const { data: allLearners, error: learnersError } = await supabase
            .from('learner')
            .select('uid, name, score')
            .order('score', { ascending: false });

        if (learnersError) {
            console.error('Error fetching learners:', learnersError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching learners'
            }, { status: 500 });
        }

        // Create position map for all learners with proper handling of tied scores
        const positionMap: { [key: string]: { position: number, score: number } } = {};
        let position = 1;
        let lastScore: number | null = null;
        let skipPositions = 0;

        allLearners.forEach((learner) => {
            const score = Math.round((learner.score || 0) * 100) / 100; // Round to 2 decimal places

            if (lastScore !== null && lastScore !== score) {
                position += skipPositions + 1;
                skipPositions = 0;
            } else if (lastScore === score) {
                skipPositions++;
            }

            positionMap[learner.uid] = {
                position: position,
                score: score
            };

            lastScore = score;
        });

        // Get top 10 learners
        const topLearners = allLearners.slice(0, 10);

        // Format the response
        const rankings = [];
        let currentLearnerInTop10 = false;

        for (const learner of topLearners) {
            const isCurrentLearner = learner.uid === uid;
            if (isCurrentLearner) {
                currentLearnerInTop10 = true;
            }

            rankings.push({
                name: learner.name,
                score: positionMap[learner.uid].score,
                position: positionMap[learner.uid].position,
                isCurrentLearner: isCurrentLearner
            });
        }

        // If current learner is not in top 10, add them to the response
        if (!currentLearnerInTop10) {
            rankings.push({
                name: currentLearner.name,
                score: positionMap[currentLearner.uid].score,
                position: positionMap[currentLearner.uid].position,
                isCurrentLearner: true,
                notInTop10: true
            });
        }

        return NextResponse.json({
            status: 'OK',
            rankings: rankings,
            currentLearnerScore: positionMap[currentLearner.uid].score,
            currentLearnerPosition: positionMap[currentLearner.uid].position,
            totalLearners: allLearners.length
        });

    } catch (error) {
        console.error('Error in getTopLearners:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error fetching rankings',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 