import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { AIStatusBanner } from './components/AIStatusBanner';
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { PlaceholderView } from './components/PlaceholderView';
import { getAIHealth } from './lib/api';
import type { AIHealth } from './lib/types';
import { Sparkles, FileText, Briefcase, History, Settings } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [aiHealth, setAiHealth] = useState<AIHealth | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(true);

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
          subtitle: 'Welcome to JobFit. Your local-first AI career copilot.',
        };
      case 'analyze':
        return {
          title: 'Analyze Job Opening',
          subtitle: 'Match requirements against your resume with evidence-backed citations.',
        };
      case 'resume':
        return {
          title: 'My Resume & Skills Profile',
          subtitle: 'Manage local career documents and structured skill extractions.',
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
      {/* Dark Charcoal Navigation Sidebar */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-bar">
          <div className="page-title">
            <h1>{header.title}</h1>
            <p>{header.subtitle}</p>
          </div>
        </header>

        {/* Dynamic AI Runtime Health Banner */}
        <AIStatusBanner
          health={aiHealth}
          loading={loadingAi}
          onRefresh={fetchHealth}
        />

        {/* Tab Routing */}
        {activeTab === 'overview' && (
          <DashboardOverview aiHealth={aiHealth} onNavigate={setActiveTab} />
        )}

        {activeTab === 'analyze' && (
          <PlaceholderView
            title="Evidence-Backed Job Matching"
            subtitle="Deep resume-to-job analysis with citation extraction"
            description="Extracts must-have requirements, correlates verifiable resume sentences, distinguishes unmentioned skills, and computes an honest deterministic score."
            icon={Sparkles}
            badge="Core Matching Engine"
            phase="Phase 3"
            onBack={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'resume' && (
          <PlaceholderView
            title="Local Resume Ingestion & Parsing"
            subtitle="Multi-format document parsing powered by Gemma"
            description="Supports PDF, DOCX, and TXT files. Extracts structured skills, experience, projects, and education into verifiable JSON with user correction controls."
            icon={FileText}
            badge="Document Pipeline"
            phase="Phase 2"
            onBack={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'applications' && (
          <PlaceholderView
            title="Local Application Tracker"
            subtitle="Persistent 7-stage job pipeline with CSV export"
            description="Manage roles across Saved, Preparing, Applied, Interview, Offer, Rejected, and Withdrawn. Connected directly to SQLite."
            icon={Briefcase}
            badge="Pipeline Management"
            phase="Phase 5"
            onBack={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'saved' && (
          <PlaceholderView
            title="Historical Analyses & Reports"
            subtitle="Audit log of all previous requirement evaluations"
            description="Review previous company matches, gap recommendations, tailored bullet suggestions, and drafted cover letters."
            icon={History}
            badge="History & Export"
            phase="Phase 3"
            onBack={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'settings' && (
          <PlaceholderView
            title="Ollama Runtime & Data Governance"
            subtitle="Local model selection, inference timeouts, and data deletion"
            description="Inspect active GPU memory, test custom Ollama endpoints, adjust temperature, or purge local SQLite records and uploaded files."
            icon={Settings}
            badge="Privacy & Governance"
            phase="Phase 6"
            onBack={() => setActiveTab('overview')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
