import {useState, useCallback} from 'react';
import type {DigitalLearnerProfile, QuizQuestion} from '../types';

export function useCourseState() {
  const [activeCourse, setActiveCourse] = useState<{
    title: string;
    summary: {time: string; text: string}[];
    keyMoments: {time: string; text: string}[];
    quiz: QuizQuestion[];
  } | null>(null);
  
  const [dlp, setDlp] = useState<DigitalLearnerProfile>({knowledgeGraph: {}});

  const handleQuizComplete = useCallback(
    (concept: string, score: number, total: number) => {
      setDlp((prevDlp) => ({
        ...prevDlp,
        knowledgeGraph: {
          ...prevDlp.knowledgeGraph,
          [concept]: {
            mastery: score / total,
            lastUpdated: new Date().toISOString(),
          },
        },
      }));
    },
    [],
  );

  return {
    activeCourse,
    setActiveCourse,
    dlp,
    setDlp,
    handleQuizComplete,
  };
}
