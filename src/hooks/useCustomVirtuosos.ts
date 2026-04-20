import {useEffect, useState} from 'react';
import {
  db,
  handleFirestoreError,
  OperationType,
} from '../api/firebase';
import {collection, getDocs, setDoc, doc, serverTimestamp, deleteDoc} from 'firebase/firestore';
import {VIRTUOSO_REGISTRY, VirtuosoProfile} from '../services/virtuosos';

interface UserRef {
  uid: string;
}

/**
 * Validates a custom virtuoso profile before saving.
 * Returns an error string if invalid, null if valid.
 */
function validateVirtuoso(v: Partial<VirtuosoProfile>): string | null {
  if (!v.id || typeof v.id !== 'string') return 'Virtuoso ID is required';
  if (!v.name || typeof v.name !== 'string') return 'Virtuoso name is required';
  if (!v.systemInstruction || typeof v.systemInstruction !== 'string') return 'System instruction is required';
  if (!v.model || typeof v.model !== 'string') return 'Model selection is required';
  if (v.id.startsWith('custom_') === false && Object.values(VIRTUOSO_REGISTRY).some(r => r.id === v.id)) {
    return 'Cannot overwrite a built-in Virtuoso';
  }
  return null;
}

/**
 * Manages custom virtuoso CRUD operations and Firestore persistence.
 */
export function useCustomVirtuosos(user: UserRef | null) {
  const [customVirtuosos, setCustomVirtuosos] = useState<VirtuosoProfile[]>([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'custom_virtuosos'));
        const loaded: VirtuosoProfile[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as VirtuosoProfile;
          if (data.userId === user.uid) {
            // Register in memory without mutating the original object
            VIRTUOSO_REGISTRY[data.id] = data;
            loaded.push(data);
          }
        });
        setCustomVirtuosos(loaded);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'custom_virtuosos');
      }
    };
    load();
  }, [user?.uid]);

  const saveCustomVirtuoso = async (virtuoso: VirtuosoProfile) => {
    if (!user) {
      alert('You must be logged in to save custom virtuosos.');
      return;
    }

    const validationError = validateVirtuoso(virtuoso);
    if (validationError) {
      alert(`Validation error: ${validationError}`);
      return;
    }

    const virtuosoWithMeta = {
      ...virtuoso,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'custom_virtuosos', virtuoso.id), virtuosoWithMeta);
      VIRTUOSO_REGISTRY[virtuoso.id] = virtuosoWithMeta as VirtuosoProfile;
      setCustomVirtuosos(prev => [...prev, virtuosoWithMeta as VirtuosoProfile]);
      alert(`Custom Virtuoso "${virtuoso.name}" created successfully!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `custom_virtuosos/${virtuoso.id}`);
    }
  };

  const deleteCustomVirtuoso = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'custom_virtuosos', id));
      delete VIRTUOSO_REGISTRY[id];
      setCustomVirtuosos(prev => prev.filter(v => v.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `custom_virtuosos/${id}`);
    }
  };

  return {customVirtuosos, saveCustomVirtuoso, deleteCustomVirtuoso};
}
