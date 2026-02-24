import React from 'react';
import { DynamicCard } from '../../../../types/evidence';

interface NameCardProps {
  card: DynamicCard;
  onDataChange: (cardId: string, updatedFields: { [key: string]: any }) => void;
  isEditing: boolean;
}

const NameCard: React.FC<NameCardProps> = ({ card, onDataChange, isEditing }) => {
  const firstName = card.data?.firstName || "";
  const lastName = card.data?.lastName || "";

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditing) {
      const sanitizedValue = e.target.value.replace(/[^a-zA-Z\sก-ฮะ-ูเ-์]/g, '');
      onDataChange(card.id, { firstName: sanitizedValue });
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditing) {
      const sanitizedValue = e.target.value.replace(/[^a-zA-Z\sก-ฮะ-ูเ-์]/g, '');
      onDataChange(card.id, { lastName: sanitizedValue });
    }
  };

  return (
    <div className="mt-2 text-xs">
      <div className="mb-2">
        <label htmlFor={`firstName-${card.id}`} className="block text-gray-700 font-medium mb-1">
          ชื่อ:
        </label>
        <input
          type="text"
          id={`firstName-${card.id}`}
          className="border border-gray-300 rounded-md p-2 w-full text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={firstName}
          onChange={handleFirstNameChange}
          placeholder="ระบุชื่อ"
          disabled={!isEditing}
        />
      </div>
      <div>
        <label htmlFor={`lastName-${card.id}`} className="block text-gray-700 font-medium mb-1">
          นามสกุล:
        </label>
        <input
          type="text"
          id={`lastName-${card.id}`}
          className="border border-gray-300 rounded-md p-2 w-full text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={lastName}
          onChange={handleLastNameChange}
          placeholder="ระบุนามสกุล"
          disabled={!isEditing}
        />
      </div>
    </div>
  );
};

export default NameCard;