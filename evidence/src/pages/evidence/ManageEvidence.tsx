import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { MdEditSquare } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCaseIdAPI } from "../../api/caseHandlers";
import {
  addEvidenceAPI,
  fetchEvidenceIdAPI,
  updateEvidenceAPI,
} from "../../api/evidenceHandlers";
import AlertPopup from "../../components/common/AlertPopup";
import FileUploader from "../../components/common/FileUploader";
import Header from "../../components/common/Header";
import LeftMenu from "../../components/common/LeftMenu";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import RelatedEvidenceSection from "../../components/common/RelatedEvidenceSection";
import DynamicEvidenceCardsSection from "../../components/evidence/DynamicEvidenceCards/DynamicEvidenceCardsSection";
import { CaseModel } from "../../types/case";
import { UserCase } from "../../types/user";

interface EvidenceTypeData {
  thai: string;
  english: string;
}

interface EvidenceTypeOption {
  value: EvidenceTypeData | null;
  label: string;
}

const defaultCaseForm: Partial<CaseModel> = {
  type: "",
  caseNumber: "",
  caseName: "",
  description: "",
  caseStatus: true,
};

const evidenceTypeOptions: EvidenceTypeOption[] = [
  { value: null, label: "เลือกประเภทพยานหลักฐาน" },
  { value: { thai: "พยานบุคคล", english: "Person" }, label: "พยานบุคคล" },
  { value: { thai: "หลักฐาน", english: "Evidence" }, label: "หลักฐาน" },
  { value: { thai: "ตำแหน่ง", english: "Location" }, label: "ตำแหน่ง" },
  { value: { thai: "การกระทำ", english: "Action" }, label: "การกระทำ" },
];

const ManageEvidencePage = () => {
  const navigate = useNavigate();
  const { id, evidenceId } = useParams<{ id: string; evidenceId?: string }>();
  const session = JSON.parse(localStorage.getItem("session") || "{}");
  const userId = session?.user_id ? session?.user_id : "";
  const [members, setMembers] = useState<UserCase[]>([]);
  const [casePermission, setCasePermission] = useState<UserCase | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const isCreateMode = !evidenceId;
  const [pageTitle, setPageTitle] = useState(["จัดการคดี", "เพิ่มพยานหลักฐาน"]);

  const [caseDetails, setCaseDetails] =
    useState<Partial<CaseModel>>(defaultCaseForm);
  const [caseLoading, setCaseLoading] = useState(true);

  const [evidenceType, setEvidenceType] = useState<EvidenceTypeData | null>(
    null
  );
  const [evidenceName, setEvidenceName] = useState<string>("");
  const [evidenceDescription, setEvidenceDescription] = useState<string>("");
  const [currentEvidenceId, setCurrentEvidenceId] = useState<string | null>(
    evidenceId || null
  );

  const [formErrors, setFormErrors] = useState<{
    evidenceType?: string;
    evidenceName?: string;
    evidenceDescription?: string;
  }>({});

  const [cardCollapsed, setCardCollapsed] = useState(isCreateMode);
  const [relatedEvidenceCollapsed, setRelatedEvidenceCollapsed] =
    useState(isCreateMode);
  const [isEditing, setIsEditing] = useState<boolean>(isCreateMode);
  const [filesData, setFilesData] = useState<any[]>([]);

  useEffect(() => {
    setCardCollapsed(isCreateMode);
    setRelatedEvidenceCollapsed(isCreateMode);
    setIsEditing(isCreateMode);
  }, [isCreateMode]);

  useEffect(() => {
    if (id) {
      setCaseLoading(true);
      fetchCaseIdAPI({ caseId: id })
        .then((result: Partial<CaseModel>) => {
          setCaseDetails(result);
          setMembers(result.permissions ?? []);
        })
        .catch((message: string) => {
          setErrorMessage(message);
          setShowError(true);
          setCaseDetails(defaultCaseForm);
        })
        .finally(() => {
          setCaseLoading(false);
        });
    } else {
      setCaseDetails(defaultCaseForm);
      setErrorMessage("ไม่พบ ID คดีใน URL");
      setShowError(true);
      setCaseLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (members.length > 0) {
      const matched = members.find((m) => m.id === userId) || null;
      setCasePermission(matched);
    }
  }, [members, userId]);

  useEffect(() => {
    if (evidenceId) {
      setLoading(true);
      fetchEvidenceIdAPI({ evidenceId: evidenceId })
        .then((result: any) => {
          setEvidenceName(result.pf_case_Evidence_Lable || "");

          const fetchedEvidenceType =
            evidenceTypeOptions.find(
              (opt) => opt?.value?.english === result.pf_case_Evidence_Category
            )?.value || null;
          setEvidenceType(fetchedEvidenceType);

          setEvidenceDescription(result.pf_case_Evidence_Description || "");
          setCurrentEvidenceId(evidenceId);

          try {
            if (result.pf_case_Evidence_File) {
              const files =
                typeof result.pf_case_Evidence_File === "string"
                  ? JSON.parse(result.pf_case_Evidence_File)
                  : result.pf_case_Evidence_File;

              if (Array.isArray(files) && files.length > 0) {
                const latestFile = files.reduce((latest, current) => {
                  return new Date(current.datetime) > new Date(latest.datetime) ? current : latest;
                });

                setFilesData([latestFile]);
              } else {
                setFilesData([]);
              }
            }
          } catch (e) {
            console.error("Error parsing file data:", e);
            setFilesData([]);
          }

          setPageTitle((prev) => {
            const newTitle = [...prev];

            if (casePermission?.status === "Guest") {
              newTitle[1] = "ดูข้อมูลพยานหลักฐาน";
            } else {
              newTitle[1] = evidenceId
                ? "แก้ไขพยานหลักฐาน"
                : "เพิ่มพยานหลักฐาน";
            }

            return newTitle;
          });
        })
        .catch((message: string) => {
          setErrorMessage(message);
          setShowError(true);
          setEvidenceType(null);
          setEvidenceName("");
          setEvidenceDescription("");
          setCurrentEvidenceId(null);
          setFilesData([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setEvidenceType(null);
      setEvidenceName("");
      setEvidenceDescription("");
      setCurrentEvidenceId(null);
      setFilesData([]);
    }
  }, [casePermission?.status, evidenceId]);

  const validateForm = () => {
    const errors: typeof formErrors = {};
    if (
      !evidenceType ||
      !evidenceType.thai.trim() ||
      !evidenceType.english.trim()
    ) {
      errors.evidenceType = "กรุณาเลือกประเภทพยานหลักฐาน";
    }
    if (!evidenceName.trim()) {
      errors.evidenceName = "กรุณากรอกชื่อพยานหลักฐาน";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEvidence = async () => {
    setLoading(true);
    setErrorMessage("");
    setShowError(false);
    try {
      if (!evidenceName.trim()) {
        setErrorMessage("กรุณากรอกชื่อพยานหลักฐาน");
        setShowError(true);
        return;
      }
      if (!evidenceType) {
        setErrorMessage("กรุณาเลือกประเภทพยานหลักฐาน");
        setShowError(true);
        return;
      }

      let existingEvidenceData: any = {};
      if (currentEvidenceId) {
        const fetchedEvidence = await fetchEvidenceIdAPI({
          evidenceId: currentEvidenceId,
        });
        existingEvidenceData =
          typeof fetchedEvidence.pf_case_Evidence_Data === "string"
            ? JSON.parse(fetchedEvidence.pf_case_Evidence_Data)
            : fetchedEvidence.pf_case_Evidence_Data || {};
      }

      const payload = {
        evidenceId: currentEvidenceId!,
        caseId: id!,
        pf_case_Evidence_Lable: evidenceName,
        pf_case_Evidence_Category: evidenceType?.english || "",
        description: evidenceDescription,
        pf_case_Evidence_Data: existingEvidenceData,
      };

      if (!currentEvidenceId) {
        const result = await addEvidenceAPI(payload);
        setCurrentEvidenceId(result.Created_ID);
        setErrorMessage("บันทึกข้อมูลหลักสำเร็จ!");
        const newEvidenceDetails = await fetchEvidenceIdAPI({
          evidenceId: result.Created_ID,
        });
        setEvidenceName(newEvidenceDetails.pf_case_Evidence_Lable || "");
        const fetchedEvidenceType =
          evidenceTypeOptions.find(
            (opt) =>
              opt?.value?.english ===
              newEvidenceDetails.pf_case_Evidence_Category
          )?.value || null;
        setEvidenceType(fetchedEvidenceType);
        setEvidenceDescription(
          newEvidenceDetails.pf_case_Evidence_Description || ""
        );
        navigate(
          `/manage-case/update-case/${id}/update-evidence/${result.Created_ID}`
        );
      } else {
        await updateEvidenceAPI({
          ...payload,
          evidenceId: currentEvidenceId!,
        });
        setErrorMessage("บันทึกข้อมูลหลักสำเร็จ!");
        const updatedEvidenceData = await fetchEvidenceIdAPI({
          evidenceId: currentEvidenceId,
        });
        setEvidenceName(updatedEvidenceData.pf_case_Evidence_Lable || "");
        setEvidenceDescription(
          updatedEvidenceData.pf_case_Evidence_Description || ""
        );
        
        if (updatedEvidenceData.pf_case_Evidence_Files) {
          const files =
            typeof updatedEvidenceData.pf_case_Evidence_Files === "string"
              ? JSON.parse(updatedEvidenceData.pf_case_Evidence_Files)
              : updatedEvidenceData.pf_case_Evidence_Files;
          if (Array.isArray(files)) {
            setFilesData(files.length > 0 ? [files[files.length - 1]] : []);
          }
        }
      }
      setShowError(true);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving evidence header:", error);
      let detailedErrorMessage = "เกิดข้อผิดพลาดในการบันทึกข้อมูลหลัก";
      if (error instanceof Response) {
        const errorBody = await error.json().catch(() => ({}));
        detailedErrorMessage = `เกิดข้อผิดพลาดจาก API: ${error.status} ${error.statusText}`;
        if (errorBody.message) {
          detailedErrorMessage += ` - ${errorBody.message}`;
        } else if (JSON.stringify(errorBody) !== "{}") {
          detailedErrorMessage += ` - ${JSON.stringify(errorBody)}`;
        }
      } else if (error instanceof Error) {
        detailedErrorMessage = error.message;
      }
      setErrorMessage(detailedErrorMessage);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDynamicCardsSaveSuccess = (updatedEvidenceId: string) => {
    console.log(
      "Dynamic cards saved successfully for evidence ID:",
      updatedEvidenceId
    );
  };

  return (
    <div className="grid lg:grid-cols-6 lg:bg-menu min-h-screen">
      <div className="hidden lg:block lg:h-full">
        <LeftMenu />
      </div>
      {loading && <LoadingOverlay />}
      {showError && (
        <AlertPopup
          message={errorMessage}
          onClose={() => setShowError(false)}
          type={errorMessage.includes("สำเร็จ") ? "success" : "error"}
        />
      )}

      <div className="bg-[#FFFFFF] min-h-screen col-span-5 rounded-s-3xl overflow-y-auto">
        <Header headerText={pageTitle} />
        <div className="container mx-auto lg:p-4">
          <div className="mb-4">
            <div className="w-full sm:mt-3 mb-2 sm:mb-3 md:ps-4 flex flex-wrap justify-between items-center gap-2">
              <div className="hidden sm:block">
                <button
                  onClick={() =>
                    navigate(`/manage-case/update-case/${id}/evidence/`)
                  }
                  className="cursor-pointer border border-blue-500 text-blue-500 px-4 py-2 rounded-md hover:bg-blue-50 transition text-sm"
                >
                  ย้อนกลับ
                </button>
              </div>
            </div>
            <div className="px-4">
              <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center text-sm mb-6">
                  <div className="flex items-center flex-wrap gap-x-2">
                    {caseLoading ? (
                      <span className="bg-blue-100 text-blue-600 font-medium px-2.5 py-0.5 rounded animate-pulse text-sm">
                        กำลังโหลดข้อมูลคดี...
                      </span>
                    ) : caseDetails ? (
                      <>
                        <span className="bg-blue-100 text-blue-600 font-medium px-2.5 py-0.5 rounded text-sm">
                          {caseDetails.type || "ไม่ระบุประเภท"}
                        </span>

                        <span className="bg-blue-100 text-blue-600 font-medium px-2.5 py-0.5 rounded text-sm">
                          {caseDetails.caseNumber || "ไม่ระบุเลขที่คดี"}
                        </span>

                        <span className="bg-blue-100 text-blue-600 font-medium px-2.5 py-0.5 rounded text-sm">
                          {caseDetails.caseName || "ไม่ระบุชื่อคดี"}
                        </span>
                      </>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 font-medium px-2.5 py-0.5 rounded text-sm">
                        ไม่พบข้อมูลคดี
                      </span>
                    )}
                  </div>
                  {casePermission?.status != "Guest" && (
                    <div className="flex gap-2 justify-end mt-4 md:mt-0">
                      {isCreateMode ? (
                        <button
                          onClick={handleSaveEvidence}
                          className={`px-6 py-2 rounded-md text-white font-semibold transition text-sm ${
                            !evidenceType ||
                            !evidenceType.thai.trim() ||
                            !evidenceType.english.trim() ||
                            !evidenceName.trim()
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                          disabled={
                            !evidenceType ||
                            !evidenceType.thai.trim() ||
                            !evidenceType.english.trim() ||
                            !evidenceName.trim()
                          }
                        >
                          บันทึก
                        </button>
                      ) : (
                        <>
                          {!isEditing && (
                            <button
                              className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                              aria-label="แก้ไขข้อมูลหลัก"
                              onClick={() => setIsEditing(true)}
                            >
                              <MdEditSquare className="text-xl" />
                            </button>
                          )}
                          {isEditing && (
                            <>
                              <button
                                onClick={handleSaveEvidence}
                                className={`px-6 py-2 rounded-md text-white font-semibold transition text-sm ${
                                  !evidenceType ||
                                  !evidenceType.thai.trim() ||
                                  !evidenceType.english.trim() ||
                                  !evidenceName.trim()
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                }`}
                                disabled={
                                  !evidenceType ||
                                  !evidenceType.thai.trim() ||
                                  !evidenceType.english.trim() ||
                                  !evidenceName.trim()
                                }
                              >
                                บันทึก
                              </button>
                              <button
                                className="inline-flex items-center justify-center gap-x-1.5 w-[88px] px-3 py-1.5 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-sm transition-colors duration-200"
                                onClick={handleCancel}
                                aria-label="ยกเลิก"
                              >
                                <FaTimes className="text-sm" />
                                ยกเลิก
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="evidenceType"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      ประเภทพยานหลักฐาน <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="evidenceType"
                      name="evidenceType"
                      value={evidenceType ? evidenceType.thai : ""}
                      onChange={(e) => {
                        const selectedLabel = e.target.value;
                        const selectedOption = evidenceTypeOptions.find(
                          (opt) => opt?.value?.thai === selectedLabel
                        );
                        setEvidenceType(
                          selectedOption ? selectedOption.value : null
                        );
                        setFormErrors((prev) => ({
                          ...prev,
                          evidenceType: undefined,
                        }));
                      }}
                      className={`mt-1 block w-full pl-3 pr-10 py-2 border ${
                        formErrors.evidenceType
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md text-sm`}
                      disabled={!isCreateMode && !isEditing}
                    >
                      {evidenceTypeOptions.map((option) => (
                        <option
                          key={option.label}
                          value={option.value ? option.value.thai : ""}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.evidenceType && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.evidenceType}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="evidenceName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      ชื่อพยานหลักฐาน <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="evidenceName"
                      name="evidenceName"
                      value={evidenceName}
                      onChange={(e) => {
                        setEvidenceName(e.target.value);
                        setFormErrors((prev) => ({
                          ...prev,
                          evidenceName: undefined,
                        }));
                      }}
                      className={`mt-1 block w-full shadow-sm ${
                        formErrors.evidenceName
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md p-2 text-sm`}
                      placeholder="ชื่อพยานหลักฐาน เช่น ภาพถ่ายจากกล้องวงจรปิด"
                      disabled={!isCreateMode && !isEditing}
                    />
                    {formErrors.evidenceName && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.evidenceName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="evidenceDescription"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    คำอธิบาย <span className="text-red-500"></span>
                  </label>
                  <textarea
                    id="evidenceDescription"
                    name="evidenceDescription"
                    rows={3}
                    value={evidenceDescription}
                    onChange={(e) => {
                      setEvidenceDescription(e.target.value);
                      setFormErrors((prev) => ({
                        ...prev,
                        evidenceDescription: undefined,
                      }));
                    }}
                    className={`mt-1 block w-full shadow-sm ${
                      formErrors.evidenceDescription
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md p-2 text-sm`}
                    placeholder="รายละเอียดเพิ่มเติมของพยานหลักฐาน"
                    disabled={!isCreateMode && !isEditing}
                  ></textarea>
                  {formErrors.evidenceDescription && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.evidenceDescription}
                    </p>
                  )}
                </div>
              </div>
              {evidenceId && (
                <div className="space-y-4 mt-2">
                  {/* อัปโหลดไฟล์ */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <FileUploader
                      isCreateMode={isCreateMode}
                      initialCollapsed={isCreateMode}
                      canEdit={casePermission?.status !== "Guest"}
                      filesData={filesData}
                      pf_case_Evidence_ID={evidenceId}
                    />
                  </div>

                  {/* แบบฟอร์มพยานหลักฐานเพิ่มเติม */}
                  <DynamicEvidenceCardsSection
                    caseId={id!}
                    evidenceId={currentEvidenceId}
                    evidenceName={evidenceName}
                    evidenceType={evidenceType}
                    evidenceDescription={evidenceDescription}
                    setErrorMessage={setErrorMessage}
                    setShowError={setShowError}
                    setLoading={setLoading}
                    isCreateMode={isCreateMode}
                    initialCollapsed={isCreateMode}
                    onSaveSuccess={handleDynamicCardsSaveSuccess}
                    canEdit={casePermission?.status !== "Guest"}
                  />

                  {/* พยานหลักฐานที่เกี่ยวข้อง */}
                  <RelatedEvidenceSection
                    isCreateMode={isCreateMode}
                    initialCollapsed={relatedEvidenceCollapsed}
                    canEdit={casePermission?.status !== "Guest"}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageEvidencePage;