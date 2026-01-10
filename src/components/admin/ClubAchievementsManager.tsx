import { useState, useEffect } from 'react';
import { Trophy, Edit2, Eye, EyeOff, Save, X, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AchievementDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  default_threshold: number;
  threshold_unit: string;
  rarity: string;
  points: number;
}

interface ClubAchievement {
  id: string;
  facility_id: string;
  achievement_definition_id: string;
  custom_threshold: number | null;
  is_enabled: boolean;
  custom_name: string | null;
  custom_description: string | null;
  achievement_definitions: AchievementDefinition;
}

interface ClubAchievementsManagerProps {
  facilityId: string;
}

export default function ClubAchievementsManager({ facilityId }: ClubAchievementsManagerProps) {
  const [achievements, setAchievements] = useState<ClubAchievement[]>([]);
  const [availableAchievements, setAvailableAchievements] = useState<AchievementDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    custom_name: '',
    custom_description: '',
    custom_threshold: '',
  });

  useEffect(() => {
    loadAchievements();
  }, [facilityId]);

  const loadAchievements = async () => {
    setLoading(true);

    const { data: clubAchievements } = await supabase
      .from('club_achievements')
      .select(`
        *,
        achievement_definitions (*)
      `)
      .eq('facility_id', facilityId)
      .order('achievement_definitions(category)', { ascending: true });

    const { data: allDefinitions } = await supabase
      .from('achievement_definitions')
      .select('*')
      .order('category', { ascending: true });

    if (clubAchievements) {
      setAchievements(clubAchievements as any);
    }

    if (allDefinitions) {
      const enabledIds = new Set(clubAchievements?.map(ca => ca.achievement_definition_id) || []);
      const available = allDefinitions.filter(def => !enabledIds.has(def.id));
      setAvailableAchievements(available);
    }

    setLoading(false);
  };

  const toggleEnabled = async (achievementId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('club_achievements')
      .update({ is_enabled: !currentState })
      .eq('id', achievementId);

    if (!error) {
      loadAchievements();
    }
  };

  const startEditing = (achievement: ClubAchievement) => {
    setEditingId(achievement.id);
    setEditForm({
      custom_name: achievement.custom_name || '',
      custom_description: achievement.custom_description || '',
      custom_threshold: achievement.custom_threshold?.toString() || achievement.achievement_definitions.default_threshold.toString(),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from('club_achievements')
      .update({
        custom_name: editForm.custom_name || null,
        custom_description: editForm.custom_description || null,
        custom_threshold: editForm.custom_threshold ? parseInt(editForm.custom_threshold) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingId);

    if (!error) {
      setEditingId(null);
      loadAchievements();
    }
  };

  const enableAchievement = async (definitionId: string) => {
    const { error } = await supabase
      .from('club_achievements')
      .insert({
        facility_id: facilityId,
        achievement_definition_id: definitionId,
        is_enabled: true,
      });

    if (!error) {
      loadAchievements();
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'legendary': return 'bg-amber-100 text-amber-700 border-amber-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.achievement_definitions.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, ClubAchievement[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-600" />
            Achievements Manager
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Control which achievements are available and customize their requirements
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading achievements...</div>
      ) : (
        <>
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
            <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  {category}
                </h3>
              </div>

              <div className="divide-y divide-gray-100">
                {categoryAchievements.map((achievement) => {
                  const def = achievement.achievement_definitions;
                  const isEditing = editingId === achievement.id;

                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 ${!achievement.is_enabled ? 'opacity-50 bg-gray-50' : ''}`}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Custom Name (leave empty to use default)
                            </label>
                            <input
                              type="text"
                              value={editForm.custom_name}
                              onChange={(e) => setEditForm({ ...editForm, custom_name: e.target.value })}
                              placeholder={def.name}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Custom Description (leave empty to use default)
                            </label>
                            <textarea
                              value={editForm.custom_description}
                              onChange={(e) => setEditForm({ ...editForm, custom_description: e.target.value })}
                              placeholder={def.description}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Threshold (default: {def.default_threshold})
                            </label>
                            <input
                              type="number"
                              value={editForm.custom_threshold}
                              onChange={(e) => setEditForm({ ...editForm, custom_threshold: e.target.value })}
                              min="1"
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <span className="ml-2 text-xs text-gray-600">{def.threshold_unit}</span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="text-3xl">{def.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">
                                  {achievement.custom_name || def.name}
                                </h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRarityColor(def.rarity)}`}>
                                  {def.rarity}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                  {def.points} pts
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {achievement.custom_description || def.description}
                              </p>
                              <div className="text-xs text-gray-500">
                                Requirement: {achievement.custom_threshold || def.default_threshold} {def.threshold_unit}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditing(achievement)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleEnabled(achievement.id, achievement.is_enabled)}
                              className={`p-2 rounded-lg transition-colors ${
                                achievement.is_enabled
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={achievement.is_enabled ? 'Disable' : 'Enable'}
                            >
                              {achievement.is_enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {availableAchievements.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Available to Enable
                </h3>
              </div>

              <div className="divide-y divide-gray-100">
                {availableAchievements.map((def) => (
                  <div key={def.id} className="p-4 flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-3xl">{def.icon}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{def.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRarityColor(def.rarity)}`}>
                            {def.rarity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{def.description}</p>
                        <div className="text-xs text-gray-500">
                          Default: {def.default_threshold} {def.threshold_unit}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => enableAchievement(def.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Enable
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
