import {useEffect, useState} from 'react';
import {
  db,
  handleFirestoreError,
  OperationType,
} from '../api/firebase';
import {collection, getDocs, setDoc, doc} from 'firebase/firestore';
import {VIRTUOSO_REGISTRY, VirtuosoProfile} from '../services/virtuosos';

/**
 * Manages custom virtuoso CRUD operations and Firestore persistence.
 */
export function useCustomVirtuosos(user: any) {
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
  }, [user]);

  const saveCustomVirtuoso = async (virtuoso: VirtuosoProfile) => {
    if (!user) {
      alert('You must be logged in to save custom virtuosos.');
      return;
    }

    const virtuosoWithUser = {...virtuoso, userId: user.uid, createdAt: new Date()};

    try {
      await setDoc(doc(db, 'custom_virtuosos', virtuoso.id), virtuosoWithUser);
      VIRTUOSO_REGISTRY[virtuoso.id] = virtuosoWithUser;
      setCustomVirtuosos(prev => [...prev, virtuosoWithUser]);
      alert(`Custom Virtuoso "${virtuoso.name}" created successfully!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `custom_virtuosos/${virtuoso.id}`);
    }
  };

  const deleteCustomVirtuoso = async (id: string) => {
    if (!user) return;
    try {
      const {deleteDoc} = await import('firebase/firestore');
      await deleteDoc(doc(db, 'custom_virtuosos', id));
      delete VIRTUOSO_REGISTRY[id];
      setCustomVirtuosos(prev => prev.filter(v => v.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `custom_virtuosos/${id}`);
    }
  };

  return {customVirtuosos, saveCustomVirtuoso, deleteCustomVirtuoso};
}
