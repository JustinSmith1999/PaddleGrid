import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

export function useAchievementNotifications() {
  const { user } = useAuth();
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('achievement-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const notification = payload.new;

          if (notification.type === 'achievement_unlocked' && notification.metadata) {
            const achievementData: Achievement = {
              id: notification.metadata.achievement_id,
              name: notification.metadata.achievement_name,
              description: notification.message,
              icon: notification.metadata.achievement_icon || 'trophy',
              points: notification.metadata.points || 0,
              rarity: notification.metadata.rarity || 'common'
            };

            setAchievementQueue(prev => [...prev, achievementData]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (achievementQueue.length > 0 && !newAchievement) {
      setNewAchievement(achievementQueue[0]);
      setAchievementQueue(prev => prev.slice(1));
    }
  }, [achievementQueue, newAchievement]);

  const dismissAchievement = () => {
    setNewAchievement(null);
  };

  return {
    currentAchievement: newAchievement,
    dismissAchievement
  };
}
