/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
