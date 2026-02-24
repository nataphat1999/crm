import React from 'react';
import { DynamicCard } from '../../../../types/evidence';

interface CustomCardProps {
  card: DynamicCard;
  onDataChange: (cardId: string, updatedData: { data: string }) => void;
  isEditing: boolean;
}

const CustomCard: React.FC<CustomCardProps> = ({ card, onDataChange, isEditing }) => {
  const isMultiLine = card.type === "กำหนดเองแบบ2";
  const content = card.data?.data || "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isEditing) return;
    onDataChange(card.id, { data: e.target.value });
  };

  return (
    <div className="mt-2">
      {isMultiLine ? (
        <textarea
          id={`custom-card-data-${card.id}`}
          className="border border-gray-300 rounded-md p-2 w-full text-xs h-24 resize-y focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={content}
          onChange={handleChange}
          placeholder="ระบุข้อมูลเพิ่มเติม..."
          disabled={!isEditing}
        />
      ) : (
        <input
          type="text"
          id={`custom-card-data-${card.id}`}
          className="border border-gray-300 rounded-md p-2 w-full text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={content}
          onChange={handleChange}
          placeholder="ระบุข้อมูลเพิ่มเติม..."
          disabled={!isEditing}
        />
      )}
    </div>
  );
};

export default CustomCard;