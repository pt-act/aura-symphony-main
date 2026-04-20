import c from 'classnames';
import React, {useEffect, useState} from 'react';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
} from './api/firebase';
import IngestionScreen from './components/analysis/IngestionScreen';
import LensLaboratory from './components/analysis/LensLaboratory';
import Timeline from './components/analysis/Timeline';
import VideoControls from './components/analysis/VideoControls';
import ConductorInput from './components/conductor/ConductorInput';
import CourseView from './components/course/CourseView';
import CreatorStudio from './components/creator/CreatorStudio';
import LibraryModal from './components/creator/LibraryModal';
import OrchestraVisualizer from './components/shared/OrchestraVisualizer';
import HelpModal from './components/shared/HelpModal';
import SettingsModal from './components/settings/SettingsModal';
import LiveConversation from './components/shared/LiveConversation';
import ShareModal from './components/shared/ShareModal';
import ValhallaGateway from './components/valhalla/ValhallaGateway';
import ExportNLEModal from './components/analysis/ExportNLEModal';
import CustomVirtuosoBuilder from './components/virtuosos/CustomVirtuosoBuilder';
import {Events, symphonyBus} from './lib/symphonyBus';
import {handleExportNLE} from './lib/nleExport';
import {useAnalysisState} from './hooks/useAnalysisState';
import {useCreatorState} from './hooks/useCreatorState';
import {useCustomVirtuosos} from './hooks/useCustomVirtuosos';
import {useAppModals} from './hooks/useAppModals';
import {useKeyboardActivator, useScreenReaderAnnouncer} from './lib/a11y';
import {Settings} from 'lucide-react';

export default function Workspace() {
  // App State
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [currentView, setCurrentView] = useState<'analysis' | 'creator'>('analysis');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State (extracted hook)
  const modals = useAppModals();
  const announce = useScreenReaderAnnouncer();

  const {customVirtuosos, saveCustomVirtuoso, deleteCustomVirtuoso} = useCustomVirtuosos(user);

  const {
    presentation,
    setPresentation,
    activeSlideIndex,
    setActiveSlideIndex,
    handleSendToCreator,
    handleNewPresentation,
    handleLoadPresentation,
  } = useCreatorState(user, setCurrentView);

  const {
    videoUrl,
    insights,
    setInsights,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    selectionStart,
    setSelectionStart,
    selectionEnd,
    setSelectionEnd,
    annotations,
    activeCourse,
    setActiveCourse,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    isConductorLoading,
    videoRef,
    canvasRef,
    handleVideoLoaded,
    handlePlayPause,
    handleFrameStep,
    handleSpeedChange,
    jumpToTimecode,
    handleConductorQuery,
    handleCloseInsight,
    handleSendMessage,
    handleAddAnnotation,
    handleDeleteAnnotation,
    handleQuizComplete,
  } = useAnalysisState(user, setError, setIsLoading, handleSendToCreator);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser as unknown as Record<string, unknown>);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (videoUrl && currentView === 'analysis') {
      const hasSeenHelp = localStorage.getItem('hasSeenHelpModal');
      if (!hasSeenHelp) {
        modals.help.setIsOpen(true);
        localStorage.setItem('hasSeenHelpModal', 'true');
      }
    }
  }, [videoUrl, currentView]);

  // Listen to the Symphony Bus for task results
  useEffect(() => {
    const handleTaskSuccess = (event: Event) => {
      const {id, result} = (event as CustomEvent).detail;
      setInsights((prev) =>
        prev.map((i) =>
          i.id === id ? {...i, data: result, isLoading: false} : i,
        ),
      );
    };

    const handleTaskError = (event: Event) => {
      const {id, error: errorMessage} = (event as CustomEvent).detail;
      setError(`Task failed: ${errorMessage}`);
      setInsights((prev) => prev.filter((i) => i.id !== id));
    };

    const handleValhallaLaunch = (event: Event) => {
      const {tool} = (event as CustomEvent).detail;
      modals.valhalla.open(tool);
    };

    symphonyBus.addEventListener(Events.TASK_SUCCESS, handleTaskSuccess);
    symphonyBus.addEventListener(Events.TASK_ERROR, handleTaskError);
    symphonyBus.addEventListener('LAUNCH_VALHALLA', handleValhallaLaunch);

    return () => {
      symphonyBus.removeEventListener(Events.TASK_SUCCESS, handleTaskSuccess);
      symphonyBus.removeEventListener(Events.TASK_ERROR, handleTaskError);
      symphonyBus.removeEventListener('LAUNCH_VALHALLA', handleValhallaLaunch);
    };
  }, [setInsights]);

  // Keyboard shortcut for Valhalla Gateway
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        const tool = prompt('Enter external tool to launch (e.g., Blender, Ableton):', 'Blender');
        if (tool) {
          modals.valhalla.open(tool);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onExportNLE = (format: 'fcpxml' | 'edl' | 'csv') => {
    handleExportNLE(format, videoUrl || '', duration, annotations);
  };

  const renderAnalysisView = () => {
    if (activeCourse) {
      return (
        <CourseView
          course={activeCourse}
          videoUrl={videoUrl!}
          onBack={() => setActiveCourse(null)}
          jumpToTimecode={jumpToTimecode}
          onQuizComplete={handleQuizComplete}
        />
      );
    }

    if (!videoUrl) {
      return (
        <IngestionScreen
          onVideoLoaded={handleVideoLoaded}
          setIsLoading={setIsLoading}
          setError={setError}
        />
      );
    }

    return (
      <div className="app-container analysis-view-container">
        <main className="main-content">
          <Timeline
            duration={duration}
            currentTime={currentTime}
            selectionStart={selectionStart}
            selectionEnd={selectionEnd}
            annotations={annotations}
            onSelectionChange={(start, end) => {
              setSelectionStart(start);
              setSelectionEnd(end);
            }}
            onJumpToTime={jumpToTimecode}
            onAddAnnotation={handleAddAnnotation}
          />
          <div className="video-column">
            <div className="video-player-container">
              <video
                ref={videoRef}
                src={videoUrl}
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(e) =>
                  setCurrentTime(e.currentTarget.currentTime)
                }
                onDurationChange={(e) =>
                  setDuration(e.currentTarget.duration)
                }
                onClick={handlePlayPause}
              />
              <VideoControls
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onFrameStep={handleFrameStep}
                currentSpeed={playbackSpeed}
                onSpeedChange={handleSpeedChange}
                onExportNLE={() => modals.exportNLE.setIsOpen(true)}
              />
            </div>
          </div>
          <LensLaboratory
            insights={insights}
            user={user}
            currentTime={currentTime}
            duration={duration}
            onClose={handleCloseInsight}
            onSendMessage={handleSendMessage}
            jumpToTimecode={jumpToTimecode}
            onDeleteAnnotation={handleDeleteAnnotation}
            onSendToCreator={handleSendToCreator}
            onOpenCustomBuilder={() => modals.customVirtuoso.setIsOpen(true)}
          />
        </main>
        <ConductorInput
          onQuerySubmit={handleConductorQuery}
          isLoading={isConductorLoading}
        />
      </div>
    );
  };

  const renderCreatorView = () => {
    if (!user) {
      return (
        <div className="ingestion-screen">
          <div className="ingestion-content">
            <h2>Creator Studio</h2>
            <p>Please sign in to create and manage your presentations.</p>
            <button onClick={signInWithGoogle}>Sign in with Google</button>
          </div>
        </div>
      );
    }
    return (
      <CreatorStudio
        user={user}
        presentation={presentation}
        setPresentation={setPresentation}
        activeSlideIndex={activeSlideIndex}
        setActiveSlideIndex={setActiveSlideIndex}
        onNewPresentation={handleNewPresentation}
        onOpenLibrary={() => modals.library.setIsOpen(true)}
      />
    );
  };

  return (
    <div className="app-container">
      <SettingsModal isOpen={modals.settings.isOpen} onClose={() => modals.settings.setIsOpen(false)} />
      <HelpModal isOpen={modals.help.isOpen} onClose={() => modals.help.setIsOpen(false)} />
      <ShareModal
        isOpen={modals.share.isOpen}
        onClose={() => modals.share.setIsOpen(false)}
        shareUrl={modals.share.shareUrl}
      />
      <LiveConversation
        isOpen={modals.liveConversation.isOpen}
        onClose={() => modals.liveConversation.setIsOpen(false)}
      />
      <ValhallaGateway
        isOpen={modals.valhalla.isOpen}
        onClose={() => modals.valhalla.setIsOpen(false)}
        toolName={modals.valhalla.toolName}
      />
      <ExportNLEModal
        isOpen={modals.exportNLE.isOpen}
        onClose={() => modals.exportNLE.setIsOpen(false)}
        onExport={onExportNLE}
      />
      {modals.customVirtuoso.isOpen && (
        <CustomVirtuosoBuilder
          onClose={() => modals.customVirtuoso.setIsOpen(false)}
          onSave={saveCustomVirtuoso}
          customVirtuosos={customVirtuosos}
          onDelete={deleteCustomVirtuoso}
        />
      )}
      {user && (
        <LibraryModal
          isOpen={modals.library.isOpen}
          onClose={() => modals.library.setIsOpen(false)}
          onLoad={handleLoadPresentation}
          userId={user.uid as string}
        />
      )}
      <OrchestraVisualizer />
      <canvas ref={canvasRef} style={{display: 'none'}} />
      <header className="app-header">
        <h1>Aura</h1>
        <div className="header-controls">
          <div className="view-switcher">
            <button
              className={c({active: currentView === 'analysis'})}
              onClick={() => setCurrentView('analysis')}>
              Analysis
            </button>
            <button
              className={c({active: currentView === 'creator'})}
              onClick={() => setCurrentView('creator')}>
              Creator Studio
            </button>
          </div>
          <div className="auth-controls">
            {user ? (
              <>
                <div className="user-profile">
                  <img
                    src={user.photoURL as string}
                    alt={user.displayName as string}
                    referrerPolicy="no-referrer"
                  />
                  <span>{(user.displayName as string).split(' ')[0]}</span>
                </div>
                <button onClick={signOutUser}>Sign Out</button>
              </>
            ) : (
              <button onClick={signInWithGoogle}>Sign In</button>
            )}
          </div>
          <button
            className="icon-header-btn"
            onClick={() => modals.settings.setIsOpen(true)}
            title="Settings"
            aria-label="Settings"
            aria-expanded={modals.settings.isOpen}
          >
            <Settings size={18} />
          </button>
          <button onClick={() => modals.customVirtuoso.setIsOpen(true)}>Build Virtuoso</button>
          <button onClick={() => modals.help.setIsOpen(true)}>Help</button>
        </div>
      </header>
      {currentView === 'analysis' ? renderAnalysisView() : renderCreatorView()}
      {error && (
        <div
          className="error-toast"
          role="alert"
          aria-live="assertive"
          {...useKeyboardActivator(() => setError(null))}
          onClick={() => setError(null)}
        >
          {error}
        </div>
      )}
    </div>
  );
}
