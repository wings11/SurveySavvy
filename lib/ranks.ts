// Rank system with meaningful names and descriptions
export interface RankInfo {
  level: number;
  name: string;
  description: string;
  minPoints: number;
  color: string;
  emoji: string;
}

export const RANK_SYSTEM: RankInfo[] = [
  {
    level: 1,
    name: "Curious Novice",
    description: "Beginning the journey of inquiry",
    minPoints: 0,
    color: "text-gray-600",
    emoji: "🌱"
  },
  {
    level: 2,
    name: "Inquisitive Apprentice",
    description: "Learning the art of questioning",
    minPoints: 120,
    color: "text-green-600",
    emoji: "🔍"
  },
  {
    level: 3,
    name: "Data Disciple",
    description: "Devoted to gathering insights",
    minPoints: 360,
    color: "text-blue-600",
    emoji: "📊"
  },
  {
    level: 4,
    name: "Survey Scholar",
    description: "Academic approach to research",
    minPoints: 800,
    color: "text-purple-600",
    emoji: "�"
  },
  {
    level: 5,
    name: "Methodologist",
    description: "Master of research methodology",
    minPoints: 1600,
    color: "text-orange-600",
    emoji: "⚗️"
  },
  {
    level: 6,
    name: "Analytic Fellow",
    description: "Distinguished analytical expert",
    minPoints: 2800,
    color: "text-red-600",
    emoji: "🎯"
  },
  {
    level: 7,
    name: "Academic Luminary",
    description: "Beacon of research excellence",
    minPoints: 4500,
    color: "text-yellow-600",
    emoji: "✨"
  },
  {
    level: 8,
    name: "Arch Chancellor of Inquiry",
    description: "Supreme master of all surveys",
    minPoints: 15000,
    color: "text-indigo-600",
    emoji: "👑"
  }
];

export const getRankInfo = (level: number): RankInfo => {
  const rank = RANK_SYSTEM.find(r => r.level === level);
  return rank || RANK_SYSTEM[0]; // Default to Newcomer if not found
};

export const getRankByPoints = (points: number): RankInfo => {
  // Find the highest rank that the user qualifies for
  let currentRank = RANK_SYSTEM[0];
  for (const rank of RANK_SYSTEM) {
    if (points >= rank.minPoints) {
      currentRank = rank;
    } else {
      break;
    }
  }
  return currentRank;
};

export const getNextRank = (currentLevel: number): RankInfo | null => {
  const nextRank = RANK_SYSTEM.find(r => r.level === currentLevel + 1);
  return nextRank || null;
};

export const getProgressToNextRank = (points: number, currentLevel: number): {
  progress: number;
  pointsNeeded: number;
  nextRank: RankInfo | null;
} => {
  const nextRank = getNextRank(currentLevel);
  
  if (!nextRank) {
    return {
      progress: 100,
      pointsNeeded: 0,
      nextRank: null
    };
  }

  const currentRank = getRankInfo(currentLevel);
  const pointsInCurrentRank = points - currentRank.minPoints;
  const pointsNeededForNext = nextRank.minPoints - currentRank.minPoints;
  const progress = Math.min(100, (pointsInCurrentRank / pointsNeededForNext) * 100);
  const pointsNeeded = Math.max(0, nextRank.minPoints - points);

  return {
    progress,
    pointsNeeded,
    nextRank
  };
};
