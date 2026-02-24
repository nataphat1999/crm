import React, { useEffect } from 'react';
import { AgeCardData, DynamicCard } from '../../../../types/evidence';
import { calculateAge } from '../../../../utils/ageCalculations';

interface AgeCardProps {
    card: DynamicCard;
    onDataChange: (cardId: string, updatedData: Partial<AgeCardData>) => void;
    isEditing: boolean;
}

const AgeCard: React.FC<AgeCardProps> = ({ card, onDataChange, isEditing }) => {
    const data: AgeCardData = card.data as AgeCardData || { dateOfBirth: null, age: null, isManualAge: false };

    useEffect(() => {
        if (data.dateOfBirth) {
            const calculatedAge = calculateAge(data.dateOfBirth);
            if (calculatedAge !== data.age || data.isManualAge === true) {
                onDataChange(card.id, { age: calculatedAge, isManualAge: false });
            }
        } else if (data.age !== null || data.isManualAge === true) {
            onDataChange(card.id, { age: null, isManualAge: false });
        }
    }, [data.dateOfBirth, card.id, onDataChange, data.age, data.isManualAge]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isEditing) return;
        const newDateOfBirth = e.target.value;
        onDataChange(card.id, { dateOfBirth: newDateOfBirth, isManualAge: false });
    };

    const clearDateOfBirth = () => {
        if (!isEditing) return;
        onDataChange(card.id, { dateOfBirth: null, age: null, isManualAge: false });
    };
    const isDateInputDisabled = !isEditing;
    const isAgeInputDisabled = true;

    return (
        <div className="mt-2 text-xs">
            <div className="mb-2">
                <label htmlFor={`dob-${card.id}`} className="block text-gray-700 font-medium mb-1">
                    วัน/เดือน/ปีเกิด:
                </label>
                <input
                    type="date"
                    id={`dob-${card.id}`}
                    className="border border-gray-300 rounded-md p-2 w-full text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={data.dateOfBirth || ''}
                    onChange={handleDateChange}
                    disabled={isDateInputDisabled}
                />
                {data.dateOfBirth && (
                    <button
                        onClick={clearDateOfBirth}
                        className={`text-red-500 hover:text-red-700 text-xs mt-1 ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        type="button"
                        disabled={!isEditing}
                    >
                        ล้างข้อมูลวันเกิด
                    </button>
                )}
            </div>

            <div className="mb-2">
                <label htmlFor={`age-${card.id}`} className="block text-gray-700 font-medium mb-1">
                    อายุ (ปี):
                </label>
                <input
                    type="number"
                    id={`age-${card.id}`}
                    className={`border border-gray-300 rounded-md p-2 w-full text-xs ${isAgeInputDisabled ? 'bg-gray-100 cursor-not-allowed' : 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'}`}
                    value={data.age !== null ? data.age : ''}
                    placeholder="จะคำนวณจากวันเกิดอัตโนมัติ"
                    min="0"
                    disabled={isAgeInputDisabled}
                />
            </div>

            {!data.dateOfBirth && (
                <p className="text-gray-500 mt-2">
                    โปรดระบุวันเกิดเพื่อคำนวณอายุ
                </p>
            )}
        </div>
    );
};

export default AgeCard;