import {useState, useCallback} from 'react';

/**
 * Manages all modal open/close state for the application.
 * Extracted from Workspace.tsx to reduce god-component complexity.
 */
export function useAppModals() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isShareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isLiveConversationOpen, setIsLiveConversationOpen] = useState(false);
  const [isValhallaOpen, setIsValhallaOpen] = useState(false);
  const [valhallaToolName, setValhallaToolName] = useState('Blender');
  const [isCustomVirtuosoOpen, setIsCustomVirtuosoOpen] = useState(false);
  const [isExportNLEOpen, setIsExportNLEOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const openValhalla = useCallback((tool?: string) => {
    setValhallaToolName(tool || 'Blender');
    setIsValhallaOpen(true);
  }, []);

  const openShare = useCallback((url: string) => {
    setShareUrl(url);
    setShareOpen(true);
  }, []);

  return {
    help: {isOpen: isHelpOpen, setIsOpen: setIsHelpOpen},
    share: {isOpen: isShareOpen, setIsOpen: setShareOpen, shareUrl, openShare},
    liveConversation: {isOpen: isLiveConversationOpen, setIsOpen: setIsLiveConversationOpen},
    valhalla: {isOpen: isValhallaOpen, setIsOpen: setIsValhallaOpen, toolName: valhallaToolName, open: openValhalla},
    customVirtuoso: {isOpen: isCustomVirtuosoOpen, setIsOpen: setIsCustomVirtuosoOpen},
    exportNLE: {isOpen: isExportNLEOpen, setIsOpen: setIsExportNLEOpen},
    settings: {isOpen: isSettingsOpen, setIsOpen: setIsSettingsOpen},
    library: {isOpen: isLibraryOpen, setIsOpen: setIsLibraryOpen},
  };
}
