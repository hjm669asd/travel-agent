import { useState, useEffect } from 'react';
import { authAPI } from '../api/community';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigate: (page: string) => void;
}

const bgImages = [
  '/images/city.png',
  '/images/grassland.png',
  '/images/snow.png',
  '/images/ocean.png',
];

const subtitleText = [
  '旅途中，我们把生活暂时折进背包，像收起一张用旧的地图。',
  '陌生的街道、方言和炊烟，都成了重新认识自己的镜子。',
  '走累了就坐在异乡的石阶上，看云从故乡的方向飘来，又向未知的远方散去。',
  '渐渐地明白：希望从来不在终点那闪着光的胜地，',
  '而在每一次抬脚时，鞋底与泥土摩擦出的温度；',
  '在每一次迷路后，重新辨认星光的勇气。',
  '生活是永不停歇的行走，而希望，就是相信下一程会有更美的晚风。',
];

export default function LoginPage({ onLoginSuccess, onNavigate }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState(0);
  const [subtitleVisible, setSubtitleVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleVisible(false);
      setTimeout(() => {
        setCurrentSubtitle((prev) => (prev + 1) % subtitleText.length);
        setSubtitleVisible(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await authAPI.login(username, password);
        onLoginSuccess();
      } else {
        if (!email || !username || !password) {
          setError('请填写所有字段');
          setLoading(false);
          return;
        }
        await authAPI.register(username, email, password);
        await authAPI.login(username, password);
        onLoginSuccess();
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg || JSON.stringify(d)).join(', '));
      } else {
        setError('操作失败，请重试');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* 背景图片层 - 4个并排区域 */}
      <div className="absolute inset-0 flex">
        {bgImages.map((img, index) => (
          <div
            key={index}
            className="w-1/4 h-full relative overflow-hidden"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${img})`,
              }}
            />
            {index < 3 && (
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-r from-transparent to-black/20" />
            )}
          </div>
        ))}
      </div>

      {/* 整体遮罩 */}
      <div className="absolute inset-0 bg-black/30" />

      {/* 字幕式文字展示 - 电影字幕风格 */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <div
          className={`max-w-2xl px-8 text-center transition-all duration-500 ${
            subtitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-6 py-3 inline-block">
            <p className="text-white text-lg font-light leading-relaxed tracking-wide drop-shadow-lg">
              {subtitleText[currentSubtitle]}
            </p>
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            {subtitleText.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSubtitle ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 登录表单卡片 */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md transition-all duration-500 hover:shadow-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🗺️ 旅行计划</h1>
          <p className="text-gray-600">{isLogin ? '欢迎回来旅行者' : '开启你的旅程'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="请输入用户名"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="请输入邮箱"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {loading ? '🌍 旅途中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {isLogin ? '还没有账户？' : '已有账户？'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-indigo-600 hover:underline font-medium"
            >
              {isLogin ? '立即注册' : '去登录'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
