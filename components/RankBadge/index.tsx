import { getRankInfo, RANK_SYSTEM } from "../../lib/ranks";

interface RankBadgeProps {
  level: number;
  showName?: boolean;
  showEmoji?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RankBadge = ({ 
  level, 
  showName = true, 
  showEmoji = true, 
  size = 'md',
  className = ''
}: RankBadgeProps) => {
  const rank = getRankInfo(level);
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const emojiSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {showEmoji && (
        <span className={emojiSizes[size]}>{rank.emoji}</span>
      )}
      {showName && (
        <span className={`${rank.color} font-medium ${sizeClasses[size]}`}>
          {rank.name}
        </span>
      )}
    </div>
  );
};

interface RankProgressProps {
  points: number;
  level: number;
  showDetails?: boolean;
  className?: string;
}

export const RankProgress = ({ 
  points, 
  level, 
  showDetails = true,
  className = ''
}: RankProgressProps) => {
  const currentRank = getRankInfo(level);
  
  // Find the next rank in the system
  const nextRank = RANK_SYSTEM.find(r => r.level === level + 1);
  
  // If this is the max rank, show completed
  if (!nextRank) {
    return (
      <div className={className}>
        <div className="text-center text-sm text-gray-600">
          🎉 Maximum rank achieved!
        </div>
      </div>
    );
  }

  const pointsInCurrentRank = points - currentRank.minPoints;
  const pointsNeededForNext = nextRank.minPoints - currentRank.minPoints;
  const progress = Math.min(100, (pointsInCurrentRank / pointsNeededForNext) * 100);
  const pointsNeeded = Math.max(0, nextRank.minPoints - points);

  return (
    <div className={className}>
      {showDetails && (
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress to {nextRank.name}</span>
          <span>{pointsNeeded} points needed</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};
