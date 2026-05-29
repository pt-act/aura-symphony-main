/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
// Fix: Use Firebase v8 compat imports to resolve module errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import {getFirestore, getDocFromServer, doc} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
// Use the firestoreDatabaseId from the config
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}
testConnection();

const provider = new firebase.auth.GoogleAuthProvider();

const signInWithGoogle = () => {
  // Set persistence to 'none' before signing in to support restricted environments.
  return auth.setPersistence(firebase.auth.Auth.Persistence.NONE)
    .then(() => {
      return auth.signInWithPopup(provider);
    })
    .catch((error) => {
      console.error("Firebase sign-in error:", error);
      // Potentially show an error to the user
      throw error;
    });
};

const signOutUser = () => {
  return auth.signOut();
};

// Wrapper to maintain v9-like signature for onAuthStateChanged used in App.tsx
const onAuthStateChanged = (authInstance: any, callback: any) => {
  return authInstance.onAuthStateChanged(callback);
};

export {auth, db, onAuthStateChanged, signInWithGoogle, signOutUser};