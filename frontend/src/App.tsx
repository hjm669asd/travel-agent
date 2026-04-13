import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TravelAgentPage from './pages/TravelAgentPage';
import CommunityPage from './pages/CommunityPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import CreateDiaryPage from './pages/CreateDiaryPage';
import DiaryDetailPage from './pages/DiaryDetailPage';
import { authAPI } from './api/community';

function App() {
  const [currentPage, setCurrentPage] = useState('travel');
  const [selectedDiaryId, setSelectedDiaryId] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userData = await authAPI.getMe();
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('access_token');
      }
    }
    setLoading(false);
  };

  const handleLoginSuccess = () => {
    checkAuth();
    setCurrentPage('community');
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setCurrentPage('travel');
  };

  const handleNavigate = (page: string) => {
    if (page.startsWith('diary-')) {
      const diaryId = parseInt(page.replace('diary-', ''));
      setSelectedDiaryId(diaryId);
      setCurrentPage('diary-detail');
    } else {
      setSelectedDiaryId(null);
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌍</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'travel':
        return <TravelAgentPage />;
      case 'community':
        return <CommunityPage isLoggedIn={!!user} onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage user={user} onUpdateUser={checkAuth} />;
      case 'admin':
        return user?.is_admin ? <AdminPage user={user} /> : <CommunityPage isLoggedIn={!!user} onNavigate={handleNavigate} />;
      case 'create-diary':
        return <CreateDiaryPage onSuccess={() => handleNavigate('community')} onCancel={() => handleNavigate('community')} />;
      case 'diary-detail':
        return selectedDiaryId ? (
          <DiaryDetailPage
            diaryId={selectedDiaryId}
            onBack={() => handleNavigate('community')}
            onLoginRequired={() => handleNavigate('login')}
            isLoggedIn={!!user}
          />
        ) : (
          <CommunityPage isLoggedIn={!!user} onNavigate={handleNavigate} />
        );
      default:
        return <TravelAgentPage />;
    }
  };

  return (
    <Layout
      currentPage={currentPage === 'diary-detail' ? 'community' : currentPage}
      onNavigate={handleNavigate}
      user={user}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;
