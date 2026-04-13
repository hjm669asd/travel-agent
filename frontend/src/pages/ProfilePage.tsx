import { useState, useEffect } from 'react';
import { authAPI, ratingAPI, diaryAPI } from '../api/community';
import type { Rating, DiaryListItem } from '../api/community';

interface ProfilePageProps {
  user: any;
  onUpdateUser: () => void;
}

export default function ProfilePage({ user, onUpdateUser }: ProfilePageProps) {
  const [bio, setBio] = useState(user?.bio || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [editing, setEditing] = useState(false);
  const [myRatings, setMyRatings] = useState<Rating[]>([]);
  const [myDiaries, setMyDiaries] = useState<DiaryListItem[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'ratings' | 'diaries'>('info');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadMyData();
    }
  }, [user]);

  const loadMyData = async () => {
    try {
      const ratings = await ratingAPI.getMyRatings();
      setMyRatings(ratings);
    } catch (e) {
      console.error('加载评分失败', e);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await authAPI.updateMe({ bio, email, avatar_url: avatarUrl });
      onUpdateUser();
      setEditing(false);
    } catch (error) {
      console.error('更新失败', error);
    }
    setLoading(false);
  };

  const deleteRating = async (id: number) => {
    if (!confirm('确定删除这条评分吗？')) return;
    try {
      await ratingAPI.delete(id);
      setMyRatings(myRatings.filter(r => r.id !== id));
    } catch (error) {
      console.error('删除失败', error);
    }
  };

  const renderStars = (score: number) => {
    return '⭐'.repeat(score) + '☆'.repeat(5 - score);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 个人信息</h2>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full rounded-full" />
            ) : (
              user?.username?.[0]?.toUpperCase()
            )}
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold">{user?.username}</h3>
            <p className="text-gray-500 text-sm">{user?.is_admin ? '管理员' : '普通用户'}</p>
          </div>
        </div>

        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 font-medium ${activeTab === 'info' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            基本信息
          </button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`px-4 py-2 font-medium ${activeTab === 'ratings' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            我的评分 ({myRatings.length})
          </button>
        </div>

        {activeTab === 'info' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">头像URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                disabled={!editing}
                placeholder="输入头像图片URL"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!editing}
                rows={3}
                placeholder="介绍一下自己..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white resize-none"
              />
            </div>
            <div className="flex gap-3">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setBio(user?.bio || '');
                      setEmail(user?.email || '');
                      setAvatarUrl(user?.avatar_url || '');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    取消
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  编辑
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ratings' && (
          <div className="space-y-3">
            {myRatings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">还没有评分</p>
            ) : (
              myRatings.map((rating) => (
                <div key={rating.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{rating.location}</p>
                    <p className="text-sm text-yellow-600">{renderStars(rating.score)}</p>
                    {rating.comment && <p className="text-sm text-gray-600 mt-1">{rating.comment}</p>}
                  </div>
                  <button
                    onClick={() => deleteRating(rating.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    删除
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
