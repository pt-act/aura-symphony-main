/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {db, handleFirestoreError, OperationType} from './firebase';
import type {Presentation} from '../types';

const presentationsCollection = collection(db, 'presentations');

export const savePresentation = async (
  userId: string,
  presentationData: Pick<Presentation, 'name' | 'slides'>,
): Promise<string> => {
  const path = 'presentations';
  try {
    const newPresentation: Omit<Presentation, 'id'> = {
      ...presentationData,
      userId,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    };
    const docRef = await addDoc(presentationsCollection, newPresentation);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

export const updatePresentation = async (
  presentationId: string,
  presentationData: Partial<Pick<Presentation, 'name' | 'slides'>>,
) => {
  const path = `presentations/${presentationId}`;
  try {
    const docRef = doc(db, 'presentations', presentationId);
    await updateDoc(docRef, {
      ...presentationData,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

export const getPresentationsForUser = async (
  userId: string,
): Promise<Presentation[]> => {
  const path = 'presentations';
  try {
    const q = query(
      presentationsCollection,
      where('userId', '==', userId),
      orderBy('lastUpdated', 'desc'),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({id: doc.id, ...doc.data()} as Presentation),
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
};

export const deletePresentation = async (presentationId: string) => {
  const path = `presentations/${presentationId}`;
  try {
    const docRef = doc(db, 'presentations', presentationId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};
