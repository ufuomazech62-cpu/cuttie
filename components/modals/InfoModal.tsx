
import React from 'react';
import Modal from '../ui/Modal';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, content }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-6 prose prose-purple max-w-none text-gray-600 text-sm leading-relaxed">
        {content}
      </div>
    </Modal>
  );
};

export default InfoModal;
