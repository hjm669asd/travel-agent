import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { createTravelPlan } from '../api';
import { travelAPI } from '../api/community';
import type { TravelResponse, TravelRequest } from '../types';

// 装饰性小元素组件
const FloatingElements = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <div className="absolute top-20 left-10 text-4xl opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>🌸</div>
    <div className="absolute top-40 right-20 text-3xl opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>✨</div>
    <div className="absolute top-60 left-1/4 text-2xl opacity-20 animate-ping" style={{ animationDuration: '5s' }}>⭐</div>
    <div className="absolute bottom-40 right-1/4 text-3xl opacity-15 animate-bounce" style={{ animationDuration: '3.5s' }}>🌙</div>
    <div className="absolute bottom-60 left-20 text-2xl opacity-20 animate-pulse" style={{ animationDuration: '4.5s' }}>☁️</div>
    <div className="absolute top-1/3 right-10 text-2xl opacity-15 animate-bounce" style={{ animationDuration: '6s' }}>💫</div>
    <div className="absolute bottom-1/3 left-10 text-3xl opacity-10 animate-ping" style={{ animationDuration: '7s' }}>🌺</div>
    <div className="absolute top-1/2 left-1/2 text-4xl opacity-10 animate-pulse" style={{ animationDuration: '8s' }}>💕</div>
  </div>
);

// 可爱的小卡片装饰
const CardDecoration = () => (
  <div className="absolute -top-2 -right-2 text-xl">✨</div>
);

// 加载动画组件
const CuteLoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-8">
    <div className="relative">
      <div className="text-6xl animate-bounce" style={{ animationDuration: '1s' }}>🌍</div>
      <div className="absolute -top-1 -right-1 text-lg animate-ping" style={{ animationDuration: '2s' }}>✨</div>
      <div className="absolute -bottom-1 -left-1 text-sm animate-pulse" style={{ animationDuration: '1.5s' }}>⭐</div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      <span className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>🧳</span>
      <span className="text-gray-600 font-medium">AI 正在为您规划完美的旅行行程</span>
      <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎒</span>
    </div>
    <div className="mt-3 flex gap-1">
      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  </div>
);

const SAMPLE_QUERIES = [
  '帮我规划5天4晚成都旅行，预算8000元，喜欢美食和大熊猫',
  '3天2晚厦门旅行，预算5000元，喜欢海边和文艺',
  '计划7天6晚云南之旅，预算12000元，喜欢自然风光',
];

interface SavedPlan {
  id: number;
  query: string;
  plan_data: TravelResponse;
  created_at: string;
}

export default function TravelAgentPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TravelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState(0);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const planRef = useRef<HTMLDivElement>(null);
  const currentQuery = useRef('');

  const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  const toChineseNumber = (num: number): string => {
    if (num <= 10) return chineseNumbers[num];
    if (num < 20) return '十' + (num > 10 ? chineseNumbers[num - 10] : '');
    const tens = chineseNumbers[Math.floor(num / 10)];
    const ones = chineseNumbers[num % 10];
    return tens + (ones !== '零' ? ones : '');
  };

  const chineseToNumber = (str: string): number => {
    if (/^\d+$/.test(str)) return parseInt(str);
    const map: Record<string, number> = { '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
    let result = 0;
    let multiplier = 1;

    for (let i = str.length - 1; i >= 0; i--) {
      const char = str[i];
      if (char === '十') {
        multiplier = 10;
      } else if (char === '百') {
        multiplier = 100;
      } else if (map[char] !== undefined) {
        result += map[char] * multiplier;
        multiplier = 1;
      }
    }
    return result;
  };

  const getDayItinerary = (markdown: string, day: number): string => {
    const lines = markdown.split('\n');
    const resultLines: string[] = [];
    let found = false;
    let inTargetDay = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dayMatch = line.match(/第(\d+)天|第([一二三四五六七八九十]+)天/);

      if (dayMatch) {
        const dayNum = dayMatch[1] ? parseInt(dayMatch[1]) : chineseToNumber(dayMatch[2]);
        if (dayNum === day) {
          inTargetDay = true;
          found = true;
          resultLines.push(line);
        } else if (inTargetDay) {
          break;
        }
      } else if (inTargetDay) {
        resultLines.push(line);
      }
    }

    return found ? resultLines.join('\n') : '';
  };

  const loadSavedPlans = async () => {
    try {
      const plans = await travelAPI.getSavedPlans();
      setSavedPlans(plans);
    } catch (e) {
      console.error('加载保存的计划失败', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setRequestId(prev => prev + 1);
    currentQuery.current = query.trim();
    setShowSaved(false);

    try {
      const request: TravelRequest = {
        query: query.trim(),
      };
      const data = await createTravelPlan(request);
      setResult(data);
      setSelectedDay(null);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(`请求失败: ${err.message}`);
      } else {
        setError('生成旅行计划时发生未知错误');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await travelAPI.savePlan(currentQuery.current, result);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      alert('保存失败，请先登录');
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.markdown_itinerary);
      alert('已复制到剪贴板！');
    } catch (e) {
      alert('复制失败');
    }
  };

  const handleSaveAsImage = async () => {
    if (!planRef.current) return;
    try {
      const canvas = await html2canvas(planRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `旅行计划_${result?.intent.destination}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      alert('保存图片失败');
    }
  };

  const handleViewSaved = async () => {
    await loadSavedPlans();
    setShowSaved(true);
  };

  const handleLoadSavedPlan = (plan: SavedPlan) => {
    setResult(plan.plan_data);
    setQuery(plan.query);
    currentQuery.current = plan.query;
    setShowSaved(false);
  };

  const handleDeleteSavedPlan = async (planId: number) => {
    if (!confirm('确定删除这个保存的计划吗？')) return;
    try {
      await travelAPI.deleteSavedPlan(planId);
      setSavedPlans(savedPlans.filter(p => p.id !== planId));
    } catch (e) {
      alert('删除失败');
    }
  };

  const handleSampleClick = (sample: string) => {
    setQuery(sample);
  };

  return (
    <div className="relative">
      <FloatingElements />
      <div className="relative z-10 space-y-6">
        {/* 页面标题装饰 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-4xl font-bold">
            <span className="animate-bounce inline-block" style={{ animationDuration: '2s' }}>✈️</span>
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              AI 旅行规划助手
            </span>
            <span className="animate-bounce inline-block" style={{ animationDuration: '2s', animationDelay: '0.3s' }}>🎒</span>
          </div>
          <p className="text-gray-500 mt-2 text-sm">✨ 让每一次旅行都充满惊喜 ✨</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          <CardDecoration />
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">🗺️</span> 规划您的完美旅程
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">💡</span> 旅行需求描述
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="例如：帮我规划5天4晚东京旅行，预算8000元，喜欢动漫和美食 🎌"
                rows={3}
                className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none transition-all resize-none bg-white/70"
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span className="text-lg">💭</span> 示例需求：
                {SAMPLE_QUERIES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSampleClick(sample)}
                    className="ml-2 px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-600 hover:from-indigo-200 hover:to-purple-200 rounded-full text-xs font-medium hover:shadow-md transition-all"
                  >
                    样例{idx + 1} ✨
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleViewSaved}
                  className="px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-medium rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <span>📁</span> 我的保存 <span className="text-xs">💾</span>
                </button>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">🌍</span>
                      <span>生成中...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>生成旅行计划</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

      {showSaved && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-teal-400 to-cyan-400"></div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📁</span> 保存的旅行计划
              <span className="text-sm text-gray-500 font-normal">💾</span>
            </h3>
            <button onClick={() => setShowSaved(false)} className="text-gray-400 hover:text-gray-600 text-2xl hover:rotate-90 transition-all">×</button>
          </div>
          {savedPlans.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎒</div>
              <p className="text-gray-500">暂无保存的计划</p>
              <p className="text-sm text-gray-400 mt-2">开始规划您的第一次旅行吧！✈️</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedPlans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl hover:shadow-lg transition-all border border-green-100">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                      <span>🗺️</span> {plan.query}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <span>📅</span> {new Date(plan.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadSavedPlan(plan)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg flex items-center gap-1"
                    >
                      <span>👀</span> 查看
                    </button>
                    <button
                      onClick={() => handleDeleteSavedPlan(plan.id)}
                      className="px-4 py-2 bg-gradient-to-r from-red-100 to-pink-100 text-red-600 text-sm rounded-xl hover:from-red-200 hover:to-pink-200 transition-all flex items-center gap-1"
                    >
                      <span>🗑️</span> 删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">😢</span>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"></div>
          <CuteLoadingSpinner />
        </div>
      )}

      {result && !loading && (
        <div key={requestId} ref={planRef} className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📋</span> 旅行基本信息
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className={`px-4 py-2 text-sm rounded-xl transition-all flex items-center gap-1 shadow-md hover:shadow-lg ${
                    saveSuccess
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-600'
                      : 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-600 hover:from-indigo-200 hover:to-purple-200'
                  }`}
                >
                  {saveSuccess ? '✓ 已保存' : '💾 保存'}
                </button>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-600 text-sm rounded-xl hover:from-indigo-200 hover:to-purple-200 transition-all shadow-md hover:shadow-lg flex items-center gap-1"
                >
                  📋 复制
                </button>
                <button
                  onClick={handleSaveAsImage}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-600 text-sm rounded-xl hover:from-indigo-200 hover:to-purple-200 transition-all shadow-md hover:shadow-lg flex items-center gap-1"
                >
                  🖼️ 保存图片
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 text-center hover:shadow-lg transition-all border border-blue-100">
                <div className="text-3xl mb-2">🗾</div>
                <div className="text-xs text-gray-500 font-medium">目的地</div>
                <div className="font-bold text-indigo-700 text-lg">{result.intent.destination}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 text-center hover:shadow-lg transition-all border border-green-100">
                <div className="text-3xl mb-2">📅</div>
                <div className="text-xs text-gray-500 font-medium">行程天数</div>
                <div className="font-bold text-green-700 text-lg">{result.intent.days}天{result.intent.nights}晚</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl p-4 text-center hover:shadow-lg transition-all border border-yellow-100">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-xs text-gray-500 font-medium">预算</div>
                <div className="font-bold text-orange-700 text-lg">¥{result.intent.budget.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-2xl p-4 text-center hover:shadow-lg transition-all border border-pink-100">
                <div className="text-3xl mb-2">❤️</div>
                <div className="text-xs text-gray-500 font-medium">偏好</div>
                <div className="font-bold text-pink-700 text-sm">
                  {result.intent.preferences.length > 0 ? result.intent.preferences.join(', ') : '无'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">💵</span> 预算分配
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(result.budget_breakdown.daily_breakdown).map(([key, value]) => (
                <div key={key} className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 text-center hover:shadow-lg transition-all border border-green-100">
                  <div className="text-2xl mb-2">
                    {key === '餐饮' ? '🍜' : key === '交通' ? '🚇' : key === '景点门票' ? '🎫' : '🛍️'}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">{key}</div>
                  <div className="font-bold text-green-700 text-lg">¥{Number(value).toFixed(0)}/天</div>
                </div>
              ))}
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-4 text-center hover:shadow-lg transition-all border border-purple-100">
                <div className="text-2xl mb-2">🏨</div>
                <div className="text-xs text-gray-500 font-medium">住宿</div>
                <div className="font-bold text-purple-700 text-lg">¥{Number(result.budget_breakdown.accommodation_per_night).toFixed(0)}/晚</div>
              </div>
            </div>
          </div>

          {result.current_weather && (
            <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400"></div>
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-2xl">🌤️</span> 天气信息
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-6xl">
                    {result.current_weather.text === '晴' ? '☀️' :
                     result.current_weather.text === '多云' ? '⛅' :
                     result.current_weather.text.includes('雨') ? '🌧️' :
                     result.current_weather.text.includes('雪') ? '❄️' : '🌤️'}
                  </span>
                  <div>
                    <div className="text-4xl font-bold text-gray-800">{result.current_weather.temperature}°C</div>
                    <div className="text-gray-600 flex items-center gap-1">
                      <span>{result.current_weather.text}</span>
                      <span className="text-sm">🌡️</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500 space-y-1">
                  <div className="flex items-center gap-2 justify-end">
                    <span>💧</span>
                    <span>湿度: {result.current_weather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span>🍃</span>
                    <span>{result.current_weather.wind_direction} {result.current_weather.wind_scale}级</span>
                  </div>
                </div>
              </div>
              {result.forecast && result.forecast.length > 0 && (
                <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
                  {result.forecast.map((day, idx) => (
                    <div key={idx} className="flex-shrink-0 bg-white/80 backdrop-blur rounded-2xl p-4 text-center min-w-[110px] hover:shadow-lg transition-all border border-blue-100">
                      <div className="text-xs text-gray-500 font-medium mb-2">
                        {idx === 0 ? '今天 🌟' : idx === 1 ? '明天 ✨' : `第${idx + 1}天`}
                      </div>
                      <div className="text-2xl my-2">
                        {day.text_day === '晴' ? '☀️' : day.text_day === '多云' ? '⛅' : day.text_day.includes('雨') ? '🌧️' : '🌤️'}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">{day.low}° ~ {day.high}°</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {result.city_info && (
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400"></div>
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-2xl">📖</span> {result.intent.destination}城市介绍
              </h2>
              <div className="space-y-4">
                <div className="bg-white/80 backdrop-blur rounded-2xl p-5 hover:shadow-lg transition-all border border-amber-100">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-xl">🏛️</span> 历史简介
                    <span className="text-xs text-gray-400">✨</span>
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{result.city_info.history}</p>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-2xl p-5 hover:shadow-lg transition-all border border-amber-100">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-xl">🍜</span> 特色美食
                    <span className="text-xs text-gray-400">😋</span>
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{result.city_info.food}</p>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-2xl p-5 hover:shadow-lg transition-all border border-amber-100">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-xl">🗺️</span> 特色景点
                    <span className="text-xs text-gray-400">🏰</span>
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{result.city_info.attractions}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">🚇</span> 每日交通建议
            </h2>
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => setSelectedDay(null)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
                  selectedDay === null
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
              >
                <span>📋</span> 全部显示
              </button>
              {result.day_plans.map((dayPlan) => (
                <button
                  key={dayPlan.day}
                  onClick={() => setSelectedDay(dayPlan.day)}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
                    selectedDay === dayPlan.day
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                      : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                >
                  <span>📅</span> 第{dayPlan.day}天
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {result.day_plans
                .filter(dayPlan => selectedDay === null || selectedDay === dayPlan.day)
                .map((dayPlan) => (
                <div key={dayPlan.day} className="bg-white/80 backdrop-blur rounded-2xl p-5 hover:shadow-lg transition-all border border-teal-100">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="text-xl">📅</span> 第{dayPlan.day}天
                    <span className="text-sm text-gray-400">🗓️</span>
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {dayPlan.morning_transport && (
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 hover:shadow-md transition-all border border-blue-100">
                        <div className="text-xs text-blue-500 mb-2 font-semibold flex items-center gap-1">
                          <span>🌅</span> 上午出行
                        </div>
                        <div className="font-bold text-blue-800 mb-2">{dayPlan.morning_transport.method}</div>
                        <div className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                          <span>📍</span> {dayPlan.morning_transport.from_place} → {dayPlan.morning_transport.to_place}
                        </div>
                        <div className="text-xs text-blue-500 flex items-center gap-2">
                          <span>⏱️</span> {dayPlan.morning_transport.duration}
                          <span>💰</span> {dayPlan.morning_transport.cost}
                        </div>
                        {dayPlan.morning_transport.tips && (
                          <div className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                            <span>💡</span> {dayPlan.morning_transport.tips}
                          </div>
                        )}
                      </div>
                    )}
                    {dayPlan.afternoon_transport && (
                      <div className="bg-gradient-to-br from-orange-50 to-yellow-100 rounded-xl p-4 hover:shadow-md transition-all border border-orange-100">
                        <div className="text-xs text-orange-500 mb-2 font-semibold flex items-center gap-1">
                          <span>🌞</span> 下午出行
                        </div>
                        <div className="font-bold text-orange-800 mb-2">{dayPlan.afternoon_transport.method}</div>
                        <div className="text-xs text-orange-600 mb-1 flex items-center gap-1">
                          <span>📍</span> {dayPlan.afternoon_transport.from_place} → {dayPlan.afternoon_transport.to_place}
                        </div>
                        <div className="text-xs text-orange-500 flex items-center gap-2">
                          <span>⏱️</span> {dayPlan.afternoon_transport.duration}
                          <span>💰</span> {dayPlan.afternoon_transport.cost}
                        </div>
                        {dayPlan.afternoon_transport.tips && (
                          <div className="text-xs text-orange-400 mt-2 flex items-center gap-1">
                            <span>💡</span> {dayPlan.afternoon_transport.tips}
                          </div>
                        )}
                      </div>
                    )}
                    {dayPlan.evening_transport && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-4 hover:shadow-md transition-all border border-purple-100">
                        <div className="text-xs text-purple-500 mb-2 font-semibold flex items-center gap-1">
                          <span>🌙</span> 晚上出行
                        </div>
                        <div className="font-bold text-purple-800 mb-2">{dayPlan.evening_transport.method}</div>
                        <div className="text-xs text-purple-600 mb-1 flex items-center gap-1">
                          <span>📍</span> {dayPlan.evening_transport.from_place} → {dayPlan.evening_transport.to_place}
                        </div>
                        <div className="text-xs text-purple-500 flex items-center gap-2">
                          <span>⏱️</span> {dayPlan.evening_transport.duration}
                          <span>💰</span> {dayPlan.evening_transport.cost}
                        </div>
                        {dayPlan.evening_transport.tips && (
                          <div className="text-xs text-purple-400 mt-2 flex items-center gap-1">
                            <span>💡</span> {dayPlan.evening_transport.tips}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🎯</span> 推荐景点 & 餐厅
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2 text-lg">
                  <span className="text-2xl">🏰</span> 推荐景点
                  <span className="text-sm text-pink-400">✨</span>
                </h3>
                <div className="space-y-4">
                  {result.attractions.map((attraction, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all border border-blue-100">
                      {attraction.image_url && (
                        <img
                          src={attraction.image_url}
                          alt={attraction.name}
                          className="w-full h-36 object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-bold text-blue-800 text-lg flex items-center gap-2">
                              <span>🏰</span> {attraction.name}
                            </div>
                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <span>📍</span> {attraction.address}
                            </div>
                          </div>
                          {attraction.rating && (
                            <span className="text-yellow-500 text-sm flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                              <span>⭐</span> {attraction.rating}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-blue-500 mt-3 leading-relaxed">{attraction.description}</div>
                        {attraction.amap_url && (
                          <a
                            href={attraction.amap_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center mt-3 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full transition-all hover:shadow-md"
                          >
                            <span className="mr-1">📍</span> 在高德地图中查看 <span className="ml-1">→</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2 text-lg">
                  <span className="text-2xl">🍽️</span> 推荐餐厅
                  <span className="text-sm text-orange-400">😋</span>
                </h3>
                <div className="space-y-4">
                  {result.restaurants.map((restaurant, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-orange-50 to-yellow-100 rounded-2xl p-4 hover:shadow-lg transition-all border border-orange-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-orange-800 text-lg flex items-center gap-2">
                            <span>🍽️</span> {restaurant.name}
                          </div>
                          <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                            <span>📍</span> {restaurant.address}
                          </div>
                        </div>
                        <span className="text-green-600 text-sm bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                          <span>💰</span> {restaurant.price_range}
                        </span>
                      </div>
                      <div className="text-xs text-orange-500 mt-3 flex items-center gap-1">
                        <span>🍜</span> 菜系: {restaurant.cuisine}
                      </div>
                      {restaurant.amap_url && (
                        <a
                          href={restaurant.amap_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center mt-3 text-xs text-orange-600 hover:text-orange-800 bg-orange-50 px-3 py-1.5 rounded-full transition-all hover:shadow-md"
                        >
                          <span className="mr-1">📍</span> 在高德地图中查看 <span className="ml-1">→</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📝</span> 完整行程表（Markdown）
              </h2>
              <button
                onClick={handleCopy}
                className="px-5 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm rounded-xl hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <span>📋</span> 复制行程
              </button>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => setSelectedDay(null)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
                  selectedDay === null
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
              >
                <span>📋</span> 全部显示
              </button>
              {result.day_plans.map((dayPlan) => (
                <button
                  key={dayPlan.day}
                  onClick={() => setSelectedDay(dayPlan.day)}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
                    selectedDay === dayPlan.day
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                      : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                >
                  <span>📅</span> 第{toChineseNumber(dayPlan.day)}天
                </button>
              ))}
            </div>
            <div className="markdown-body bg-white/50 backdrop-blur rounded-2xl p-6 border border-purple-100">
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-800 hover:underline">{children}</a>
                  )
                }}
              >
                {selectedDay === null
                  ? result.markdown_itinerary
                  : getDayItinerary(result.markdown_itinerary, selectedDay)
                }
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
