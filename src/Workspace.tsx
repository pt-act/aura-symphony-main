import c from 'classnames';
import React, {useEffect, useState} from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
  handleFirestoreError,
  OperationType,
} from './api/firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
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
import LiveConversation from './components/shared/LiveConversation';
import ShareModal from './components/shared/ShareModal';
import ValhallaGateway from './components/valhalla/ValhallaGateway';
import ExportNLEModal from './components/analysis/ExportNLEModal';
import CustomVirtuosoBuilder from './components/virtuosos/CustomVirtuosoBuilder';
import {Events, symphonyBus} from './lib/symphonyBus';
import {useAnalysisState} from './hooks/useAnalysisState';
import {useCreatorState} from './hooks/useCreatorState';
import {VIRTUOSO_REGISTRY, VirtuosoProfile} from './services/virtuosos';

export default function Workspace() {
  // App State
  const [user, setUser] = useState<any | null>(null);
  const [currentView, setCurrentView] = useState<'analysis' | 'creator'>(
    'analysis',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isShareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isLiveConversationOpen, setIsLiveConversationOpen] = useState(false);
  const [isValhallaOpen, setIsValhallaOpen] = useState(false);
  const [valhallaToolName, setValhallaToolName] = useState('Blender');
  const [isCustomVirtuosoOpen, setIsCustomVirtuosoOpen] = useState(false);
  const [isExportNLEOpen, setIsExportNLEOpen] = useState(false);
  const [customVirtuosos, setCustomVirtuosos] = useState<VirtuosoProfile[]>([]);

  useEffect(() => {
    if (user) {
      const loadCustomVirtuosos = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, 'custom_virtuosos'));
          const loaded: VirtuosoProfile[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data() as VirtuosoProfile;
            if (data.userId === user.uid) {
              VIRTUOSO_REGISTRY[data.id] = data;
              loaded.push(data);
            }
          });
          setCustomVirtuosos(loaded);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'custom_virtuosos');
        }
      };
      loadCustomVirtuosos();
    }
  }, [user]);

  const handleSaveCustomVirtuoso = async (virtuoso: VirtuosoProfile) => {
    if (!user) {
      alert('You must be logged in to save custom virtuosos.');
      return;
    }
    
    const virtuosoWithUser = { ...virtuoso, userId: user.uid, createdAt: new Date() };
    
    try {
      await setDoc(doc(db, 'custom_virtuosos', virtuoso.id), virtuosoWithUser);
      VIRTUOSO_REGISTRY[virtuoso.id] = virtuosoWithUser;
      setCustomVirtuosos(prev => [...prev, virtuosoWithUser]);
      alert(`Custom Virtuoso "${virtuoso.name}" created successfully!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `custom_virtuosos/${virtuoso.id}`);
    }
  };

  const handleDeleteCustomVirtuoso = async (id: string) => {
    if (!user) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'custom_virtuosos', id));
      delete VIRTUOSO_REGISTRY[id];
      setCustomVirtuosos(prev => prev.filter(v => v.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `custom_virtuosos/${id}`);
    }
  };

  const {
    presentation,
    setPresentation,
    activeSlideIndex,
    setActiveSlideIndex,
    isLibraryOpen,
    setIsLibraryOpen,
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
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (videoUrl && currentView === 'analysis') {
      const hasSeenHelp = localStorage.getItem('hasSeenHelpModal');
      if (!hasSeenHelp) {
        setIsHelpOpen(true);
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
      // Remove the insight card that failed
      setInsights((prev) => prev.filter((i) => i.id !== id));
    };

    const handleValhallaLaunch = (event: Event) => {
      const {tool} = (event as CustomEvent).detail;
      setValhallaToolName(tool || 'Blender');
      setIsValhallaOpen(true);
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
          setValhallaToolName(tool);
          setIsValhallaOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExportNLE = (format: 'fcpxml' | 'edl' | 'csv') => {
    let content = '';
    let mimeType = '';
    let filename = '';

    if (format === 'fcpxml') {
      content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="FFVideoFormat1080p30" frameDuration="100/3000s" width="1920" height="1080" colorSpace="1-1-1 (Rec. 709)"/>
    <asset id="r2" name="Video" src="file://${videoUrl || 'video.mp4'}" start="0s" duration="${duration}s" hasVideo="1" hasAudio="1" format="r1"/>
  </resources>
  <library>
    <event name="Aura Symphony Export">
      <project name="Aura Project">
        <sequence format="r1" duration="${duration}s" tcStart="0s" tcFormat="NDF">
          <spine>
            <asset-clip name="Video" ref="r2" offset="0s" duration="${duration}s" start="0s">
              ${annotations.map(ann => `
              <marker start="${ann.time}s" duration="100/3000s" value="${ann.text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" note="Aura Annotation"/>
              `).join('')}
            </asset-clip>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
      mimeType = 'application/xml';
      filename = 'aura_export.fcpxml';
    } else if (format === 'edl') {
      content = `TITLE: Aura Symphony Export\nFCM: NON-DROP FRAME\n\n`;
      annotations.forEach((ann, index) => {
        const eventNum = String(index + 1).padStart(3, '0');
        // Simple timecode conversion (assuming 30fps)
        const toTimecode = (seconds: number) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          const s = Math.floor(seconds % 60);
          const f = Math.floor((seconds % 1) * 30);
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
        };
        const tc = toTimecode(ann.time);
        content += `${eventNum}  AX       V     C        ${tc} ${tc} ${tc} ${tc}\n`;
        content += `* FROM CLIP NAME: Video\n`;
        content += `* LOC: ${tc} ${ann.text.replace(/\n/g, ' ')}\n\n`;
      });
      mimeType = 'text/plain';
      filename = 'aura_export.edl';
    } else if (format === 'csv') {
      content = `Time (Seconds),Timecode,Annotation\n`;
      annotations.forEach(ann => {
        const toTimecode = (seconds: number) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          const s = Math.floor(seconds % 60);
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };
        const escapedText = `"${ann.text.replace(/"/g, '""')}"`;
        content += `${ann.time.toFixed(2)},${toTimecode(ann.time)},${escapedText}\n`;
      });
      mimeType = 'text/csv';
      filename = 'aura_export.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                onExportNLE={() => setIsExportNLEOpen(true)}
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
            onOpenCustomBuilder={() => setIsCustomVirtuosoOpen(true)}
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
        onOpenLibrary={() => setIsLibraryOpen(true)}
      />
    );
  };

  return (
    <div className="app-container">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setShareOpen(false)}
        shareUrl={shareUrl}
      />
      <LiveConversation
        isOpen={isLiveConversationOpen}
        onClose={() => setIsLiveConversationOpen(false)}
      />
      <ValhallaGateway
        isOpen={isValhallaOpen}
        onClose={() => setIsValhallaOpen(false)}
        toolName={valhallaToolName}
      />
      <ExportNLEModal
        isOpen={isExportNLEOpen}
        onClose={() => setIsExportNLEOpen(false)}
        onExport={handleExportNLE}
      />
      {isCustomVirtuosoOpen && (
        <CustomVirtuosoBuilder
          onClose={() => setIsCustomVirtuosoOpen(false)}
          onSave={handleSaveCustomVirtuoso}
          customVirtuosos={customVirtuosos}
          onDelete={handleDeleteCustomVirtuoso}
        />
      )}
      {user && (
        <LibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onLoad={handleLoadPresentation}
          userId={user.uid}
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
                    src={user.photoURL}
                    alt={user.displayName}
                    referrerPolicy="no-referrer"
                  />
                  <span>{user.displayName.split(' ')[0]}</span>
                </div>
                <button onClick={signOutUser}>Sign Out</button>
              </>
            ) : (
              <button onClick={signInWithGoogle}>Sign In</button>
            )}
          </div>
          <button onClick={() => setIsCustomVirtuosoOpen(true)}>Build Virtuoso</button>
          <button onClick={() => setIsHelpOpen(true)}>Help</button>
        </div>
      </header>
      {currentView === 'analysis' ? renderAnalysisView() : renderCreatorView()}
      {error && (
        <div className="error-toast" onClick={() => setError(null)}>
          {error}
        </div>
      )}
    </div>
  );
}
