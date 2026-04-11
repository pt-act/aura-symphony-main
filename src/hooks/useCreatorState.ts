import {useState, useEffect} from 'react';
import type {Presentation, Slide, Insight} from '../types';
import {convertInsightToMarkdown} from '../lib/utils';
import {signInWithGoogle} from '../api/firebase';

export function useCreatorState(user: any, setCurrentView: (view: 'analysis' | 'creator') => void) {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setPresentation(null);
    }
  }, [user]);

  const handleSendToCreator = (insight: Insight) => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    const slideContent = convertInsightToMarkdown(insight);
    if (!slideContent) return;

    const newSlide: Slide = {
      id: Date.now().toString(),
      content: slideContent,
      speakerNotes: `Generated from "${insight.title}" insight.`,
      backgroundImage: null,
      backgroundColor: '#ffffff',
    };

    setPresentation((currentPresentation) => {
      const slides = currentPresentation
        ? [...currentPresentation.slides, newSlide]
        : [newSlide];
      setActiveSlideIndex(slides.length - 1);

      if (!currentPresentation) {
        return {
          userId: user.uid,
          name: 'New Presentation from Aura',
          slides: slides,
          createdAt: new Date(),
          lastUpdated: new Date(),
        };
      } else {
        return {
          ...currentPresentation,
          slides: slides,
        };
      }
    });

    setCurrentView('creator');
  };

  const handleNewPresentation = () => {
    if (!user) return;
    setPresentation({
      userId: user.uid,
      name: 'Untitled Presentation',
      slides: [
        {
          id: Date.now().toString(),
          content: '# Title Slide',
          speakerNotes: '',
          backgroundImage: null,
          backgroundColor: '#ffffff',
        },
      ],
      createdAt: new Date(),
      lastUpdated: new Date(),
    });
    setActiveSlideIndex(0);
  };

  const handleLoadPresentation = (p: Presentation) => {
    setPresentation(p);
    setActiveSlideIndex(0);
    setIsLibraryOpen(false);
  };

  return {
    presentation,
    setPresentation,
    activeSlideIndex,
    setActiveSlideIndex,
    isLibraryOpen,
    setIsLibraryOpen,
    handleSendToCreator,
    handleNewPresentation,
    handleLoadPresentation,
  };
}
