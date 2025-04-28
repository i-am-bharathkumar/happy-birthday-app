import React from 'react';
import Image from 'next/image';

type Props = {
  onClose: () => void;
};

const BirthdayModal = ({ onClose }: Props) => {
  return (
    <div style={modalOverlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ margin: '0 0 20px 0', color: '#d63384' }}>🎉 Happy Birthday! 🎂</h2>
        <div style={imageContainerStyle}>
          <Image
            src="/birthday-cake.png"
            alt="Birthday Cake"
            width={200}
            height={200}
            unoptimized // Required for static exports
            style={{ objectFit: 'contain' }}
          />
        </div>
        <button onClick={onClose} style={buttonStyle}>
          Thank You!
        </button>
      </div>
    </div>
  );
};

// Styles
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '12px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  textAlign: 'center',
  maxWidth: '90%',
};

const imageContainerStyle: React.CSSProperties = {
  margin: '20px 0',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#ff69b4',
  border: 'none',
  borderRadius: '8px',
  color: 'white',
  fontSize: '16px',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
};

export default BirthdayModal;