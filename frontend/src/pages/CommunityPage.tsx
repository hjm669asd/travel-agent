import { useState, useEffect } from 'react';
import { diaryAPI, type DiaryListItem } from '../api/community';

interface CommunityPageProps {
  isLoggedIn: boolean;
  onNavigate: (page: string) => void;
}

export default function CommunityPage({ isLoggedIn, onNavigate }: CommunityPageProps) {
  const [diaries, setDiaries] = useState<DiaryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    loadDiaries();
  }, []);

  const loadDiaries = async () => {
    setLoading(true);
    try {
      const data = await diaryAPI.getAll({ page_size: 20 });
      setDiaries(data);
    } catch (error) {
      console.error('加载日记失败:', error);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!locationFilter.trim()) {
      loadDiaries();
      return;
    }
    setLoading(true);
    try {
      const data = await diaryAPI.getAll({ location: locationFilter });
      setDiaries(data);
    } catch (error) {
      console.error('搜索失败:', error);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📝 旅行日记社区</h2>
        {isLoggedIn && (
          <button
            onClick={() => onNavigate('create-diary')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            ✍️ 写日记
          </button>
        )}
      </div>

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="搜索地点..."
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          搜索
        </button>
      </div>

      {!isLoggedIn && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-amber-800">
            登录后可以发布日记、点赞和评论哦！
            <button
              onClick={() => onNavigate('login')}
              className="ml-2 text-indigo-600 hover:underline"
            >
              立即登录
            </button>
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      ) : diaries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-600">还没有人发布日记</p>
          {isLoggedIn && (
            <button
              onClick={() => onNavigate('create-diary')}
              className="mt-4 text-indigo-600 hover:underline"
            >
              成为第一个分享者
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diaries.map((diary) => (
            <div
              key={diary.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
              onClick={() => onNavigate(`diary-${diary.id}`)}
            >
              {diary.cover_image && (
                <img
                  src={diary.cover_image}
                  alt={diary.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-2 truncate">{diary.title}</h3>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span className="mr-3">📍 {diary.location}</span>
                  <span>📅 {diary.travel_date}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                      {diary.author_avatar ? (
                        <img src={diary.author_avatar} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        <span className="text-xs">{diary.author_username[0]}</span>
                      )}
                    </div>
                    <span>{diary.author_username}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>👁️ {diary.view_count}</span>
                    <span>❤️ {diary.like_count}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
