import { useState } from 'react';
import { ScormProvider } from '@studiolxd/scorm/react';
import type { ScormVersion } from '@studiolxd/scorm/react';
import { SessionContext, useSessionValue } from './SessionContext';
import { LifecycleSection } from './sections/LifecycleSection';
import { LearnerSection } from './sections/LearnerSection';
import { StatusSection } from './sections/StatusSection';
import { ScoreSection } from './sections/ScoreSection';
import { LocationSection } from './sections/LocationSection';
import { ObjectivesSection } from './sections/ObjectivesSection';
import { InteractionsSection } from './sections/InteractionsSection';
import { CommentsSection } from './sections/CommentsSection';
import { AdvancedSection } from './sections/AdvancedSection';
import { PlatformsSection } from './sections/PlatformsSection';
import './App.css';

export const TABS = [
  { id: 'lifecycle', label: 'Lifecycle', icon: '⏻' },
  { id: 'learner', label: 'Learner', icon: '◉' },
  { id: 'status', label: 'Status', icon: '◈' },
  { id: 'score', label: 'Score', icon: '◎' },
  { id: 'location', label: 'Location', icon: '◌' },
  { id: 'objectives', label: 'Objectives', icon: '◆' },
  { id: 'interactions', label: 'Interactions', icon: '◇' },
  { id: 'comments', label: 'Comments', icon: '◫' },
  { id: 'advanced', label: 'Advanced', icon: '⟡' },
  { id: 'platforms', label: 'Vanilla / WC', icon: '◐' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

interface ScormDemoShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

function ScormDemoShell({ activeTab, onTabChange }: ScormDemoShellProps) {
  const session = useSessionValue();

  return (
    <SessionContext.Provider value={session}>
    <div className="app-body">
      <nav className="tab-nav" aria-label="Demo sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="tab-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="tab-content" id="tab-panel" aria-label="Active section content">
        {activeTab === 'lifecycle' && <LifecycleSection />}
        {activeTab === 'learner' && <LearnerSection />}
        {activeTab === 'status' && <StatusSection />}
        {activeTab === 'score' && <ScoreSection />}
        {activeTab === 'location' && <LocationSection />}
        {activeTab === 'objectives' && <ObjectivesSection />}
        {activeTab === 'interactions' && <InteractionsSection />}
        {activeTab === 'comments' && <CommentsSection />}
        {activeTab === 'advanced' && <AdvancedSection />}
        {activeTab === 'platforms' && <PlatformsSection />}
      </main>
    </div>
    </SessionContext.Provider>
  );
}

export default function App() {
  const [version, setVersion] = useState<ScormVersion>('1.2');
  const [activeTab, setActiveTab] = useState<TabId>('lifecycle');

  const handleVersionChange = (v: ScormVersion) => {
    setVersion(v);
    setActiveTab('lifecycle');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">React SCORM</div>
        </div>

        <div className="app-header-right">
          <span className="version-label">SCORM version</span>
          <div className="version-toggle" role="group" aria-label="SCORM version selector">
            <button
              className={`version-btn${version === '1.2' ? ' active' : ''}`}
              onClick={() => handleVersionChange('1.2')}
              aria-pressed={version === '1.2'}
            >
              1.2
            </button>
            <button
              className={`version-btn${version === '2004' ? ' active' : ''}`}
              onClick={() => handleVersionChange('2004')}
              aria-pressed={version === '2004'}
            >
              2004
            </button>
          </div>

          <div className="mock-badge">
            <span className="mock-dot" />
            mock mode
          </div>
        </div>
      </header>

      {/*
        key={version} forces a fresh ScormProvider (and a fresh driver/session) when
        the version toggle changes — a terminated SCORM session cannot be re-initialized
        on the same driver, so remounting is the clean way to start over.
        debug is gated to dev so the production build stays quiet in the console.
      */}
      <ScormProvider
        key={version}
        version={version}
        options={{ noLmsBehavior: 'mock', debug: import.meta.env.DEV }}
      >
        <ScormDemoShell activeTab={activeTab} onTabChange={setActiveTab} />
      </ScormProvider>

      <footer className="app-footer">
        <a href="https://studiolxd.com" target="_blank" rel="noopener noreferrer">
          <img src="/logo.svg" alt="StudioLXD" className="footer-logo" />
        </a>
        <a
          href="https://github.com/studiolxd/react-scorm"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-github-link"
          aria-label="GitHub repository"
        >
          <svg className="footer-github-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
        </a>
      </footer>
    </div>
  );
}
