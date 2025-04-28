import { useEffect, useState } from 'react';
import { Storage } from '@capacitor/storage';
import BirthdayModal from './birthday-modal';

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkFirstTime = async () => {
      const { value } = await Storage.get({ key: 'hasVisited' });
      if (!value) {
        setShowModal(true);
        await Storage.set({ key: 'hasVisited', value: 'true' });
      }
    };
    checkFirstTime();
  }, []);

  // const resetStorage = async () => {
  //   await Storage.remove({ key: 'hasVisited' });
  //   alert('Storage cleared! Refresh the page to see the modal again.');
  // };

  return (
    <div style={{ textAlign: 'center', paddingTop: '100px'}}>
      <h1>Welcome to Happy Birthday App!</h1>
      {showModal && <BirthdayModal onClose={() => setShowModal(false)} />}
      
      {/* Reset button for testing
      <button 
        onClick={resetStorage}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#6200ea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Reset First Visit (For Testing)
      </button> */}
    </div>
  );
}