import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MdClose, MdSearch } from 'react-icons/md';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import AlertPopup from '../../components/common/AlertPopup';

const getFullLocalizedFileType = (mimeType: string, fileExtension: string): string => {
  if (mimeType.startsWith('image/')) return `รูปภาพ/${fileExtension}`;
  if (mimeType.startsWith('audio/')) return `เสียง/${fileExtension}`;
  if (mimeType.startsWith('video/')) return `วิดีโอ/${fileExtension}`;
  if (
    mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('powerpoint') ||
    mimeType.includes('csv') || mimeType.includes('pdf') || mimeType.includes('text/') ||
    mimeType.includes('application/msword') ||
    mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
    mimeType.includes('application/vnd.ms-excel') ||
    mimeType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
    mimeType.includes('application/vnd.ms-powerpoint') ||
    mimeType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation') ||
    mimeType.includes('application/pdf') || mimeType.includes('text/csv')
  ) {
    return `เอกสาร/${fileExtension}`;
  }
  return `ไม่ระบุ/${fileExtension}`;
};

const getInternalBaseFileType = (fullLocalizedType: string): string => fullLocalizedType.split('/')[0];

const getDisplayTypeForButton = (type: string): string =>
  type === 'วิดีโอ' ? 'วิดีโอ' : type === 'เอกสาร' ? 'ไฟล์' : type;

export interface EvidenceItem {
  id: string;
  name: string;
  mimeType: string;
  fileExtension: string;
  size: string;
}

interface EditRelationshipPopupProps {
  isOpen: boolean;
  onClose: () => void;
  availableEvidenceData: EvidenceItem[];
  onAddSelectedEvidence: (selectedItems: EvidenceItem[]) => void;
  initialSelectedEvidenceIds?: string[];
}

const EditRelationshipPopup: React.FC<EditRelationshipPopupProps> = ({
  isOpen,
  onClose,
  availableEvidenceData,
  onAddSelectedEvidence,
  initialSelectedEvidenceIds = []
}) => {
  const [popupSearchTerm, setPopupSearchTerm] = useState('');
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<Set<string>>(new Set(initialSelectedEvidenceIds));
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedEvidenceIds(new Set());
      setPopupSearchTerm('');
      setIsLoading(false);
      setAlert(null);
    } else {
      setAlert(null);
    }
  }, [isOpen]);
  

  const portalRoot = useMemo(() => {
    let element = document.getElementById('alert-portal-root');
    if (!element) {
      element = document.createElement('div');
      element.id = 'alert-portal-root';
      document.body.appendChild(element);
    }
    return element;
  }, []);

  const filteredItems = useMemo(() => {
    return availableEvidenceData.filter(item => {
      const term = popupSearchTerm.toLowerCase();
      const type = getDisplayTypeForButton(
        getInternalBaseFileType(getFullLocalizedFileType(item.mimeType, item.fileExtension))
      ).toLowerCase();
      return (
        item.name.toLowerCase().includes(term) ||
        item.fileExtension.toLowerCase().includes(term) ||
        type.includes(term)
      );
    });
  }, [popupSearchTerm, availableEvidenceData]);

  const handleCheckboxChange = (id: string) => {
    setSelectedEvidenceIds(prev => {
      const updated = new Set(prev);
      updated.has(id) ? updated.delete(id) : updated.add(id);
      return updated;
    });
    if (alert?.type === 'error') setAlert(null);
  };

  const handleAdd = () => {
    const selected = availableEvidenceData.filter(item => selectedEvidenceIds.has(item.id));
    if (!selected.length) {
      setAlert({ type: 'error', message: 'กรุณาเลือกไฟล์พยานหลักฐานก่อนบันทึก' });
      return;
    }
    onAddSelectedEvidence(selected);
    onClose();
  };

  return (
    <div className={`fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
        >
          <MdClose className="text-xl" />
        </button>
        <h2 className="text-base font-bold mb-5 text-center text-gray-800">เพิ่มพยานหลักฐานที่ต้องการเชื่อมความสัมพันธ์</h2>
        <div className="relative mb-4">
          <input
            type="text"
            value={popupSearchTerm}
            onChange={(e) => setPopupSearchTerm(e.target.value)}
            placeholder="ค้นหาพยานหลักฐาน"
            className="border border-gray-300 rounded-md w-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex-grow overflow-y-auto border rounded-md border-gray-200">
          {filteredItems.length ? (
            filteredItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50">
                <div className="flex flex-grow rounded-md overflow-hidden h-[34px]">
                  <span className="min-w-[85px] text-xs bg-[#E8F5FF] border border-[#0059C8] text-[#0059C8] rounded-l-md flex items-center justify-center px-3">
                    {getDisplayTypeForButton(getInternalBaseFileType(getFullLocalizedFileType(item.mimeType, item.fileExtension)))}
                  </span>
                  <div className="bg-white border-t border-b border-r border-[#D7E6F9] rounded-r-md flex-grow px-3 flex items-center justify-between">
                    <span className="truncate text-sm text-[#191919]">{item.name}</span>
                    <input
                      type="checkbox"
                      checked={selectedEvidenceIds.has(item.id)}
                      onChange={() => handleCheckboxChange(item.id)}
                      className="h-5 w-5 ml-3 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-sm text-gray-500">ไม่พบข้อมูลพยานหลักฐาน</p>
          )}
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
          >ยกเลิก</button>
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >เพิ่ม</button>
        </div>
      </div>
      {isLoading && <LoadingOverlay />}
      {alert && ReactDOM.createPortal(
        <AlertPopup
          message={alert.message}
          onClose={() => setAlert(null)}
          type={alert.type}
        />,
        portalRoot
      )}
    </div>
  );
};

export default EditRelationshipPopup;
