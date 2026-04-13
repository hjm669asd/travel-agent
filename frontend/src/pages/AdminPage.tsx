import { useState, useEffect } from 'react';
import { adminAPI } from '../api/community';
import type { DiaryListItem } from '../api/community';

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

interface AdminPageProps {
  user: any;
}

export default function AdminPage({ user }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'diaries'>('diaries');
  const [users, setUsers] = useState<User[]>([]);
  const [diaries, setDiaries] = useState<DiaryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const data = await adminAPI.getAllUsers({ page_size: 100 });
        setUsers(data);
      } else {
        const data = await adminAPI.getAllDiaries({ page_size: 100 });
        setDiaries(data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定删除该用户吗？该操作不可撤销！')) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleDeleteDiary = async (diaryId: number) => {
    if (!confirm('确定删除该日记吗？该操作不可撤销！')) return;
    try {
      await adminAPI.deleteDiary(diaryId);
      setDiaries(diaries.filter(d => d.id !== diaryId));
    } catch (error) {
      alert('删除失败');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ 管理后台</h2>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('diaries')}
            className={`px-4 py-2 font-medium ${activeTab === 'diaries' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            📝 日记管理 ({diaries.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium ${activeTab === 'users' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            👥 用户管理 ({users.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-3xl mb-4">⏳</div>
            <p className="text-gray-600">加载中...</p>
          </div>
        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">邮箱</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">角色</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">注册时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{u.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.is_admin ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">管理员</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">用户</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">正常</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">禁用</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {user.id !== u.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">标题</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">作者</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">地点</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">浏览</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">点赞</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">发布时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {diaries.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{d.id}</td>
                    <td className="px-4 py-3 text-sm font-medium max-w-xs truncate">{d.title}</td>
                    <td className="px-4 py-3 text-sm">{d.author_username}</td>
                    <td className="px-4 py-3 text-sm">{d.location}</td>
                    <td className="px-4 py-3 text-sm">{d.view_count}</td>
                    <td className="px-4 py-3 text-sm">{d.like_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteDiary(d.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
