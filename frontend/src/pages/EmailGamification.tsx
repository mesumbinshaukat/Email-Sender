import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface GamificationProfile {
  points: number;
  level: number;
  badges?: Array<{
    name: string;
    rarity: string;
  }>;
  achievements?: Array<{
    type: string;
    count: number;
    target: number;
    completed: boolean;
  }>;
}

const EmailGamification = () => {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get('/api/gamification');
      setProfile(data);
    } catch (error) {
      toast.error('Failed to fetch gamification profile');
    }
  };

  return (
    <DashboardLayout>
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Trophy className="h-8 w-8 text-blue-600" />
            Email Gamification
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Earn points and unlock achievements for your email marketing success
          </p>
        </motion.div>

        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{profile.points}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Points</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">Level {profile.level}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Level</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{profile.badges?.length || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Badges Earned</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Achievements</h2>
            <div className="space-y-3">
              {profile?.achievements?.map(achievement => (
                <div key={achievement.type} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium capitalize">{achievement.type.replace('_', ' ')}</span>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {achievement.count}/{achievement.target} completed
                    </div>
                  </div>
                  {achievement.completed && <Star className="h-5 w-5 text-yellow-500" />}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Badges</h2>
            <div className="grid grid-cols-2 gap-4">
              {profile?.badges?.map(badge => (
                <div key={badge.name} className="text-center p-4 border rounded">
                  <Trophy className={`h-8 w-8 mx-auto mb-2 ${
                    badge.rarity === 'legendary' ? 'text-yellow-500' :
                    badge.rarity === 'epic' ? 'text-purple-500' :
                    badge.rarity === 'rare' ? 'text-blue-500' : 'text-gray-500'
                  }`} />
                  <div className="font-medium text-sm">{badge.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">{badge.rarity}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
      </DashboardLayout>
  );
};

export default EmailGamification;
