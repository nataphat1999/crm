import React from 'react';
import { DynamicCard } from '../../../../types/evidence';

interface GenderCardProps {
  card: DynamicCard;
  onDataChange: (cardId: string, updatedData: { gender: string }) => void;
  isEditing: boolean;
}

const GenderCard: React.FC<GenderCardProps> = ({ card, onDataChange, isEditing }) => {
  const currentGender = card.data?.gender || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isEditing) return;
    onDataChange(card.id, { gender: e.target.value });
  };

  return (
    <div className="mt-2 text-xs">
      <label htmlFor={`gender-${card.id}`} className="block text-gray-700 font-medium mb-1">
        เพศ:
      </label>
      <select
        id={`gender-${card.id}`}
        className="border border-gray-300 rounded-md p-2 w-full text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        value={currentGender}
        onChange={handleChange}
        disabled={!isEditing}
      >
        <option value="">เลือกเพศ</option>
        <option value="male">ชาย</option>
        <option value="female">หญิง</option>
      </select>
    </div>
  );
};

export default GenderCard;