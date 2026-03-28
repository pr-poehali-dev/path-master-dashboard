import { useState, useEffect } from 'react';
import StarField from '@/components/StarField';
import AuthPage from '@/components/AuthPage';
import Sidebar, { Section } from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import SitesManager from '@/components/SitesManager';
import QuestEditor from '@/components/QuestEditor';
import MembersManager from '@/components/MembersManager';
import Achievements from '@/components/Achievements';
import Cabinet from '@/components/Cabinet';
import { getSession, logout, Session } from '@/lib/auth';

export default function Index() {
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [section, setSection] = useState<Section>('dashboard');

  useEffect(() => {
    if (!session) setSection('dashboard');
  }, [session]);

  const handleLogout = () => {
    logout();
    setSession(null);
  };

  if (!session) {
    return <AuthPage onAuth={() => setSession(getSession())} />;
  }

  const renderContent = () => {
    switch (section) {
      case 'dashboard': return <Dashboard session={session} onNav={setSection} />;
      case 'sites': return <SitesManager session={session} />;
      case 'quest-editor': return <QuestEditor />;
      case 'members': return <MembersManager session={session} />;
      case 'achievements': return <Achievements />;
      case 'cabinet': return <Cabinet session={session} onSessionUpdate={setSession} />;
      default: return <Dashboard session={session} onNav={setSection} />;
    }
  };

  return (
    <div className="flex min-h-screen relative">
      <StarField />
      <div className="relative z-10 flex w-full">
        <Sidebar session={session} active={section} onNav={setSection} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto min-h-screen">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
