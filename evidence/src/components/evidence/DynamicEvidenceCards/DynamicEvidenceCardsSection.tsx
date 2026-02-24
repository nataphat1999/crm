import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaChevronUp, FaEdit, FaPlus, FaSave, FaTimes, FaTimesCircle } from "react-icons/fa";
import { MdEditSquare } from "react-icons/md";
import { fetchEvidenceIdAPI, updateEvidenceAPI } from "../../../api/evidenceHandlers";
import AlertPopup from "../../../components/common/AlertPopup";
import {
  AgeCardData,
  CustomDateTimeData,
  DynamicCard,
  EvidenceTypeData,
  LocationData
} from "../../../types/evidence";
import { formatBirthdate } from "../../../utils/ageCalculations";
import { formatSingleDateTimePart, parseDateTimePart } from "../../../utils/dateTimeParsers";
import { validateDynamicCards } from "../../../utils/validation";
import AgeCard from "./CardRenderers/AgeCard";
import CustomCard from "./CardRenderers/CustomCard";
import DateTimeCard from "./CardRenderers/DateTimeCard";
import GenderCard from "./CardRenderers/GenderCard";
import LocationCard from "./CardRenderers/LocationCard";
import NameCard from "./CardRenderers/NameCard";
const UNIQUE_CARD_TYPES = ["ชื่อ", "อายุ", "เพศ", "วันที่และเวลา", "ตำแหน่ง"];
const NON_EDITABLE_CARD_TYPES = ["ชื่อ", "เพศ", "อายุ", "วันที่และเวลา", "ตำแหน่ง"];

interface DynamicEvidenceCardsSectionProps {
  caseId: string;
  evidenceId: string | null;
  evidenceName: string;
  evidenceType: EvidenceTypeData | null;
  evidenceDescription: string;
  setErrorMessage: (message: string) => void;
  setShowError: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  isCreateMode: boolean;
  initialCollapsed: boolean;
  onSaveSuccess: (updatedEvidenceId: string) => void;
  canEdit:boolean;
}

const DynamicEvidenceCardsSection: React.FC<DynamicEvidenceCardsSectionProps> = ({
  caseId,
  evidenceId,
  evidenceName,
  evidenceType,
  evidenceDescription,
  setErrorMessage: setParentErrorMessage,
  setShowError: setParentShowError,
  setLoading,
  isCreateMode,
  initialCollapsed,
  onSaveSuccess,canEdit
}) => {
  const [cardCollapsed, setCardCollapsed] = useState(initialCollapsed);
  const [isEditingDynamicCards, setIsEditingDynamicCards] = useState(false);
  const [dynamicCards, setDynamicCards] = useState<DynamicCard[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [initialCardsOnEdit, setInitialCardsOnEdit] = useState<DynamicCard[] | null>(null);

  const hasUnsavedChanges = useMemo(() => {
    if (!isEditingDynamicCards || !initialCardsOnEdit) {
      return false;
    }
    return JSON.stringify(dynamicCards) !== JSON.stringify(initialCardsOnEdit);
  }, [dynamicCards, initialCardsOnEdit, isEditingDynamicCards]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  useEffect(() => {
    setCardCollapsed(initialCollapsed);
  }, [initialCollapsed]);

  useEffect(() => {
    if (evidenceId) {
      setLoading(true);
      fetchEvidenceIdAPI({ evidenceId: evidenceId })
        .then((result: any) => {
          if (result.pf_case_Evidence_Data) {
            const dataObject = result.pf_case_Evidence_Data;
            const cardMap = new Map<string, DynamicCard>();

            const addOrUpdateCard = (uniqueKey: string, type: string, title: string, data: any, order: number) => {
              let card = cardMap.get(uniqueKey);
              if (!card) {
                card = {
                  id: `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: type,
                  title: title,
                  data: {},
                  isGeneratedFromBackend: true,
                  order: order
                } as DynamicCard;
                cardMap.set(uniqueKey, card);
              }
              card.data = { ...card.data, ...data };
              if (!NON_EDITABLE_CARD_TYPES.includes(type)) {
                card.title = title;
              }
              if (card.order === undefined) {
                card.order = order;
              }
            };

            if ('datetime' in dataObject && typeof dataObject.datetime === 'object' && dataObject.datetime !== null && 'value' in dataObject.datetime && 'order' in dataObject.datetime) {
                
              const dateTimeValue = dataObject.datetime.value;
              console.log(dateTimeValue)
                const parsedDateTimeData: CustomDateTimeData = {
                    start: dateTimeValue.datetime_start ? parseDateTimePart(dateTimeValue.datetime_start) : {},
                    end: dateTimeValue.datetime_end ? parseDateTimePart(dateTimeValue.datetime_end) : {}
                };
                addOrUpdateCard('datetime', 'วันที่และเวลา', 'วันที่และเวลา', JSON.stringify(parsedDateTimeData), dataObject.datetime.order);
            }

            if ('location' in dataObject && typeof dataObject.location === 'object' && dataObject.location !== null && 'value' in dataObject.location && 'order' in dataObject.location) {
              const locationValue = dataObject.location.value;
              const locationDescription = dataObject.location_description?.value || "";
          
              let lat: number | null = null;
              let lng: number | null = null;
              let coordinates: [number, number][] = [];
              let locationType: "แบบระบุตำแหน่ง" | "แบบระบุพื้นที่" = "แบบระบุตำแหน่ง";
          
              if (Array.isArray(locationValue) && locationValue.length > 0) {
                  coordinates = locationValue.filter(
                      (coord: any): coord is [number, number] =>
                          Array.isArray(coord) &&
                          coord.length === 2 &&
                          typeof coord[0] === 'number' &&
                          typeof coord[1] === 'number'
                  );
          
                  if (coordinates.length === 1) {
                      lat = coordinates[0][0];
                      lng = coordinates[0][1];
                      locationType = "แบบระบุตำแหน่ง";
                  } else if (coordinates.length > 1) {
                      locationType = "แบบระบุพื้นที่";
                  }
              }
              
              const locationData: LocationData = {
                  location: locationDescription,
                  lat: lat,
                  lng: lng,
                  locationType: locationType,
                  coordinates: coordinates
              };
              
              addOrUpdateCard('location', 'ตำแหน่ง', 'ตำแหน่ง', locationData, dataObject.location.order);
          }

            if ('firstname' in dataObject && typeof dataObject.firstname === 'object' && dataObject.firstname !== null && 'value' in dataObject.firstname && 'order' in dataObject.firstname) {
                const firstName = dataObject.firstname.value || "";
                const lastName = dataObject.lastname?.value || "";
                addOrUpdateCard('name', 'ชื่อ', 'ชื่อ-นามสกุล', { firstName, lastName }, dataObject.firstname.order);
            }

            if ('sex' in dataObject && typeof dataObject.sex === 'object' && dataObject.sex !== null && 'value' in dataObject.sex && 'order' in dataObject.sex) {
                addOrUpdateCard('gender', 'เพศ', 'เพศ', { gender: dataObject.sex.value || "" }, dataObject.sex.order);
            }

            if ('birthdate' in dataObject && typeof dataObject.birthdate === 'object' && dataObject.birthdate !== null && 'value' in dataObject.birthdate && 'order' in dataObject.birthdate) {
                const dateOfBirth = dataObject.birthdate.value || null;
                const ageManual = dataObject.age_manual?.value || null;
                const ageData: AgeCardData = {
                    dateOfBirth: dateOfBirth,
                    age: ageManual !== null ? parseInt(String(ageManual)) : null,
                    isManualAge: ageManual !== null
                };
                addOrUpdateCard('age', 'อายุ', 'อายุ', ageData, dataObject.birthdate.order);
            }

            if (result.pf_case_Evidence_Data_Additional) {
              const additionalData = result.pf_case_Evidence_Data_Additional;
              Object.keys(additionalData).forEach(key => {
                  if (additionalData[key] && typeof additionalData[key] === 'object' && 'value' in additionalData[key] && 'order' in additionalData[key]) {
                      const title = key.split('|')[0];
                      const cardType = key.includes("|กำหนดเองแบบ2") ? "กำหนดเองแบบ2" : "กำหนดเองแบบ1";
                      addOrUpdateCard(`custom-${key}`, cardType, title, { data: additionalData[key].value }, additionalData[key].order);
                  }
              });
            }

            const sortedCards = Array.from(cardMap.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
            setDynamicCards(sortedCards);
          }
        })
        .catch((message: string) => {
          setParentErrorMessage(message);
          setParentShowError(true);
          setDynamicCards([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setDynamicCards([]);
    }
  }, [evidenceId, setParentErrorMessage, setParentShowError, setLoading]);
  
  const availableCardTypes = useMemo(() => {
    const evidenceCategory = evidenceType?.english?.toLowerCase();
    
    const existingCardTypes = new Set(dynamicCards.map(card => card.type));
    
    let options: { type: string; title: string; label: string }[] = [];
  
    const customOptions = [
      { type: "กำหนดเองแบบ1", title: "กำหนดเองแบบ 1", label: "กำหนดเองแบบ 1" },
      { type: "กำหนดเองแบบ2", title: "กำหนดเองแบบ 2", label: "กำหนดเองแบบ 2" },
    ];
  
    switch (evidenceCategory) {
      case 'person':
        options = [
          { type: "ชื่อ", title: "ชื่อ-นามสกุล", label: "ชื่อ-นามสกุล" },
          { type: "อายุ", title: "อายุ", label: "อายุ" },
          { type: "เพศ", title: "เพศ", label: "เพศ" },
          ...customOptions,
        ];
        break;
      case 'evidence':
        options = [...customOptions];
        break;
      case 'location':
        options = [
          { type: "ตำแหน่ง", title: "ตำแหน่ง", label: "ตำแหน่ง" },
          ...customOptions,
        ];
        break;
      case 'action':
        options = [
          { type: "วันที่และเวลา", title: "วันที่และเวลา", label: "วันที่และเวลา" },
          ...customOptions,
        ];
        break;
      default:
        options = [...customOptions];
        break;
    }
    
    return options.filter(option => {
        if (option.type.startsWith("กำหนดเอง")) {
            return true;
        }
        return !existingCardTypes.has(option.type);
    });
  }, [evidenceType, dynamicCards]);

  const handleAddCard = (type: string, title: string) => {
    setIsDropdownOpen(false);
    const newCard: DynamicCard = {
      id: `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      title: title,
      data: "",
      isEditingTitle: !NON_EDITABLE_CARD_TYPES.includes(type),
      order: dynamicCards.length
    };

    if (type === "วันที่และเวลา") {
      newCard.data = JSON.stringify({ start: {}, end: {}, isRangeMode: false });
    } else if (type === "ตำแหน่ง") {
      newCard.data = JSON.stringify({ 
        location: "",
        lat: null,
        lng: null,
        locationType: "แบบระบุตำแหน่ง",
        coordinates: []
      });
    } else if (type === "ชื่อ") {
      newCard.data = JSON.stringify({ firstName: "", lastName: "" });
    } else if (type === "เพศ") {
      newCard.data = JSON.stringify({ gender: "" });
    } else if (type === "อายุ") {
      newCard.data = JSON.stringify({ dateOfBirth: null, age: null, isManualAge: false });
    } else if (type.startsWith("กำหนดเอง")) {
      newCard.data = JSON.stringify({ data: "" });
    }

    setDynamicCards((prevCards) => [...prevCards, newCard]);
    setCardCollapsed(false);
    setIsEditingDynamicCards(true);
  };

  const handleRemoveCard = (id: string) => {
    setDynamicCards((prevCards) => prevCards.filter((card) => card.id !== id));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reorderedCards = Array.from(dynamicCards);
    const [removed] = reorderedCards.splice(result.source.index, 1);
    reorderedCards.splice(result.destination.index, 0, removed);

    const updatedCardsWithOrder = reorderedCards.map((card, index) => ({
        ...card,
        order: index
    }));

    setDynamicCards(updatedCardsWithOrder);
  };

  const handleCardDataChange = useCallback((cardId: string, updatedData: any) => {
    setDynamicCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId ? { ...card, data: updatedData } : card
      )
    );
  }, []);

  const handleUpdateNestedCardData = useCallback((cardId: string, updatedFields: { [key: string]: any }) => {
    setDynamicCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId
          ? { ...card, data: { ...card.data, ...updatedFields } }
          : card
      )
    );
  }, []);

  const handleCardTitleChange = (id: string, newTitle: string) => {
    setDynamicCards((prevCards) =>
      prevCards.map((card) => (card.id === id ? { ...card, title: newTitle } : card))
    );
  };

  const toggleCardTitleEdit = (id: string) => {
    setDynamicCards((prevCards) =>
      prevCards.map((card) =>
        card.id === id ? { ...card, isEditingTitle: !card.isEditingTitle } : card
      )
    );
  };

  const handleTitleInputBlur = (id: string) => {
    setDynamicCards((prevCards) =>
      prevCards.map((card) => (card.id === id ? { ...card, isEditingTitle: false } : card))
    );
  };

  const handleTitleInputKeyPress = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  const handleClickOutsideDropdown = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutsideDropdown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideDropdown);
    };
  }, [handleClickOutsideDropdown]);
  
  const handleStartEditing = () => {
      setInitialCardsOnEdit(JSON.parse(JSON.stringify(dynamicCards)));
      setIsEditingDynamicCards(true);
  };

  const handleSaveDynamicCards = async () => {

    if (!validateDynamicCards(dynamicCards, setErrorMessage, setShowError)) {
      return;
    }

    if (!evidenceId) {
      setErrorMessage("ไม่สามารถบันทึกข้อมูลเพิ่มเติมได้ เนื่องจากไม่มี ID พยานหลักฐานหลัก");
      setShowError(true);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setShowError(false);

    const payloadEvidenceData: { [key: string]: any } = {};
    const additionalEvidenceData: { [key: string]: any } = {};

    dynamicCards.forEach((card, index) => {
      switch (card.type) {
        case "วันที่และเวลา":
          if (card.data) {
            try {
              const cardData = typeof card.data === 'string' ? JSON.parse(card.data as string) : card.data;
              if (cardData?.start) {
                  const startData = cardData.start;
                  const endData = cardData.end;
                  const isRangeMode = cardData.isRangeMode;

                  const valueObject: any = {};
                  if (startData?.formatted) {
                      valueObject.datetime_start = startData.formatted;
                  }

                  if (isRangeMode && endData?.formatted) {
                      valueObject.datetime_end = endData.formatted;
                  }

                  if (Object.keys(valueObject).length > 0) {
                      payloadEvidenceData.datetime = {
                          order: index,
                          type: "datetime",
                          value: valueObject
                      };
                  }
              }
              else if (cardData?.datetime?.value?.datetime_start) {
                  const valueObject = cardData.datetime.value;
                  payloadEvidenceData.datetime = {
                      order: index,
                      type: "datetime",
                      value: valueObject
                  };
              }
            } catch (e) {
              console.error("Error transforming date card data for saving:", e);
            }
          }
          break;
        case "ชื่อ":
            payloadEvidenceData.firstname = {
                order: index,
                type: "text",
                value: card.data.firstName || ""
            };
            payloadEvidenceData.lastname = {
                order: index,
                type: "text",
                value: card.data.lastName || ""
            };
            break;
        case "เพศ":
            payloadEvidenceData.sex = {
                order: index,
                type: "sex",
                value: card.data.gender || ""
            };
            break;
        case "อายุ":
            if (card.data) {
                const ageCardData: AgeCardData = card.data as AgeCardData;
                const formattedDate = formatBirthdate(ageCardData);
                payloadEvidenceData.birthdate = {
                    order: index,
                    type: "birthdate",
                    value: formattedDate || ""
                };
                if (ageCardData.isManualAge && ageCardData.age !== null) {
                    payloadEvidenceData.age_manual = {
                        order: index,
                        type: "age",
                        value: ageCardData.age
                    };
                }
            }
            break;
        case "ตำแหน่ง":
            if (card.data) {
                let parsedLocationData: LocationData;
                try {
                  parsedLocationData = typeof card.data === 'string'
                    ? JSON.parse(card.data) as LocationData
                    : card.data as LocationData;
                } catch (e) {
                  console.error("Error parsing location card data:", e);
                  parsedLocationData = {
                    location: "", lat: null, lng: null, locationType: "แบบระบุตำแหน่ง", coordinates: []
                  };
                }

                let finalCoordinates: [number, number][] = [];
                if (parsedLocationData.locationType === "แบบระบุตำแหน่ง") {
                  if (
                    parsedLocationData.lat !== null && parsedLocationData.lat !== undefined &&
                    parsedLocationData.lng !== null && parsedLocationData.lng !== undefined
                  ) {
                    finalCoordinates = [[parsedLocationData.lat, parsedLocationData.lng]];
                  }
                } else if (Array.isArray(parsedLocationData.coordinates)) {
                  finalCoordinates = parsedLocationData.coordinates.filter(
                    (coord): coord is [number, number] =>
                      Array.isArray(coord) && coord.length === 2 &&
                      typeof coord[0] === 'number' && typeof coord[1] === 'number'
                  );
                }
                
                payloadEvidenceData.location = {
                  order: index,
                  type: "location",
                  value: finalCoordinates
                };
            }
            break;
        case "กำหนดเองแบบ1":
        case "กำหนดเองแบบ2":
          if (card.title && card.data?.data !== undefined) {
            const newKey = `${card.title.trim()}|${card.type}`;
            additionalEvidenceData[newKey] = {
                order: index,
                type: "text",
                value: String(card.data.data)
            };
          }
          break;
      }
    });

    const payloadData: any = {
      evidenceId: evidenceId,
      caseId: caseId,
      pf_case_Evidence_Lable: evidenceName,
      pf_case_Evidence_Category: evidenceType?.english || "",
      description: evidenceDescription,
      pf_case_Evidence_Data: payloadEvidenceData
    };

    if (Object.keys(additionalEvidenceData).length > 0) {
      payloadData.pf_case_Evidence_Data_Additional = additionalEvidenceData;
    }

    console.log(payloadData)

    try {
     await updateEvidenceAPI({ ...payloadData, evidenceId: evidenceId! });
     setSuccessMessage("บันทึกข้อมูลเพิ่มเติมสำเร็จ!");
     setShowSuccess(true);
     setIsEditingDynamicCards(false);
     setInitialCardsOnEdit(null);
     onSaveSuccess(evidenceId!);
    } catch (error: any) {
     console.error("Error saving dynamic cards:", error);
     let detailedErrorMessage = "เกิดข้อผิดพลาดในการบันทึกข้อมูลเพิ่มเติม";
     if (error instanceof Error) {
       detailedErrorMessage = error.message;
     } else if (typeof error === 'string') {
       detailedErrorMessage = error;
     }
     setErrorMessage(detailedErrorMessage);
     setShowError(true);
    } finally {
     setLoading(false);
    }
  };

  const handleCancelDynamicCards = () => {
    setIsEditingDynamicCards(false);
    setInitialCardsOnEdit(null);
    setLoading(true);
    setErrorMessage("");
    setShowError(false);

    if (evidenceId) {
      fetchEvidenceIdAPI({ evidenceId: evidenceId })
        .then((result: any) => {
          if (result.pf_case_Evidence_Data) {
            const dataObject = result.pf_case_Evidence_Data;
            const cardMap = new Map<string, DynamicCard>();

            const addOrUpdateCard = (uniqueKey: string, type: string, title: string, data: any, order: number) => {
              let card = cardMap.get(uniqueKey);
              if (!card) {
                card = {
                  id: `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: type,
                  title: title,
                  data: {},
                  isGeneratedFromBackend: true,
                  order: order
                } as DynamicCard;
                cardMap.set(uniqueKey, card);
              }
              card.data = { ...card.data, ...data };
              if (!NON_EDITABLE_CARD_TYPES.includes(type)) {
                card.title = title;
              }
              if (card.order === undefined) {
                card.order = order;
              }
            };

            if ('datetime' in dataObject && typeof dataObject.datetime === 'object' && dataObject.datetime !== null && 'value' in dataObject.datetime && 'order' in dataObject.datetime) {
                const dateTimeValue = dataObject.datetime.value;
                const parsedDateTimeData: CustomDateTimeData = {
                    start: dateTimeValue.datetime_start ? parseDateTimePart(dateTimeValue.datetime_start) : {},
                    end: dateTimeValue.datetime_end ? parseDateTimePart(dateTimeValue.datetime_end) : {}
                };
                addOrUpdateCard('datetime', 'วันที่และเวลา', 'วันที่และเวลา', JSON.stringify(parsedDateTimeData), dataObject.datetime.order);
            }

            if ('location' in dataObject && typeof dataObject.location === 'object' && dataObject.location !== null && 'value' in dataObject.location && 'order' in dataObject.location) {
              const locationValue = dataObject.location.value;
              const locationDescription = dataObject.location_description?.value || "";

              let locationType: "แบบระบุตำแหน่ง" | "แบบระบุพื้นที่" = "แบบระบุตำแหน่ง";
              let lat: number | null = null;
              let lng: number | null = null;
              let coordinates: [number, number][] = [];

              if (Array.isArray(locationValue) && locationValue.length > 0) {
                  if (locationValue.length === 1 && Array.isArray(locationValue[0]) && locationValue[0].length === 2) {
                      lat = locationValue[0][0];
                      lng = locationValue[0][1];
                      locationType = "แบบระบุตำแหน่ง";
                      if (lat !== null && lng !== null) {
                          coordinates = [[lat, lng]];
                      }
                  } else if (Array.isArray(locationValue[0])) {
                      coordinates = locationValue.filter(
                          (coord: any): coord is [number, number] =>
                              Array.isArray(coord) &&
                              coord.length === 2 &&
                              typeof coord[0] === 'number' &&
                              typeof coord[1] === 'number'
                      );
                      if (coordinates.length > 0) {
                          locationType = "แบบระบุพื้นที่";
                          if (coordinates.length === 1) {
                              lat = coordinates[0][0];
                              lng = coordinates[0][1];
                              locationType = "แบบระบุตำแหน่ง";
                          }
                      }
                  }
              }

              const locationData: LocationData = {
                  location: locationDescription,
                  lat: lat,
                  lng: lng,
                  locationType: locationType,
                  coordinates: coordinates
              };
              addOrUpdateCard('location', 'ตำแหน่ง', 'ตำแหน่ง', locationData, dataObject.location.order);
          }

            if ('firstname' in dataObject && typeof dataObject.firstname === 'object' && dataObject.firstname !== null && 'value' in dataObject.firstname && 'order' in dataObject.firstname) {
                const firstName = dataObject.firstname.value || "";
                const lastName = dataObject.lastname?.value || "";
                addOrUpdateCard('name', 'ชื่อ', 'ชื่อ-นามสกุล', { firstName, lastName }, dataObject.firstname.order);
            }

            if ('sex' in dataObject && typeof dataObject.sex === 'object' && dataObject.sex !== null && 'value' in dataObject.sex && 'order' in dataObject.sex) {
                addOrUpdateCard('gender', 'เพศ', 'เพศ', { gender: dataObject.sex.value || "" }, dataObject.sex.order);
            }

            if ('birthdate' in dataObject && typeof dataObject.birthdate === 'object' && dataObject.birthdate !== null && 'value' in dataObject.birthdate && 'order' in dataObject.birthdate) {
                const dateOfBirth = dataObject.birthdate.value || null;
                const ageManual = dataObject.age_manual?.value || null;
                const ageData: AgeCardData = {
                    dateOfBirth: dateOfBirth,
                    age: ageManual !== null ? parseInt(String(ageManual)) : null,
                    isManualAge: ageManual !== null
                };
                addOrUpdateCard('age', 'อายุ', 'อายุ', ageData, dataObject.birthdate.order);
            }

            if (result.pf_case_Evidence_Data_Additional) {
              const additionalData = result.pf_case_Evidence_Data_Additional;
              Object.keys(additionalData).forEach(key => {
                  if (additionalData[key] && typeof additionalData[key] === 'object' && 'value' in additionalData[key] && 'order' in additionalData[key]) {
                      const title = key.split('|')[0];
                      const cardType = key.includes("|กำหนดเองแบบ2") ? "กำหนดเองแบบ2" : "กำหนดเองแบบ1";
                      addOrUpdateCard(`custom-${key}`, cardType, title, { data: additionalData[key].value }, additionalData[key].order);
                  }
              });
            }

            const sortedCards = Array.from(cardMap.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
            setDynamicCards(sortedCards);
          }
        })
        .catch((message: string) => {
          setErrorMessage(message);
          setShowError(true);
          setDynamicCards([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setDynamicCards([]);
    }
  };

  const renderCardContent = (card: DynamicCard) => {
    switch (card.type) {
      case "ชื่อ":
        return <NameCard card={card} onDataChange={handleUpdateNestedCardData} isEditing={isEditingDynamicCards} />;
      case "เพศ":
        return <GenderCard card={card} onDataChange={handleUpdateNestedCardData} isEditing={isEditingDynamicCards} />;
      case "วันที่และเวลา":
        return <DateTimeCard card={card} onDataChange={handleCardDataChange} isEditing={isEditingDynamicCards} />;
      case "อายุ":
        return <AgeCard card={card} onDataChange={handleUpdateNestedCardData} isEditing={isEditingDynamicCards} />;
      case "ตำแหน่ง":
        return <LocationCard card={card} onDataChange={handleUpdateNestedCardData} isEditing={isEditingDynamicCards} />;
      case "กำหนดเองแบบ1":
      case "กำหนดเองแบบ2":
        return <CustomCard card={card} onDataChange={handleUpdateNestedCardData} isEditing={isEditingDynamicCards} />;
      default:
        return <div className="text-gray-500 text-xs">ประเภทการ์ดไม่ถูกต้อง</div>;
    }
  };

  return (
    <div className="relative bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-2">
      {showError && errorMessage && (
          <AlertPopup type="error" message={errorMessage} onClose={() => setShowError(false)} />
      )}
      {showSuccess && successMessage && (
          <AlertPopup type="success" message={successMessage} onClose={() => setShowSuccess(false)} />
      )}

      <div
  className="flex items-center justify-between cursor-pointer"
  onClick={() => setCardCollapsed(!cardCollapsed)}
>
  <h2 className="text-sm font-semibold text-white bg-[#223C79] rounded-lg px-3 py-1">
    ข้อมูลเพิ่มเติม
  </h2>
  <div className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors duration-200 mr-2">
    <span className="text-sm">
      {cardCollapsed ? "แสดง" : "ย่อ"}
    </span>
    {cardCollapsed ? (
      <FaChevronDown className="w-4 h-4" />
    ) : (
      <FaChevronUp className="w-4 h-4" />
    )}
  </div>
</div>


      {!cardCollapsed && (
        <>
          {canEdit &&(<div className="flex justify-end space-x-2 mt-4">
            {isEditingDynamicCards ? (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="inline-flex items-center justify-center gap-x-1.5 w-[88px] px-3 py-1.5 rounded-md text-xs transition-colors duration-200 bg-[#2A85FF] text-[#E7F3FF]"
                  >
                    <FaPlus className="w-4 h-4" /> เพิ่มการ์ด
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                      {availableCardTypes.length > 0 ? (
                        availableCardTypes.map((option) => (
                          <button
                            key={option.type}
                            onClick={() => handleAddCard(option.type, option.title)}
                            className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                            type="button"
                          >
                            {option.label}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-xs text-gray-500">ไม่มีการ์ดให้เพิ่มแล้ว</div>
                      )}
                    </div>
                  )}
                </div>

                <button
                    className={`inline-flex items-center justify-center gap-x-1.5 w-[88px] px-3 py-1 rounded-md text-xs transition-colors duration-200 ${
                        !hasUnsavedChanges
                            ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                            : 'bg-[#2A85FF] text-[#E7F3FF] hover:bg-blue-600'
                    }`}
                    onClick={handleSaveDynamicCards}
                    aria-label="บันทึก"
                    disabled={!hasUnsavedChanges}
                >
                    <FaSave className="text-xs" />
                    บันทึก
                </button>
                
                <button
                    className="inline-flex items-center justify-center gap-x-1.5 w-[88px] px-3 py-1 rounded-md text-xs transition-colors duration-200 bg-gray-300 text-gray-800 hover:bg-gray-400"
                    onClick={handleCancelDynamicCards}
                    aria-label="ยกเลิก"
                >
                    <FaTimes className="text-xs" />
                    ยกเลิก
                </button>
              </>
            ) : (
              <button
                  className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  aria-label="แก้ไขข้อมูลเพิ่มเติม"
                  onClick={handleStartEditing}
              >
                  <MdEditSquare className="text-xl" />
              </button>
            )}
          </div>)}

          <DragDropContext onDragEnd={onDragEnd}>
            {dynamicCards.length > 0 ? (
              <Droppable droppableId="dynamic-cards-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-4 p-4 rounded-lg border"
                    style={{ backgroundColor: "#E8F5FF", borderColor: "#67B3FF" }}
                  >
                    {dynamicCards.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index} isDragDisabled={!isEditingDynamicCards}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-4 rounded-lg shadow-md border border-dashed border-blue-400 min-h-[100px] flex flex-col justify-between relative ${
                                card.type === "ตำแหน่ง" || card.type === "กำหนดเองแบบ2"
                                  ? "md:col-span-2 lg:col-span-2"
                                  : "md:col-span-1 lg:col-span-1"
                            }`}
                          >
                            {isEditingDynamicCards && (
                              <button
                                onClick={() => handleRemoveCard(card.id)}
                                className="absolute -top-3 -right-3 bg-gray-400 hover:bg-gray-600 text-white rounded-full p-1 text-xs flex items-center justify-center shadow-md z-20"
                                aria-label="ลบการ์ด"
                              >
                                <FaTimesCircle className="h-5 w-5" />
                              </button>
                            )}

                            <div className="flex items-center gap-2 mb-2">
                              {NON_EDITABLE_CARD_TYPES.includes(card.type) ? (
                                <h4 className="text-xs font-semibold text-gray-800">
                                  {card.type === "ชื่อ" ? "ชื่อ-นามสกุล" : card.type}
                                </h4>
                              ) : (
                                <>
                                  {card.isEditingTitle && isEditingDynamicCards ? (
                                    <input
                                      type="text"
                                      id={`card-title-input-${card.id}`}
                                      className="flex-grow border border-gray-300 rounded-md p-2 text-xs font-semibold focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                      value={card.title}
                                      onChange={(e) => handleCardTitleChange(card.id, e.target.value)}
                                      onBlur={() => handleTitleInputBlur(card.id)}
                                      onKeyPress={(e) => handleTitleInputKeyPress(e, card.id)}
                                      autoFocus
                                    />
                                  ) : (
                                    <div className="flex items-center flex-grow">
                                      <h4 className="text-xs font-semibold text-gray-800 break-words max-w-[calc(100%-25px)]">
                                        {card.title}
                                      </h4>
                                      {isEditingDynamicCards && (
                                        <button
                                          onClick={() => toggleCardTitleEdit(card.id)}
                                          className="ml-2 text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-gray-100 transition duration-150 ease-in-out"
                                          aria-label="แก้ไขหัวข้อการ์ด"
                                          data-card-id={card.id}
                                        >
                                          <FaEdit className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {renderCardContent(card)}

                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ) : (
              <div
                className="p-4 text-center text-blue-600 border border-dashed border-gray-300 rounded-md text-xs h-30 flex items-center justify-center mt-4"
                style={{ backgroundColor: "#E8F5FF", borderColor: "#67B3FF" }}
              >
                "เพิ่มการ์ดข้อมูลใหม่ และสามารถลากเพื่อจัดเรียงลำดับการแสดงผลได้ตามต้องการ"
              </div>
            )}
          </DragDropContext>
        </>
      )}
    </div>
  );
};

export default DynamicEvidenceCardsSection;