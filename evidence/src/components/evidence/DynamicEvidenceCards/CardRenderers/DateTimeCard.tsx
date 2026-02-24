import React, { useCallback, useState, useEffect, useRef } from 'react';
import CustomDateTimePicker from '../../../common/CustomDateTimePicker';
import { CustomDateTimeData, DynamicCard } from '../../../../types/evidence';
import isEqual from 'lodash.isequal';
import { parseDateTimePart, formatSingleDateTimePart } from '../../../../utils/dateTimeParsers';

interface DateTimeCardProps {
  card: DynamicCard;
  onDataChange: (cardId: string, updatedData: string) => void;
  isEditing: boolean;
}

const DateTimeCard: React.FC<DateTimeCardProps> = ({ card, onDataChange, isEditing }) => {
  const fullEvidenceDataRef = useRef<any>(null);

  const parseAndExtractData = useCallback((cardData: DynamicCard['data']) => {
    let newInternalData: CustomDateTimeData = { start: {}, end: {}, isRangeMode: false };
    let parsedContent: any = {};
    let rawJsonString: string | null = null;
    let currentFullEvidenceData: any = null;

    try {
      if (cardData) {
        if (typeof cardData === 'string') {
          rawJsonString = cardData;
        } else if (typeof cardData === 'object' && cardData !== null) {
          const keys = Object.keys(cardData).sort((a, b) => parseInt(a) - parseInt(b));
          const reconstructedString = keys.map(key => (cardData as any)[key]).join('');
          if (reconstructedString.startsWith('{') && reconstructedString.endsWith('}')) {
            rawJsonString = reconstructedString;
          }
        }

        if (rawJsonString) {
          parsedContent = JSON.parse(rawJsonString);
          currentFullEvidenceData = parsedContent;
        }

        let datetimeValue = parsedContent.datetime?.value || parsedContent.pf_case_Evidence_Data?.datetime?.value;

        if (parsedContent.start && parsedContent.end) {
          newInternalData = {
            ...parsedContent,
            isRangeMode: !!parsedContent.end && Object.keys(parsedContent.end).length > 0,
          };
          currentFullEvidenceData = parsedContent;
        } else if (datetimeValue) {
          const startPart = parseDateTimePart(datetimeValue.datetime_start);
          const endPart = datetimeValue.datetime_end ? parseDateTimePart(datetimeValue.datetime_end) : {};
          const inferredIsRangeMode = !!datetimeValue.datetime_end && (typeof datetimeValue.datetime_end === 'string' ? datetimeValue.datetime_end.trim() !== '' : true);
          newInternalData = { start: startPart, end: endPart, isRangeMode: inferredIsRangeMode };
        }
      }
    } catch (e) {
      console.error("DateTimeCard: Failed to parse card data", e);
    }

    return { internalData: newInternalData, fullData: currentFullEvidenceData };
  }, []);

  const [internalDateTimeData, setInternalDateTimeData] = useState<CustomDateTimeData>(() => {
    const { internalData, fullData } = parseAndExtractData(card.data);
    fullEvidenceDataRef.current = fullData;
    return internalData;
  });

  useEffect(() => {
    const { internalData, fullData } = parseAndExtractData(card.data);
    if (!isEqual(internalDateTimeData, internalData)) {
      setInternalDateTimeData(internalData);
      fullEvidenceDataRef.current = fullData;
    }
  }, [card.data, internalDateTimeData, parseAndExtractData]);

  const handleDateTimeChange = useCallback((newData: CustomDateTimeData) => {
    if (!isEditing) {
      return;
    }
    
    setInternalDateTimeData(newData);
    
    const apiFormattedStartString = formatSingleDateTimePart(newData.start);
    const apiFormattedEndString = newData.isRangeMode && newData.end ? formatSingleDateTimePart(newData.end) : null;
    
    const updatedDatetimeValue = {
      datetime_start: apiFormattedStartString,
      datetime_end: apiFormattedEndString,
    };
    
    const currentFullEvidenceData = fullEvidenceDataRef.current;
    
    let outputDataForCardData: any;
    if (currentFullEvidenceData && currentFullEvidenceData.pf_case_Evidence_Data) {
      outputDataForCardData = {
        ...currentFullEvidenceData,
        pf_case_Evidence_Data: {
          ...currentFullEvidenceData.pf_case_Evidence_Data,
          datetime: {
            type: "datetime",
            value: updatedDatetimeValue
          }
        }
      };
    } else if (currentFullEvidenceData && currentFullEvidenceData.datetime) {
      outputDataForCardData = {
        ...currentFullEvidenceData,
        datetime: {
          type: "datetime",
          value: updatedDatetimeValue
        }
      };
    } else if (typeof currentFullEvidenceData?.start === 'object' && typeof currentFullEvidenceData?.end === 'object') {
        outputDataForCardData = newData;
    } else {
      outputDataForCardData = {
        datetime: {
          type: "datetime",
          value: updatedDatetimeValue
        }
      };
    }
    
    onDataChange(card.id, JSON.stringify(outputDataForCardData));
  }, [isEditing, card.id, onDataChange]);

  return (
    <div className="mt-2">
      <CustomDateTimePicker
        cardId={card.id}
        mode="range"
        initialData={internalDateTimeData}
        onChange={handleDateTimeChange}
        disabled={!isEditing}
      />
    </div>
  );
};

export default DateTimeCard;