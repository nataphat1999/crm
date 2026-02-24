import moment from "moment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BiChevronDown, BiSearchAlt } from "react-icons/bi";
import {
  FaFileAlt,
  FaFileSignature,
  FaHandPaper,
  FaImage,
  FaMapMarkerAlt,
  FaNetworkWired,
  FaTrashAlt,
  FaUser,
  FaVideo,
  FaVolumeUp,
} from "react-icons/fa";
import { MdEditSquare, MdManageSearch } from "react-icons/md";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchCaseIdAPI } from "../../api/caseHandlers";
import {
  deleteEvidenceAPI,
  fetchEvidencesByCaseIdAPI,
} from "../../api/evidenceHandlers";
import AlertPopup from "../../components/common/AlertPopup";
import ConfirmPopUp from "../../components/common/ConfirmPopup";
import { DateRangePickerOne } from "../../components/common/DateRangePickerOne";
import Header from "../../components/common/Header";
import LeftMenu from "../../components/common/LeftMenu";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import MultiSelectDropdown from "../../components/common/MultiSelectDropdown";
import Pagination from "../../components/common/Pagination";
import ResponsiveEvidenceTable, {
  GenericColumn,
} from "../../components/common/ResponsiveEvidenceTable";
import { CaseModel } from "../../types/case";
import { UserCase } from "../../types/user";

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

const EVIDENCE_CATEGORY_MAP: { [key: string]: string } = {
  Person: "พยานบุคคล",
  Evidence: "หลักฐาน",
  Location: "ตำแหน่ง",
  Action: "การกระทำ",
};

interface IDateRange {
  startDate: Date | null;
  endDate: Date | null;
}

const defaultCaseForm: Partial<CaseModel> = {
  type: "",
  caseNumber: "",
  caseName: "",
  description: "",
  caseStatus: true,
};

const EvidenceCasePage = () => {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(false);
  const [evidenceTypeValue, setEvidenceTypeValue] = useState<string[]>([]);
  const [fileTypeValue, setFileTypeValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [createdDateRange, setCreatedDateRange] = useState<IDateRange | null>(null);
  const [updatedDateRange, setUpdatedDateRange] = useState<IDateRange | null>(null);

  const { id } = useParams<{ id: string }>();
  const [userId, setUserId] = useState<string>("");

  const [members, setMembers] = useState<UserCase[]>([]);
  const [casePermission, setCasePermission] = useState<UserCase | null>(null);
  const [pageTitle, setPageTitle] = useState<string[]>(["จัดการคดี", "พยานหลักฐาน"]);

  const [caseDetails, setCaseDetails] = useState<Partial<CaseModel>>(defaultCaseForm);
  const [caseLoading, setCaseLoading] = useState<boolean>(true);

  const [allEvidenceData, setAllEvidenceData] = useState<any[]>([]);
  const [filteredAndPaginatedEvidence, setFilteredAndPaginatedEvidence] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingEvidence, setLoadingEvidence] = useState<boolean>(false);

  const [showImportDropdown, setShowImportDropdown] = useState<boolean>(false);
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  const importDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [evidenceToDelete, setEvidenceToDelete] = useState<any | null>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [toggleCleared, setToggleCleared] = useState<boolean>(false);
  const [importPopupErrorMessage, setImportPopupErrorMessage] = useState<string>("");

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("session") || "{}");
    if (session?.user_id) {
      setUserId(session.user_id);
    }
  }, []);

  const handleRowSelected = useCallback((state: { selectedRows: any[] }) => {
    setSelectedRows(state.selectedRows);
  }, []);

  useEffect(() => {
    if (!id || !userId) return;
    setCaseLoading(true);
    fetchCaseIdAPI({ caseId: id })
      .then((result: Partial<CaseModel>) => {
        setCaseDetails(result);
        const perms = result.permissions ?? [];
        setMembers(perms);

        const matched = perms.find((m) => m.id === userId) || null;
        setCasePermission(matched);

        if (matched?.status === "Guest") {
          setPageTitle((prev) => {
            const newTitle = [...prev];
            newTitle[1] = "ดูข้อมูลพยานหลักฐาน";
            return newTitle;
          });
        }
      })
      .catch((message: string) => {
        setErrorMessage(message);
        setShowError(true);
      })
      .finally(() => {
        setCaseLoading(false);
      });
  }, [id, userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        importDropdownRef.current &&
        !importDropdownRef.current.contains(event.target as Node)
      ) {
        setShowImportDropdown(false);
      }
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchAllEvidences = useCallback(async () => {
    if (!id) {
      setAllEvidenceData([]);
      setLoadingEvidence(false);
      return;
    }

    setLoadingEvidence(true);
    try {
      const response = await fetchEvidencesByCaseIdAPI({
        caseId: id,
        page: 1,
        pageSize: 99999,
        keyword: "",
      });
      setAllEvidenceData(response.data || []);
    } catch (error: any) {
      console.error("Error fetching all evidence:", error);
      setErrorMessage(error.message || "ไม่สามารถโหลดข้อมูลหลักฐานได้");
      setShowError(true);
      setAllEvidenceData([]);
    } finally {
      setLoadingEvidence(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAllEvidences();
  }, [fetchAllEvidences]);

  useEffect(() => {
    let filtered = allEvidenceData;

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (item) =>
          item.pf_case_Evidence_Lable
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.evidence_description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          EVIDENCE_CATEGORY_MAP[item.pf_case_Evidence_Category]
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.pf_case_Evidence_File_Latest?.pf_case_Evidence_Filename?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (evidenceTypeValue.length > 0) {
      filtered = filtered.filter((item) =>
        evidenceTypeValue.includes(item.pf_case_Evidence_Category)
      );
    }

    if (fileTypeValue !== "") {
      filtered = filtered.filter((item) => {
        const fileExtension = item.pf_case_Evidence_File_Latest?.pf_case_Evidence_Extension;
        if (!fileExtension) return false;

        const lowerCaseExt = fileExtension.toLowerCase();
        let itemFileType = "";

        if ([".jpg", ".jpeg", ".png", ".gif"].includes(lowerCaseExt)) {
          itemFileType = "รูปภาพ";
        } else if ([".mp4", ".avi", ".mov"].includes(lowerCaseExt)) {
          itemFileType = "วีดีโอ";
        } else if ([".mp3", ".wav"].includes(lowerCaseExt)) {
          itemFileType = "เสียง";
        } else {
          itemFileType = "เอกสาร";
        }

        return itemFileType === fileTypeValue;
      });
    }

    if (createdDateRange?.startDate && createdDateRange?.endDate) {
      filtered = filtered.filter((item) => {
        if (!item.pf_case_Evidence_Create_Time) {
          return false;
        }
        const itemCreatedAt = moment(
          item.pf_case_Evidence_Create_Time,
          "YYYY-MM-DD HH:mm:ss"
        );
        const rangeStart = moment(createdDateRange.startDate).startOf("day");
        const rangeEnd = moment(createdDateRange.endDate).endOf("day");

        return itemCreatedAt.isBetween(rangeStart, rangeEnd, null, "[]");
      });
    }

    if (
      updatedDateRange?.startDate instanceof Date &&
      updatedDateRange?.endDate instanceof Date
    ) {
      filtered = filtered.filter((item) => {
        const rawTime = item.pf_case_Evidence_Update_Time;
        if (!rawTime) return false;

        const itemUpdatedAt = moment(rawTime);
        if (!itemUpdatedAt.isValid()) return false;

        const rangeStart = moment(updatedDateRange.startDate).startOf("day");
        const rangeEnd = moment(updatedDateRange.endDate).endOf("day");

        return itemUpdatedAt.isBetween(rangeStart, rangeEnd, null, "[]");
      });
    }

    setTotalRows(filtered.length);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    setFilteredAndPaginatedEvidence(filtered.slice(startIndex, endIndex));
  }, [
    allEvidenceData,
    searchTerm,
    evidenceTypeValue,
    fileTypeValue,
    createdDateRange,
    updatedDateRange,
    currentPage,
    perPage,
  ]);

  const handleAddEvidenceClick = () => {
    if (id) {
      navigate(`/manage-case/update-case/${id}/add-evidence`);
      setShowImportDropdown(false);
    } else {
      setErrorMessage("ไม่พบ ID คดีใน URL ไม่สามารถเพิ่มพยานหลักฐานได้");
      setShowError(true);
    }
  };

  const cancelDownloadCheckedFiles = () => {
    setToggleCleared(true);
    setSelectedRows([]);
    setTimeout(() => setToggleCleared(false), 0);
  };

  const handleDownloadCheckedFiles = async () => {
      if (selectedRows.length === 0) {
          setImportPopupErrorMessage("กรุณาเลือกไฟล์ที่ต้องการส่งออก");
          return;
      }

      for (const row of selectedRows) {
          const filePath = row.pf_case_Evidence_File_Latest?.pf_case_Evidence_Path;
          const originalFileName = row.pf_case_Evidence_File_Latest?.pf_case_Evidence_Filename;
          const fileNameToDownload = originalFileName || 'downloaded_file';

          if (filePath) {
              try {
                  const response = await fetch(filePath);
                  if (!response.ok) {
                      throw new Error(`Failed to fetch file: ${response.statusText}`);
                  }
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", fileNameToDownload);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
              } catch (error: any) {
                  console.error(`Error downloading file ${fileNameToDownload}:`, error);
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                  setImportPopupErrorMessage(`ไม่สามารถดาวน์โหลดไฟล์ ${fileNameToDownload} ได้: ${errorMessage}`);
              }
          }
          await new Promise(resolve => setTimeout(resolve, 500));
      }

      setToggleCleared(true);
      setSelectedRows([]);
      setTimeout(() => setToggleCleared(false), 0);
  };

  const handleEditEvidence = useCallback(
    (evidenceId: string | number) => {
      if (id) {
        navigate(
          `/manage-case/update-case/${id}/update-evidence/${evidenceId}`
        );
      } else {
        setErrorMessage("ไม่พบ ID คดีใน URL เพื่อแก้ไขพยานหลักฐาน");
        setShowError(true);
      }
    },
    [id, navigate]
  );

  const handleDeleteClick = useCallback((evidence: any) => {
    setEvidenceToDelete(evidence);
    setShowDeleteConfirm(true);
    setShowError(false);
    setErrorMessage("");
  }, []);

  const handleConfirmDelete = async () => {
    if (evidenceToDelete) {
      setLoadingEvidence(true);
      try {
        await deleteEvidenceAPI({
          evidenceId: evidenceToDelete.pf_case_Evidence_ID,
        });

        setErrorMessage("ลบพยานหลักฐานสำเร็จ!");
        setShowError(true);
        fetchAllEvidences();
      } catch (error: any) {
        console.error("Error deleting evidence:", error);
        setErrorMessage(error.message || "เกิดข้อผิดพลาดในการลบพยานหลักฐาน");
        setShowError(true);
      } finally {
        setShowDeleteConfirm(false);
        setEvidenceToDelete(null);
        setLoadingEvidence(false);
      }
    } else {
      setErrorMessage("ข้อมูลไม่สมบูรณ์สำหรับการลบพยานหลักฐาน");
      setShowError(true);
      setShowDeleteConfirm(false);
      setEvidenceToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setEvidenceToDelete(null);
  };

  const getEvidenceFileIcon = (type: string | null) => {
    if (!type) return null;
    const iconColor = "#0575E6";
    switch (type) {
      case "รูปภาพ":
        return <FaImage style={{ color: iconColor }} title="รูปภาพ" />;
      case "เอกสาร":
        return <FaFileAlt style={{ color: iconColor }} title="เอกสาร" />;
      case "วีดิโอ":
        return <FaVideo style={{ color: iconColor }} title="วีดิโอ" />;
      case "เสียง":
        return <FaVolumeUp style={{ color: iconColor }} title="เสียง" />;
      default:
        return null;
    }
  };

  const iconColor = "#0575E6";
  const getEvidenceTypeIcon = (type: string | null) => {
    if (!type) return null;

    switch (type) {
      case "Evidence":
        return <FaFileSignature style={{ color: iconColor }} title="หลักฐาน" />;
      case "Person":
        return <FaUser style={{ color: iconColor }} title="พยานบุคคล" />;
      case "Action":
        return <FaHandPaper style={{ color: iconColor }} title="การกระทำ" />;
      case "Location":
        return <FaMapMarkerAlt style={{ color: iconColor }} title="ตำแหน่ง" />;
      default:
        return null;
    }
  };

  const options = [
    {
      label: (
        <div className="flex items-center gap-2">
          <FaFileSignature title="หลักฐาน" style={{ color: iconColor }} />
          <span>หลักฐาน</span>
        </div>
      ),
      value: "Evidence",
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <FaUser title="พยานบุคคล" style={{ color: iconColor }} />
          <span>พยานบุคคล</span>
        </div>
      ),
      value: "Person",
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <FaHandPaper title="การกระทำ" style={{ color: iconColor }} />
          <span>การกระทำ</span>
        </div>
      ),
      value: "Action",
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <FaMapMarkerAlt title="ตำแหน่ง" style={{ color: iconColor }} />
          <span>ตำแหน่ง</span>
        </div>
      ),
      value: "Location",
    },
  ];

  const formatDateTime = (dateTimeString: string | undefined) => {
    if (!dateTimeString) return "-";
    return moment(dateTimeString, "YYYY-MM-DD HH:mm:ss").format(
      "DD/MM/YYYY HH:mm"
    );
  };

  const columns: GenericColumn<any>[] = useMemo(
    () => [
      {
        key: "index",
        label: "ลำดับ",
        width: "80px",
        sortable: true,
        pinnable: false,
        cellValue: (_row: any, index: number) => (currentPage - 1) * perPage + index + 1,
      },
      {
        key: "pf_case_Evidence_Lable",
        label: "ชื่อพยานหลักฐาน",
        width: "200px",
        sortable: true,
        pinnable: true,
        cellValue: (row: any) => {
          const text = row.pf_case_Evidence_Lable || "-";
          const maxLength = 25;
          if (text.length > maxLength) {
            return <span title={text}>{text.substring(0, maxLength)}...</span>;
          }
          return text;
        },
      },
      {
        key: "pf_case_Evidence_Category",
        label: "ประเภทหลักฐาน",
        width: "150px",
        sortable: true,
        pinnable: false,
        cellValue: (row: any) => (
          <div className="flex items-center gap-2">
            {getEvidenceTypeIcon(row.pf_case_Evidence_Category)}
            <span>
              {EVIDENCE_CATEGORY_MAP[row.pf_case_Evidence_Category] ||
                row.pf_case_Evidence_Category ||
                "-"}
            </span>
          </div>
        ),
      },
      {
        key: "file_type",
        label: "ชนิดไฟล์",
        width: "120px",
        sortable: false,
        pinnable: false,
        cellValue: (row: any) => {
          const fileExtension =
            row.pf_case_Evidence_File_Latest?.pf_case_Evidence_Extension;
          let fileType = "-";
          if (fileExtension) {
            const lowerCaseExt = fileExtension.toLowerCase();
            if ([".jpg", ".jpeg", ".png", ".gif"].includes(lowerCaseExt)) {
              fileType = "รูปภาพ";
            } else if ([".mp4", ".avi", ".mov"].includes(lowerCaseExt)) {
              fileType = "วีดีโอ";
            } else if ([".mp3", ".wav"].includes(lowerCaseExt)) {
              fileType = "เสียง";
            } else {
              fileType = "เอกสาร";
            }
          }
          return (
            <div className="flex items-center gap-2">
              {getEvidenceFileIcon(fileType)}
              <span>{fileType}</span>
            </div>
          );
        },
      },
      {
        key: "file_name",
        label: "ชื่อไฟล์",
        width: "200px",
        sortable: true,
        pinnable: false,
        cellValue: (row: any) => {
          const originalFilename = row.pf_case_Evidence_File_Latest?.pf_case_Evidence_Filename || "-";
          const version = row.pf_case_Evidence_File_Latest?.version;
          let extension = row.pf_case_Evidence_File_Latest?.pf_case_Evidence_Extension || "";

          if (originalFilename === "-") {
            return "-";
          }

          extension = extension.startsWith('.') ? extension.substring(1) : extension;

          let namePart = originalFilename;
          
          if (extension) {
            const extRegex = new RegExp(`\\.${extension}$`, 'i');
            namePart = namePart.replace(extRegex, '');
          }

          const maxLength = 15;
          if (namePart.length > maxLength) {
            namePart = namePart.substring(0, maxLength);
            return <span title={originalFilename}>{namePart}...-V{version}.{extension}</span>;
          }

          return <span title={originalFilename}>{namePart}-V{version}.{extension}</span>;
        },
      },
      {
        key: "pf_case_Evidence_Relation_Count",
        label: "ความสัมพันธ์",
        width: "100px",
        sortable: true,
        pinnable: false,
        cellValue: (row: any) => {
          const value = row.pf_case_Evidence_Relation_Count;
          return value === null || value === undefined ? "-" : value;
        },
      },
      {
        key: "pf_case_Evidence_File_Count",
        label: "สืบเนื่อง",
        width: "80px",
        sortable: true,
        pinnable: false,
        cellValue: (row: any) => {
          const value = row.pf_case_Evidence_File_Count;
          return value === null || value === undefined ? "-" : value;
        },
      },
      {
        key: "pf_case_Evidence_Create_Time",
        label: "วันที่สร้าง",
        width: "130px",
        sortable: true,
        pinnable: false,
        cellValue: (row: any) => formatDateTime(row.pf_case_Evidence_Create_Time),
      },
      {
        key: "pf_case_Evidence_Update_Time",
        label: "อัพเดทล่าสุด",
        width: "130px",
        sortable: true,
        pinnable: false,
        cellValue: (row: any) => formatDateTime(row.pf_case_Evidence_Update_Time),
      },
      {
        key: "manage",
        label: "จัดการ",
        width: "150px",
        pinnable: true,
        cellValue: (row: any) => {
          const isLinkDisabled = !(row.pf_case_Evidence_File_Count > 0 && id);
          return (
            <div className="flex gap-2 justify-center">
              <Link
                to={
                  !isLinkDisabled
                    ? `/manage-case/${id}/evidence/${row.pf_case_Evidence_ID}/version-control`
                    : "#"
                }
                className={`p-2 rounded-md border hover:bg-blue-100 ${
                  isLinkDisabled
                    ? "border-custom-disabled-gray text-custom-disabled-gray cursor-not-allowed opacity-50"
                    : "border-blue-600 text-blue-600 cursor-pointer"
                }`}
                title={
                  isLinkDisabled
                    ? "ไม่สามารถเชื่อมโยงหลักฐานได้"
                    : "เชื่อมโยงหลักฐาน"
                }
                onClick={(e) => {
                  if (isLinkDisabled) {
                    e.preventDefault();
                  }
                }}
              >
                <FaNetworkWired size={15} />
              </Link>
              <button
                onClick={() => handleEditEvidence(row.pf_case_Evidence_ID)}
                className="p-2 rounded-md border border-blue-500 text-blue-500 hover:bg-blue-100 cursor-pointer"
                title="แก้ไข"
              >
                {casePermission?.status === "Guest" ? (
                  <MdManageSearch size={15} />
                ) : (
                  <MdEditSquare size={15} />
                )}
              </button>
              {casePermission?.status != "Guest" && (
                <button
                  onClick={() => handleDeleteClick(row)}
                  className="p-2 rounded-md border border-red-500 text-red-500 hover:bg-red-100 cursor-pointer"
                  title="ลบ"
                >
                  <FaTrashAlt size={15} />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [
      id,
      casePermission,
      currentPage,
      perPage,
      handleEditEvidence,
      handleDeleteClick,
      isMobile,
    ]
  );

  return (
    <div className="grid lg:grid-cols-6 lg:bg-menu min-h-screen">
      <div className="hidden lg:block lg:h-full">
        <LeftMenu />
      </div>
      {loadingEvidence && <LoadingOverlay />}
      {showError && (
        <AlertPopup
          message={errorMessage}
          onClose={() => setShowError(false)}
          type={errorMessage.includes("สำเร็จ") ? "success" : "error"}
        />
      )}

      {showDeleteConfirm && evidenceToDelete && (
        <ConfirmPopUp
          header="คุณต้องการลบพยานหลักฐานนี้ใช่หรือไม่?"
          body={`หากต้องการยืนยันการลบพยานหลักฐาน${
            evidenceToDelete.evidence_name || "รายการนี้"
          } กรุณากด 'ตกลง'`}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          buttonCancel="ยกเลิก"
          buttonConfrim="ตกลง"
        />
      )}

      <div className="bg-[#FFFFFF] min-h-screen col-span-5 rounded-s-3xl overflow-y-auto overflow-x-hidden">
        <Header headerText={pageTitle} />
        <div className="container mx-auto lg:p-4">
          <div className="mb-4">
            <div className="w-full sm:mt-3 mb-2 sm:mb-3 md:ps-4 flex flex-wrap justify-between items-center gap-2">
              <div className="hidden sm:block">
                <button
                  onClick={() => navigate(`/manage-case/update-case/${id}/`)}
                  className="cursor-pointer border border-blue-500 text-blue-500 px-4 py-2 rounded-md hover:bg-blue-50 transition text-sm"
                >
                  ย้อนกลับ
                </button>
              </div>
            </div>

            <div className="px-4 flex items-center flex-wrap gap-x-2 text-sm">
              {caseLoading ? (
                <span className="bg-blue-100 text-blue-600 font-medium px-2.5 py-0.5 rounded animate-pulse">
                  กำลังโหลดข้อมูลคดี...
                </span>
              ) : caseDetails ? (
                <>
                  <span className="bg-blue-100 text-blue-600 font-medium px-2.5 py-0.5 rounded">
                    {caseDetails.type || "ไม่ระบุประเภท"}
                  </span>

                  <span className="bg-blue-100 text-blue-600 font-medium px-2.5 py-0.5 rounded">
                    {caseDetails.caseNumber || "ไม่ระบุเลขที่คดี"}
                  </span>

                  <span className="bg-blue-100 text-blue-600 font-medium px-2.5 py-0.5 rounded">
                    {caseDetails.caseName || "ไม่ระบุชื่อคดี"}
                  </span>
                </>
              ) : (
                <span className="bg-gray-100 text-gray-600 font-medium px-2.5 py-0.5 rounded">
                  ไม่พบข้อมูลคดี
                </span>
              )}
            </div>
            <div className="mt-2">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full mx-auto px-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      ประเภท
                    </label>
                    <div className="relative w-full h-8 text-sm">
                      <MultiSelectDropdown
                        options={options}
                        onChange={(values: string[]) => {
                          setEvidenceTypeValue(values);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      ชนิดไฟล์
                    </label>
                    <div className="relative w-full h-8 text-sm">
                      <select
                        value={fileTypeValue}
                        onChange={(e) => {
                          setFileTypeValue(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full h-full px-2 pr-8 border border-gray-300 rounded appearance-none bg-white focus:outline-none"
                      >
                        <option value="">ทั้งหมด</option>
                        <option value="รูปภาพ">รูปภาพ</option>
                        <option value="เอกสาร">เอกสาร</option>
                        <option value="วีดิโอ">วีดิโอ</option>
                        <option value="เสียง">เสียง</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                        <BiChevronDown fontSize={20} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      ช่วงวันที่สร้าง
                    </label>
                    <DateRangePickerOne
                      onSelect={(rangeFromPicker: any) => {
                        const newRange: IDateRange | null = rangeFromPicker
                          ? {
                              startDate:
                                rangeFromPicker.from instanceof Date
                                  ? rangeFromPicker.from
                                  : null,
                              endDate:
                                rangeFromPicker.to instanceof Date
                                  ? rangeFromPicker.to
                                  : null,
                            }
                          : null;
                        setCreatedDateRange(newRange);
                        setCurrentPage(1);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      ช่วงวันที่อัพเดต
                    </label>
                    <DateRangePickerOne
                      onSelect={(rangeFromPicker: any) => {
                        const newRange: IDateRange | null = rangeFromPicker
                          ? {
                              startDate:
                                rangeFromPicker.from instanceof Date
                                  ? rangeFromPicker.from
                                  : null,
                              endDate:
                                rangeFromPicker.to instanceof Date
                                  ? rangeFromPicker.to
                                  : null,
                            }
                          : null;
                        setUpdatedDateRange(newRange);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
                {casePermission?.status != "Guest" && (
                  <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto md:ml-auto md:flex-nowrap items-center">
                    {/* ปุ่มนำเข้า */}
                    <button
                      onClick={handleAddEvidenceClick}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-9 px-4 rounded bg-blue-600 text-sm text-white hover:bg-blue-700 whitespace-nowrap"
                    >
                      <span className="rounded-full bg-white text-blue-800 px-1.5 py-0.5 font-bold text-sm flex items-center justify-center">
                        +
                      </span>
                      <span className="truncate">นำเข้า</span>
                    </button>

                    {/* ปุ่มส่งออก + ปุ่มยกเลิก */}
                    <div className="flex-1 sm:flex-none relative flex items-center h-9 text-sm rounded overflow-hidden shadow-md whitespace-nowrap">
                      <button
                        onClick={handleDownloadCheckedFiles}
                        className="bg-blue-600 hover:bg-blue-700 text-white pl-4 pr-10 flex items-center justify-center gap-2 h-full w-full"
                      >
                        <span className="rounded-full bg-white text-blue-800 px-1.5 py-0.5 font-bold flex items-center justify-center text-sm">
                          ↑
                        </span>
                        <span className="truncate">
                          ส่งออก{" "}
                          {selectedRows.length > 0
                            ? `(${selectedRows.length})`
                            : ""}
                        </span>
                      </button>

                      {selectedRows.length > 0 && (
                        <button
                          onClick={cancelDownloadCheckedFiles}
                          className="absolute right-0 top-0 h-full w-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white border-s"
                          title="ยกเลิกโหมดส่งออก"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 flex flex-col sm:flex-row justify-between items-center w-full">
              <div className="relative w-full sm:w-1/3 min-w-[250px] mb-2 sm:mb-0">
                <style>{`input::placeholder {color: #1039889C; }`}</style>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setCurrentPage(1);
                  }}
                  className="relative w-full"
                >
                  <input
                    type="text"
                    placeholder="ค้นหาพยานหลักฐาน"
                    className="pl-3 pr-8 border focus:outline-none w-full text-sm"
                    style={{
                      height: "35px",
                      borderColor: "#0059C8",
                      borderRadius: "23px",
                      color: "#000",
                    }}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0059C8";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#0059C8";
                    }}
                  />
                  <div
                    className="absolute inset-y-0 right-2 flex items-center text-[#1039889C] cursor-pointer"
                    onClick={() => {
                      setCurrentPage(1);
                    }}
                  >
                    <BiSearchAlt className="h-3 w-3" />
                  </div>
                </form>
              </div>
              <div className="w-full sm:w-fit">
                <Pagination
                  currentPage={currentPage}
                  perPage={perPage}
                  totalRows={totalRows}
                  onChangePage={setCurrentPage}
                  onChangeRowsPerPage={(newPerPage) => {
                    setPerPage(newPerPage);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="px-4 pt-4">
              <div
                className={`w-full mx-auto overflow-x-scroll`}
              >
                <div
                  className="custom-data-table-wrapper"
                >
                  <ResponsiveEvidenceTable
                    columns={columns}
                    data={filteredAndPaginatedEvidence}
                    getRowId={(row) => row.pf_case_Evidence_ID}
                    selectableRows={casePermission?.status !== "Guest"}
                    selectedRowIds={selectedRows.map((row) => row.pf_case_Evidence_ID)}
                    onSelectRow={(id) => {
                        const row = filteredAndPaginatedEvidence.find(d => d.pf_case_Evidence_ID === id);
                        if (row && row.pf_case_Evidence_File_Latest?.pf_case_Evidence_Filename) {
                            const isSelected = selectedRows.some(s => s.pf_case_Evidence_ID === id);
                            if (isSelected) {
                                setSelectedRows(selectedRows.filter(s => s.pf_case_Evidence_ID !== id));
                            } else {
                                setSelectedRows([...selectedRows, row]);
                            }
                        }
                    }}
                    onSelectAll={(checked) => {
                        if (checked) {
                            setSelectedRows(filteredAndPaginatedEvidence.filter(row => row.pf_case_Evidence_File_Latest?.pf_case_Evidence_Filename));
                        } else {
                            setSelectedRows([]);
                        }
                    }}
                    isRowSelectable={(row) => !!row.pf_case_Evidence_File_Latest?.pf_case_Evidence_Filename}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceCasePage;