import {useState, useCallback} from 'react';
import type {Annotation} from '../types';

export function useAnnotationsState() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const handleAddAnnotation = useCallback((time: number, text: string) => {
    const newAnnotation: Annotation = {
      id: Date.now(),
      time,
      text,
    };
    setAnnotations((prev) => [...prev, newAnnotation]);
  }, []);

  const handleDeleteAnnotation = useCallback((id: number) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
  }, []);

  return {
    annotations,
    setAnnotations,
    handleAddAnnotation,
    handleDeleteAnnotation,
  };
}
