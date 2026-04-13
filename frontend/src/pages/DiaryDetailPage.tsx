import { useState, useEffect } from 'react';
import { diaryAPI, type Diary } from '../api/community';

interface DiaryDetailPageProps {
  diaryId: number;
  onBack: () => void;
  onLoginRequired: () => void;
  isLoggedIn: boolean;
}

export default function DiaryDetailPage({ diaryId, onBack, onLoginRequired, isLoggedIn }: DiaryDetailPageProps) {
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    loadDiary();
  }, [diaryId]);

  const loadDiary = async () => {
    setLoading(true);
    try {
      const data = await diaryAPI.getOne(diaryId);
      setDiary(data);
    } catch (error) {
      console.error('加载日记失败:', error);
    }
    setLoading(false);
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    try {
      const result = await diaryAPI.like(diaryId);
      setLiked(result.liked);
      setDiary(prev => prev ? { ...prev, like_count: result.like_count } : null);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  if (!diary) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">日记不存在</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 hover:underline">返回</button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
      >
        <span className="mr-1">←</span> 返回列表
      </button>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">{diary.title}</h1>
          <button
            onClick={handleLike}
            className={`px-4 py-2 rounded-lg transition ${liked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
          >
            ❤️ {diary.like_count}
          </button>
        </div>

        <div className="flex items-center text-sm text-gray-500 mb-6">
          <span className="mr-4">📍 {diary.location}</span>
          <span className="mr-4">📅 {diary.travel_date}</span>
          <span>👁️ {diary.view_count} 次浏览</span>
        </div>

        {diary.images && diary.images.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {diary.images.map((img, idx) => (
              <img
                key={idx}
                src={img.image_url}
                alt=""
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        <div className="prose max-w-none">
          <pre className="text-gray-700 whitespace-pre-wrap font-sans text-sm leading-relaxed">{diary.content}</pre>
        </div>

        <div className="mt-6 pt-6 border-t text-sm text-gray-500">
          作者：{diary.author_username}
        </div>
      </div>
    </div>
  );
}
