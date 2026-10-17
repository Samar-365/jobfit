import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { AnalyzeJobView } from './features/analysis/AnalyzeJobView';
import { ResumeView } from './features/resume/ResumeView';
import { ApplicationsView } from './features/applications/ApplicationsView';
import { SavedAnalysesView } from './features/analysis/SavedAnalysesView';
import { SettingsView } from './features/settings/SettingsView';
import { TailoringView } from './features/tailoring/TailoringView';
import { CoverLetterView } from './features/cover_letter/CoverLetterView';
import { getAIHealth } from './lib/api';
import type { AIHealth } from './lib/types';
import { Menu } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiHealth, setAiHealth] = useState<AIHealth | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(true);

  // Pre-filled context when navigating from analysis
  const [tailorContext, setTailorContext] = useState<{ bullet?: string; context?: string }>({});
  const [coverLetterContext, setCoverLetterContext] = useState<{ company?: string; role?: string }>({});

  const handleNavigateToTailor = (context: { bullet?: string; context?: string }) => {
    setTailorContext(context);
    setActiveTab('tailor');
  };

  const handleNavigateToCoverLetter = (context: { company?: string; role?: string }) => {
    setCoverLetterContext(context);
    setActiveTab('cover_letter');
  };

  const fetchHealth = useCallback(async () => {
    setLoadingAi(true);
    try {
      const data = await getAIHealth();
      setAiHealth(data);
    } catch {
      setAiHealth({
        status: 'unavailable',
        ollama_url: 'http://localhost:11434',
        target_model: 'gemma2:2b',
        is_target_model_installed: false,
        is_model_running_in_gpu: false,
        available_models: [],
        error_message: 'Could not connect to FastAPI backend on port 8000.',
        latency_ms: null,
      });
    } finally {
      setLoadingAi(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const getPageHeader = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Career Dashboard',
          subtitle: 'Welcome to JobFit. Your private, local-first AI career copilot.',
        };
      case 'analyze':
        return {
          title: 'Analyze Job Match',
          subtitle: 'Match requirements against your resume with evidence-backed citations.',
        };
      case 'resume':
        return {
          title: 'My Resume & Skills',
          subtitle: 'Manage local career documents and structured competencies.',
        };
      case 'tailor':
        return {
          title: 'Truthful Resume Tailoring',
          subtitle: 'Rephrase bullets to align with target jobs without fabricating achievements.',
        };
      case 'cover_letter':
        return {
          title: 'Grounded Cover Letter Drafter',
          subtitle: 'Generate honest cover letters with strict bracketed placeholders for personal motivation.',
        };
      case 'applications':
        return {
          title: 'Application Pipeline',
          subtitle: 'Track application stages from Saved to Offer with local persistence.',
        };
      case 'saved':
        return {
          title: 'Saved Match Analyses',
          subtitle: 'Revisit previous job analyses, requirement scores, and tailored notes.',
        };
      case 'settings':
        return {
          title: 'Settings & Local Privacy',
          subtitle: 'Configure local Gemma models, Ollama endpoints, and storage policies.',
        };
    }
  };

  const header = getPageHeader();

  return (
    <div className="app-container">
      {/* Mobile Topbar */}
      <div className="mobile-topbar">
        <strong style={{ fontSize: '1.1rem' }}>JobFit</strong>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
          aria-label="Toggle Navigation"
        >
          <Menu style={{ width: '22px', height: '22px' }} />
        </button>
      </div>

      {/* Dark Charcoal Navigation Sidebar (#24222D) with Soft-Lime Active Indicator */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Header with Title and Local AI Status */}
        <Header
          title={header.title}
          subtitle={header.subtitle}
          aiHealth={aiHealth}
          loadingAi={loadingAi}
          onRefreshAi={fetchHealth}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Tab Routing */}
        {activeTab === 'overview' && (
          <DashboardOverview aiHealth={aiHealth} onNavigate={setActiveTab} />
        )}

        {activeTab === 'analyze' && (
          <AnalyzeJobView
            onBack={() => setActiveTab('overview')}
            onNavigateToResume={() => setActiveTab('resume')}
            onNavigateToTailor={handleNavigateToTailor}
            onNavigateToCoverLetter={handleNavigateToCoverLetter}
          />
        )}

        {activeTab === 'resume' && (
          <ResumeView onBack={() => setActiveTab('overview')} />
        )}

        {activeTab === 'tailor' && (
          <TailoringView
            initialBullet={tailorContext.bullet}
            initialContext={tailorContext.context}
          />
        )}

        {activeTab === 'cover_letter' && (
          <CoverLetterView
            initialCompany={coverLetterContext.company}
            initialRole={coverLetterContext.role}
          />
        )}

        {activeTab === 'applications' && <ApplicationsView />}

        {activeTab === 'saved' && (
          <SavedAnalysesView onAnalyzeNew={() => setActiveTab('analyze')} />
        )}

        {activeTab === 'settings' && (
          <SettingsView aiHealth={aiHealth} onRefreshAi={fetchHealth} />
        )}
      </main>
    </div>
  );
}

export default App;
