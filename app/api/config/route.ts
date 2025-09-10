import { NextResponse } from 'next/server';
import { RANKS } from '@lib/rank';

export async function GET(){
  return NextResponse.json({
    maxSurveyGoal: parseInt(process.env.MAX_SURVEY_GOAL||'3000',10),
    helpPointsDailyCap: parseInt(process.env.HELP_POINTS_DAILY_CAP||'500',10),
    weeklyPurchasePoints: parseInt(process.env.PURCHASE_WEEKLY_POINTS||'10',10),
    ranks: RANKS.map(r=>({ level:r.level, min:r.min, name:r.name }))
  });
}
