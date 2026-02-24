import {
  Autocomplete,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaDownload,
  FaFileAlt,
  FaNetworkWired,
  FaSave,
  FaSearch,
  FaTimes,
  FaTrashAlt,
} from "react-icons/fa";
import { MdEditSquare } from "react-icons/md";
import ReactPaginate from "react-paginate";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { fetchCaseIdAPI } from "../../api/caseHandlers";
import evidenceFile from "../../assets/images/ไฟแช็กสีส้ม.jpg";
import AlertPopup from "../../components/common/AlertPopup";
import ConfirmPopUp from "../../components/common/ConfirmPopup";
import Header from "../../components/common/Header";
import LeftMenu from "../../components/common/LeftMenu";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import { EvidenceItem } from "../../components/common/RelatedEvidenceSection";
import EditRelationshipPopup from "../../components/evidence/EditRelationshipPopup";


const getFullLocalizedFileType = (mimeType: string, fileExtension: string) => {
  if (mimeType.startsWith("image/")) {
    return `รูปภาพ/${fileExtension}`;
  } else if (mimeType.startsWith("audio/")) {
    return `เสียง/${fileExtension}`;
  } else if (mimeType.startsWith("video/")) {
    return `วิดีโอ/${fileExtension}`;
  } else if (
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("csv") ||
    mimeType.includes("pdf") ||
    mimeType.includes("text/") ||
    mimeType.includes("application/msword") ||
    mimeType.includes(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) ||
    mimeType.includes("application/vnd.ms-excel") ||
    mimeType.includes(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) ||
    mimeType.includes("application/vnd.ms-powerpoint") ||
    mimeType.includes(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) ||
    mimeType.includes("application/pdf") ||
    mimeType.includes("text/csv")
  ) {
    return `เอกสาร/${fileExtension}`;
  }
  return `ไม่ระบุ/${fileExtension}`;
};

const getInternalBaseFileType = (fullLocalizedType: string) =>
  fullLocalizedType.split("/")[0];
const getDisplayTypeForButton = (internalBaseType: string) => {
  if (internalBaseType === "วิดีโอ") {
    return "วิดีโอ";
  }
  if (internalBaseType === "เอกสาร") {
    return "ไฟล์";
  }
  return internalBaseType;
};

const getMimeTypeFromExtension = (filename: string): string => {
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : "";

  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ogg":
      return "video/ogg";
    case "mp3":
      return "audio/mpeg";
    case "m4a":
      return "audio/mp4";
    case "wav":
      return "audio/wav";
    case "pdf":
      return "application/pdf";
    case "doc":
    case "docx":
      return "application/msword";
    case "xls":
    case "xlsx":
      return "application/vnd.ms-excel";
    case "ppt":
    case "pptx":
      return "application/vnd.ms-powerpoint";
    case "txt":
      return "text/plain";
    case "csv":
      return "text/csv";
    default:
      return "application/octet-stream";
  }
};

// Define a default center for the map
const defaultCenter = {
  lat: 13.645792,
  lng: 100.535217,
};

const evidenceFileName = evidenceFile.split("/").pop() || "unknown_file";
const evidenceFileType = getMimeTypeFromExtension(evidenceFileName);
const fileNameWithoutExtension = evidenceFileName
  .split(".")
  .slice(0, -1)
  .join(".");

const mockDataFile = {
  evidenceFileUrl: evidenceFile,
  evidenceFileType: evidenceFileType,
  evidenceFileName: fileNameWithoutExtension,
  importDate: "20 เมษายน 2568",
  importTime: "08:30 น.",
  importer: "มาริษา เกียร์ตดีงาม",
  type: getFullLocalizedFileType(
    evidenceFileType,
    evidenceFileName.split(".").pop()?.toUpperCase() || ""
  ),
  size: "500 KB",
  discoveryDate: "17 เมษายน 2568",
  discoveryTime: "14:00 น.",
};

const isImage = mockDataFile.evidenceFileType.startsWith("image/");
const isVideo = mockDataFile.evidenceFileType.startsWith("video/");
const isAudio = mockDataFile.evidenceFileType.startsWith("audio/");
const isDocument =
  mockDataFile.evidenceFileType.startsWith("application/") ||
  mockDataFile.evidenceFileType.startsWith("text/");

const EvidenceDetailPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const { id, eid } = useParams();

  const viewPage = id ? "พยานหลักฐาน" : "";

  const evidPage = eid ? "ชื่อพยานหลักฐาน" : "";

  const pageTitle = ["จัดการคดี", "แก้ไขคดี", viewPage, evidPage];

  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [caseLoading, setCaseLoading] = useState(true);

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentEvidenceDetails, setCurrentEvidenceDetails] =
    useState(mockDataFile);
  const [isEditingName, setIsEditingName] = useState(false);
  const [discoveryDate, setDiscoveryDate] = useState("");
  const [discoveryTime, setDiscoveryTime] = useState("");
  const [editedName, setEditedName] = useState("");
  const [description, setDescription] = useState(
    "พบบริเวณใกล้ป้ายหลักฐานหมายเลข 3 สภาพสมบูรณ์ มีรอยไหม้เล็กน้อย บริเวณปาก ไฟแช็ก ตรวจสอบเบื้องต้นพบลายนิ้วมือบางส่วนบนผิวด้านข้างของตัวไฟแช็ก"
  );
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(description);

  const displayDiscoveryDate = discoveryDate || mockDataFile.discoveryDate;
  const displayDiscoveryTime = discoveryTime || mockDataFile.discoveryTime;

  function formatDateToThai(dateStr: string): string {
    if (!dateStr) return "N/A";
    const thaiMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
  
    if (thaiMonths.some(month => dateStr.includes(month))) {
      return dateStr;
    }

    const [year, month, day] = dateStr.split("-");
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
  
    if (isNaN(y) || isNaN(m) || isNaN(d)) return "N/A";
  
    const buddhistYear = y + 543;
    const monthName = thaiMonths[m - 1];
    return `${d} ${monthName} ${buddhistYear}`;
  }
  
  function formatTimeToThai(timeStr: string): string {
    if (!timeStr) return "N/A";
    return `${timeStr}`;
  }

  function parseThaiDateToISO(thaiDate: string): string {
    if (!thaiDate) return "";
  
    const months: Record<string, string> = {
      "มกราคม": "01", "กุมภาพันธ์": "02", "มีนาคม": "03", "เมษายน": "04",
      "พฤษภาคม": "05", "มิถุนายน": "06", "กรกฎาคม": "07", "สิงหาคม": "08",
      "กันยายน": "09", "ตุลาคม": "10", "พฤศจิกายน": "11", "ธันวาคม": "12",
    };
  
    const [dayStr, monthName, yearStr] = thaiDate.split(" ");
    const day = dayStr.padStart(2, "0");
    const month = months[monthName];
    const year = (parseInt(yearStr, 10) - 543).toString();
  
    if (!month || !year) return "";
    return `${year}-${month}-${day}`;
  }

  function parseThaiTimeToISO(timeStr: string): string {
    if (!timeStr) return "";
    return timeStr.replace(" น.", "").trim();
  }

  type ConfirmAction =
  | "add"
  | "delete"
  | "save" 
  | "saveDescription"
  | "saveLocation"
  | "saveAllEvidenceDetails"
  | null;

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const handleOpenConfirm = (action: ConfirmAction, eid?: string) => {
    setConfirmAction(action);
    setEvidenceId(eid || null);
    setShowConfirmPopup(true);
  };

  const handleCancelConfirm = () => {
    setConfirmAction(null);
    setEvidenceId(null);
    setShowConfirmPopup(false);
  };

  const handleConfirm = () => {
    if (!evidenceId) return;
  
    switch (confirmAction) {
      case "delete":
        console.log("ลบพยานหลักฐาน id:", evidenceId);
        setErrorMessage("ลบพยานหลักฐานสำเร็จ!");
        setShowError(true);
        break;
      case "add":
        console.log("บันทึกพยานหลักฐาน id:", evidenceId);
        setErrorMessage("บันทึกพยานหลักฐานสำเร็จ!");
        setShowError(true);
        setIsEditing(false);
        break;
      case "save":
        console.log("บันทึกพยานหลักฐาน id:", evidenceId);
        break;
      case "saveDescription":
        console.log("บันทึกคำอธิบาย id:", evidenceId, "ค่า:", tempDescription);
        setDescription(tempDescription);
        setIsEditingDescription(false);
        setErrorMessage("บันทึกคำอธิบายสำเร็จ!");
        setShowError(true);
        break;
      case "saveLocation":
        console.log("บันทึกสถานที่ id:", evidenceId);
        setLocationDetails(tempLocationDetails);
        setIsEditingLocation(false);
        setErrorMessage("บันทึกสถานที่สำเร็จ!");
        setShowError(true);
        break;
  
      case "saveAllEvidenceDetails":
        console.log("บันทึกข้อมูลพยานหลักฐาน (ชื่อ, วันที่พบ, เวลาที่พบ) id:", evidenceId);
        console.log("ชื่อ:", editedName);
        console.log("วันที่พบ:", discoveryDate);
        console.log("เวลาที่พบ:", discoveryTime);
  
        setCurrentEvidenceDetails((prev) => ({ 
          ...prev,
          evidenceFileName: editedName,
          discoveryDate: discoveryDate,
          discoveryTime: discoveryTime,
        }));
        setIsEditingName(false);
        setErrorMessage("บันทึกการแก้ไขพยานหลักฐานสำเร็จ!");
        setShowError(true);
        break;
  
      default:
        console.warn("Unknown confirm action:", confirmAction);
        break;
    }
  
    setConfirmAction(null);
    setEvidenceId(null);
    setShowConfirmPopup(false);
  };

  const [selectedFilter, setSelectedFilter] = useState<string>("ทั้งหมด");
  const [relationshipSearchTerm, setRelationshipSearchTerm] =
    useState<string>("");
  const [relationshipEvidenceData, setRelationshipEvidenceData] = useState<
    EvidenceItem[]
  >([
    {
      id: "ev001",
      mimeType: "video/mp4",
      fileExtension: "mp4",
      name: "กล้องวงจรปิดหน้าทางเข้าอาคาร A",
      size: "300 MB",
    },
    {
      id: "ev002",
      mimeType: "audio/mpeg",
      fileExtension: "mp3",
      name: "บันทึกเสียงผู้แจ้งเหตุฉุกเฉิน",
      size: "50 MB",
    },
    {
      id: "ev003",
      mimeType: "application/pdf",
      fileExtension: "pdf",
      name: "รายงานการชันสูตรพลิกศพเบื้องต้น",
      size: "15 MB",
    },
    {
      id: "ev004",
      mimeType: "image/jpeg",
      fileExtension: "jpg",
      name: "รูปภาพรอยนิ้วมือบนขวดแก้ว",
      size: "2 MB",
    },
    {
      id: "ev005",
      mimeType: "video/quicktime",
      fileExtension: "mov",
      name: "คลิปวงจรปิดจากแยกไฟแดงที่ 3",
      size: "450 MB",
    },
    {
      id: "ev006",
      mimeType: "audio/wav",
      fileExtension: "wav",
      name: "บทสนทนาจากโทรศัพท์ผู้ต้องสงสัย",
      size: "120 MB",
    },
    {
      id: "ev007",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileExtension: "docx",
      name: "เอกสารรายงานการสอบสวนคดี",
      size: "80 MB",
    },
    {
      id: "ev008",
      mimeType: "text/plain",
      fileExtension: "txt",
      name: "บันทึกปากคำพยานเหตุการณ์",
      size: "1 MB",
    },
    {
      id: "ev009",
      mimeType: "application/vnd.ms-excel",
      fileExtension: "xls",
      name: "ตารางสรุปข้อมูลการใช้จ่าย",
      size: "200 MB",
    },
    {
      id: "ev010",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileExtension: "xlsx",
      name: "ข้อมูลการเงินบริษัท A ประจำปี 2566",
      size: "600 MB",
    },
    {
      id: "ev011",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      fileExtension: "ppt",
      name: "สไลด์นำเสนอข้อสรุปคดีพิเศษ",
      size: "350 MB",
    },
    {
      id: "ev012",
      mimeType: "image/png",
      fileExtension: "png",
      name: "ภาพถ่ายบุคคลในที่เกิดเหตุ",
      size: "5 MB",
    },
    {
      id: "ev013",
      mimeType: "audio/aac",
      fileExtension: "aac",
      name: "เสียงสนทนาที่บันทึกได้จากห้องประชุม",
      size: "75 MB",
    },
    {
      id: "ev014",
      mimeType: "video/x-flv",
      fileExtension: "flv",
      name: "วิดีโอจากโดรนสำรวจพื้นที่",
      size: "700 MB",
    },
    {
      id: "ev015",
      mimeType: "application/rtf",
      fileExtension: "rtf",
      name: "บันทึกการประชุมภายในวันที่ 15 มี.ค.",
      size: "10 MB",
    },
    {
      id: "ev016",
      mimeType: "text/html",
      fileExtension: "html",
      name: "หน้าเว็บประกาศซื้อขายออนไลน์",
      size: "3 MB",
    },
    {
      id: "ev017",
      mimeType: "application/json",
      fileExtension: "json",
      name: "ข้อมูล JSON จากฐานข้อมูล Log",
      size: "25 MB",
    },
    {
      id: "ev018",
      mimeType: "image/gif",
      fileExtension: "gif",
      name: "ภาพเคลื่อนไหวจากกล้องวงจรปิดมุมต่ำ",
      size: "8 MB",
    },
    {
      id: "ev019",
      mimeType: "audio/x-m4a",
      fileExtension: "m4a",
      name: "คลิปเสียงแจ้งเบาะแสจากพยาน",
      size: "60 MB",
    },
    {
      id: "ev020",
      mimeType: "application/octet-stream",
      fileExtension: "bin",
      name: "ไฟล์ข้อมูลดิบจากอุปกรณ์อิเล็กทรอนิกส์",
      size: "900 MB",
    },
    {
      id: "ev021",
      mimeType: "application/pdf",
      fileExtension: "pdf",
      name: "รายงานการตรวจสอบอาคารหลังเกิดเหตุ",
      size: "20 MB",
    },
    {
      id: "ev022",
      mimeType: "application/vnd.ms-powerpoint",
      fileExtension: "ppt",
      name: "แผนผังการก่อสร้างอาคาร B",
      size: "180 MB",
    },
    {
      id: "ev023",
      mimeType: "application/msword",
      fileExtension: "doc",
      name: "บันทึกประจำวันของเจ้าหน้าที่",
      size: "30 MB",
    },
    {
      id: "ev024",
      mimeType: "text/csv",
      fileExtension: "csv",
      name: "ข้อมูลพิกัด GPS ผู้ต้องสงสัย",
      size: "500 MB",
    },
    {
      id: "ev025",
      mimeType: "application/zip",
      fileExtension: "zip",
      name: "ไฟล์บีบอัดข้อมูลธุรกรรม",
      size: "700 MB",
    },
    {
      id: "ev026",
      mimeType: "application/x-rar-compressed",
      fileExtension: "rar",
      name: "หลักฐานการติดต่อสื่อสารแบบเข้ารหัส",
      size: "950 MB",
    },
    {
      id: "ev027",
      mimeType: "application/xml",
      fileExtension: "xml",
      name: "ไฟล์ตั้งค่าระบบเครือข่าย",
      size: "5 MB",
    },
    {
      id: "ev028",
      mimeType: "text/html",
      fileExtension: "html",
      name: "อีเมลที่ถูกลบแต่กู้คืนได้",
      size: "10 MB",
    },
    {
      id: "ev029",
      mimeType: "application/pdf",
      fileExtension: "pdf",
      name: "ใบแจ้งหนี้ค่าใช้จ่ายบริษัท",
      size: "8 MB",
    },
    {
      id: "ev030",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileExtension: "xlsx",
      name: "ข้อมูลการเดินทางผู้ต้องสงสัย",
      size: "400 MB",
    },
    {
      id: "ev031",
      mimeType: "image/tiff",
      fileExtension: "tif",
      name: "ภาพถ่ายทางอากาศบริเวณที่เกิดเหตุ",
      size: "25 MB",
    },
    {
      id: "ev032",
      mimeType: "image/bmp",
      fileExtension: "bmp",
      name: "ภาพจากกล้องหน้ารถยนต์คันก่อเหตุ",
      size: "18 MB",
    },
    {
      id: "ev033",
      mimeType: "image/webp",
      fileExtension: "webp",
      name: "ภาพหลักฐานจากโซเชียลมีเดีย",
      size: "7 MB",
    },
    {
      id: "ev034",
      mimeType: "image/svg+xml",
      fileExtension: "svg",
      name: "แผนภาพวงจรไฟฟ้าที่ดัดแปลง",
      size: "1 MB",
    },
    {
      id: "ev035",
      mimeType: "image/jpeg",
      fileExtension: "jpeg",
      name: "รูปภาพลายนิ้วมือชุดที่ 2",
      size: "3 MB",
    },
    {
      id: "ev036",
      mimeType: "image/png",
      fileExtension: "png",
      name: "ภาพกราฟฟิกการจำลองเหตุการณ์",
      size: "10 MB",
    },
    {
      id: "ev037",
      mimeType: "image/jpeg",
      fileExtension: "jpg",
      name: "ภาพถ่ายจากกล้องวงจรปิดจุด B",
      size: "6 MB",
    },
    {
      id: "ev038",
      mimeType: "image/jpeg",
      fileExtension: "jpg",
      name: "ภาพถ่ายรอยเท้าที่พบในที่เกิดเหตุ",
      size: "4 MB",
    },
    {
      id: "ev039",
      mimeType: "image/png",
      fileExtension: "png",
      name: "ภาพถ่ายร่องรอยการต่อสู้",
      size: "9 MB",
    },
    {
      id: "ev040",
      mimeType: "image/gif",
      fileExtension: "gif",
      name: "ภาพเคลื่อนไหวแสดงการเข้าออกอาคาร",
      size: "12 MB",
    },
    {
      id: "ev041",
      mimeType: "video/x-msvideo",
      fileExtension: "avi",
      name: "คลิปบันทึกเหตุการณ์จากพยาน",
      size: "800 MB",
    },
    {
      id: "ev042",
      mimeType: "video/webm",
      fileExtension: "webm",
      name: "วิดีโอจากกล้องติดตัวเจ้าหน้าที่",
      size: "550 MB",
    },
    {
      id: "ev043",
      mimeType: "video/mp4",
      fileExtension: "mp4",
      name: "คลิปวิดีโอจาก CCTV ทางเข้าออกหมู่บ้าน",
      size: "750 MB",
    },
    {
      id: "ev044",
      mimeType: "video/mp4",
      fileExtension: "mp4",
      name: "วิดีโอสัมภาษณ์ผู้เห็นเหตุการณ์",
      size: "200 MB",
    },
    {
      id: "ev045",
      mimeType: "video/quicktime",
      fileExtension: "mov",
      name: "คลิปวิดีโอจากกล้องวงจรปิดร้านสะดวกซื้อ",
      size: "650 MB",
    },
    {
      id: "ev046",
      mimeType: "video/x-flv",
      fileExtension: "flv",
      name: "วิดีโอจากกล้องหน้ารถผู้เสียหาย",
      size: "850 MB",
    },
    {
      id: "ev047",
      mimeType: "video/mp4",
      fileExtension: "mp4",
      name: "คลิปเหตุการณ์บนถนนสุขุมวิทซอย 10",
      size: "500 MB",
    },
    {
      id: "ev048",
      mimeType: "video/mp4",
      fileExtension: "mp4",
      name: "วิดีโอการตรวจสอบสถานที่เกิดเหตุ",
      size: "300 MB",
    },
    {
      id: "ev049",
      mimeType: "video/webm",
      fileExtension: "webm",
      name: "คลิปบันทึกการส่งมอบสิ่งของ",
      size: "400 MB",
    },
    {
      id: "ev050",
      mimeType: "video/mp4",
      fileExtension: "mp4",
      name: "วิดีโอจากกล้องวงจรปิดบนรถไฟฟ้า",
      size: "700 MB",
    },
    {
      id: "ev051",
      mimeType: "audio/ogg",
      fileExtension: "ogg",
      name: "บันทึกเสียงจากห้องสอบสวน",
      size: "90 MB",
    },
    {
      id: "ev052",
      mimeType: "audio/flac",
      fileExtension: "flac",
      name: "คลิปเสียงการสนทนาต้องสงสัย",
      size: "150 MB",
    },
    {
      id: "ev053",
      mimeType: "audio/midi",
      fileExtension: "mid",
      name: "เสียงเรียกเข้าโทรศัพท์ผู้ก่อเหตุ",
      size: "0.1 MB",
    },
    {
      id: "ev054",
      mimeType: "audio/x-aiff",
      fileExtension: "aiff",
      name: "ไฟล์เสียงจากระบบดักฟัง",
      size: "250 MB",
    },
    {
      id: "ev055",
      mimeType: "audio/mpeg",
      fileExtension: "mp3",
      name: "บันทึกเสียงแจ้งเหตุทางวิทยุสื่อสาร",
      size: "40 MB",
    },
    {
      id: "ev056",
      mimeType: "audio/wav",
      fileExtension: "wav",
      name: "เสียงปืนที่บันทึกได้จากกล้อง",
      size: "180 MB",
    },
    {
      id: "ev057",
      mimeType: "audio/aac",
      fileExtension: "aac",
      name: "คลิปเสียงการเจรจา",
      size: "85 MB",
    },
    {
      id: "ev058",
      mimeType: "audio/ogg",
      fileExtension: "ogg",
      name: "บันทึกเสียงผู้ต้องหาให้การ",
      size: "100 MB",
    },
    {
      id: "ev059",
      mimeType: "audio/mpeg",
      fileExtension: "mp3",
      name: "เสียงสัญญาณเตือนภัย",
      size: "20 MB",
    },
    {
      id: "ev060",
      mimeType: "audio/wav",
      fileExtension: "wav",
      name: "คลิปเสียงจากกล่องดำเครื่องบิน",
      size: "980 MB",
    },
    {
      id: "ev061",
      mimeType: "application/pdf",
      fileExtension: "pdf",
      name: "ใบรับรองแพทย์ผู้บาดเจ็บ",
      size: "7 MB",
    },
    {
      id: "ev062",
      mimeType: "image/jpeg",
      fileExtension: "jpg",
      name: "ภาพถ่ายความเสียหายของรถ",
      size: "10 MB",
    },
    {
      id: "ev063",
      mimeType: "video/mp4",
      fileExtension: "mp4",
      name: "วิดีโอจากกล้องวงจรปิดลานจอดรถ",
      size: "600 MB",
    },
    {
      id: "ev064",
      mimeType: "audio/mpeg",
      fileExtension: "mp3",
      name: "เสียงสนทนาในห้องพักผู้ต้องสงสัย",
      size: "45 MB",
    },
    {
      id: "ev065",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileExtension: "docx",
      name: "เอกสารแผนผังอาชญากรรม",
      size: "120 MB",
    },
    {
      id: "ev066",
      mimeType: "text/plain",
      fileExtension: "txt",
      name: "บันทึกแชทจากแอปพลิเคชัน",
      size: "2 MB",
    },
    {
      id: "ev067",
      mimeType: "image/png",
      fileExtension: "png",
      name: "ภาพถ่ายแผนที่เส้นทางหลบหนี",
      size: "15 MB",
    },
    {
      id: "ev068",
      mimeType: "video/quicktime",
      fileExtension: "mov",
      name: "คลิปจากกล้องโทรศัพท์มือถือ",
      size: "550 MB",
    },
    {
      id: "ev069",
      mimeType: "audio/wav",
      fileExtension: "wav",
      name: "เสียงจากเครื่องอัดเสียงพกพา",
      size: "220 MB",
    },
    {
      id: "ev070",
      mimeType: "application/pdf",
      fileExtension: "pdf",
      name: "รายงานการตรวจพิสูจน์หลักฐานทางนิติวิทยา",
      size: "30 MB",
    },

    {
      id: "ev071",
      mimeType: "image/jpeg",
      fileExtension: "jpg",
      name: "รูปภาพสภาพภายในบ้านพัก",
      size: "8 MB",
    },
    {
      id: "ev072",
      mimeType: "video/mp4",
      fileExtension: "mp4",
      name: "วิดีโอการเข้าตรวจค้นสถานที่",
      size: "700 MB",
    },
    {
      id: "ev073",
      mimeType: "audio/mpeg",
      fileExtension: "mp3",
      name: "เสียงจากเครื่องดักฟัง",
      size: "65 MB",
    },
    {
      id: "ev074",
      mimeType: "application/vnd.ms-excel",
      fileExtension: "xls",
      name: "บันทึกการโทรเข้าออกโทรศัพท์",
      size: "300 MB",
    },
    {
      id: "ev075",
      mimeType: "text/html",
      fileExtension: "html",
      name: "ประวัติการเข้าชมเว็บไซต์",
      size: "4 MB",
    },
    {
      id: "ev076",
      mimeType: "image/png",
      fileExtension: "png",
      name: "ภาพถ่ายบาดแผลผู้เสียหาย",
      size: "11 MB",
    },
    {
      id: "ev077",
      mimeType: "video/x-flv",
      fileExtension: "flv",
      name: "คลิปเหตุการณ์ริมถนน",
      size: "800 MB",
    },
    {
      id: "ev078",
      mimeType: "audio/aac",
      fileExtension: "aac",
      name: "เสียงคำให้การเพิ่มเติม",
      size: "55 MB",
    },
    {
      id: "ev079",
      mimeType: "application/pdf",
      fileExtension: "pdf",
      name: "รายงานการวิเคราะห์ดินและพืช",
      size: "22 MB",
    },
    {
      id: "ev080",
      mimeType: "image/jpeg",
      fileExtension: "jpg",
      name: "ภาพถ่ายอาวุธที่ใช้ก่อเหตุ",
      size: "6 MB",
    },

    {
      id: "ev081",
      mimeType: "video/mp4",
      fileExtension: "mp4",
      name: "วิดีโอจากกล้องติดรถยนต์คันอื่น",
      size: "900 MB",
    },
    {
      id: "ev082",
      mimeType: "audio/wav",
      fileExtension: "wav",
      name: "เสียงจากห้องอัดเสียง",
      size: "190 MB",
    },
    {
      id: "ev083",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileExtension: "docx",
      name: "บันทึกการสอบปากคำผู้ต้องสงสัย",
      size: "70 MB",
    },
    {
      id: "ev084",
      mimeType: "text/plain",
      fileExtension: "txt",
      name: "ข้อความ SMS ที่บันทึกได้",
      size: "0.5 MB",
    },
    {
      id: "ev085",
      mimeType: "image/gif",
      fileExtension: "gif",
      name: "ภาพเคลื่อนไหวการเคลื่อนไหวของบุคคล",
      size: "10 MB",
    },
    {
      id: "ev086",
      mimeType: "video/webm",
      fileExtension: "webm",
      name: "วิดีโอการจำลองเหตุการณ์เพิ่มเติม",
      size: "620 MB",
    },
    {
      id: "ev087",
      mimeType: "audio/ogg",
      fileExtension: "ogg",
      name: "เสียงจากเครื่องบันทึกเสียงดิจิทัล",
      size: "110 MB",
    },
    {
      id: "ev088",
      mimeType: "application/zip",
      fileExtension: "zip",
      name: "ไฟล์หลักฐานจากการตรวจค้นคอมพิวเตอร์",
      size: "990 MB",
    },
    {
      id: "ev089",
      mimeType: "image/tiff",
      fileExtension: "tif",
      name: "ภาพถ่ายจากกล้องจุลทรรศน์",
      size: "14 MB",
    },
    {
      id: "ev090",
      mimeType: "video/mp4",
      fileExtension: "mp4",
      name: "คลิปบันทึกเหตุการณ์ก่อนหน้า",
      size: "780 MB",
    },

    {
      id: "ev091",
      mimeType: "audio/flac",
      fileExtension: "flac",
      name: "เสียงบันทึกจากเครื่องดักฟังแบบละเอียด",
      size: "280 MB",
    },
    {
      id: "ev092",
      mimeType: "application/pdf",
      fileExtension: "pdf",
      name: "ใบรับรองผลการตรวจสารเสพติด",
      size: "9 MB",
    },
    {
      id: "ev093",
      mimeType: "image/jpeg",
      fileExtension: "jpg",
      name: "ภาพถ่ายมุมสูงจากเฮลิคอปเตอร์",
      size: "16 MB",
    },
    {
      id: "ev094",
      mimeType: "video/mp4",
      fileExtension: "mp4",
      name: "วิดีโอจากกล้องภายในอาคารพาณิชย์",
      size: "680 MB",
    },
    {
      id: "ev095",
      mimeType: "audio/mpeg",
      fileExtension: "mp3",
      name: "เสียงสนทนาทางไกล",
      size: "35 MB",
    },
    {
      id: "ev096",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileExtension: "xlsx",
      name: "บันทึกการเข้าออกสถานที่",
      size: "480 MB",
    },
    {
      id: "ev097",
      mimeType: "text/html",
      fileExtension: "html",
      name: "ข้อมูลจากอีเมลขยะ",
      size: "2 MB",
    },
    {
      id: "ev098",
      mimeType: "image/png",
      fileExtension: "png",
      name: "ภาพถ่ายของบุคคลที่ไม่ระบุตัวตน",
      size: "13 MB",
    },
    {
      id: "ev099",
      mimeType: "video/quicktime",
      fileExtension: "mov",
      name: "คลิปการขนย้ายวัตถุต้องสงสัย",
      size: "720 MB",
    },
    {
      id: "ev100",
      mimeType: "application/json",
      fileExtension: "json",
      name: "บันทึกการเข้าใช้งานระบบ",
      size: "40 MB",
    },
  ]);

  const [currentPage, setCurrentPage] = useState<number>(0);
  const itemsPerPage: number = 10;

  const [isEditRelationshipPopupOpen, setIsEditRelationshipPopupOpen] =
    useState(false);
  const [currentLinkedEvidence, setCurrentLinkedEvidence] = useState<
    EvidenceItem[]
  >([]);
  const [evidenceToEditRelationship, setEvidenceToEditRelationship] =
    useState<EvidenceItem | null>(null);

  const handleOpenEditRelationshipPopup = () => {
    setIsEditRelationshipPopupOpen(true);
  };

  const handleCloseEditRelationshipPopup = () => {
    setIsEditRelationshipPopupOpen(false);
  };

  const handleAddSelectedEvidence = (selectedItems: EvidenceItem[]) => {
    console.log("รายการพยานหลักฐานที่ถูกเลือกจาก Popup:", selectedItems);
    setCurrentLinkedEvidence((prevItems) => {
      const existingIds = new Set(prevItems.map((item) => item.id));
      const newItemsToAdd = selectedItems.filter(
        (item) => !existingIds.has(item.id)
      );
      return [...prevItems, ...newItemsToAdd];
    });
  };

  const [isEditing, setIsEditing] = useState(false);
  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const filteredAndSearchedRelationshipEvidence = useMemo(() => {
    let filtered = relationshipEvidenceData;
    if (selectedFilter !== "ทั้งหมด") {
      filtered = filtered.filter((item) => {
        const fullType = getFullLocalizedFileType(
          item.mimeType,
          item.fileExtension
        );
        const internalBaseType = getInternalBaseFileType(fullType);
        if (selectedFilter === "ไฟล์") {
          return internalBaseType === "เอกสาร";
        }
        return internalBaseType === selectedFilter;
      });
    }

    if (relationshipSearchTerm) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(relationshipSearchTerm.toLowerCase())
      );
    }

    setCurrentPage(0);
    return filtered;
  }, [relationshipEvidenceData, selectedFilter, relationshipSearchTerm]);

  const pageCount: number = Math.ceil(
    filteredAndSearchedRelationshipEvidence.length / itemsPerPage
  );
  const currentItems: EvidenceItem[] = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSearchedRelationshipEvidence.slice(startIndex, endIndex);
  }, [filteredAndSearchedRelationshipEvidence, currentPage, itemsPerPage]);

  const handlePageClick = (data: { selected: number }) => {
    setCurrentPage(data.selected);
  };

  useEffect(() => {
    if (!isEditingName) {
      setEditedName(
        decodeURIComponent(currentEvidenceDetails.evidenceFileName)
      );
    }
  }, [isEditingName, currentEvidenceDetails.evidenceFileName]);

  const handleEditEvidenceName = () => {
    setIsEditingName(true);
    setEditedName(decodeURIComponent(currentEvidenceDetails.evidenceFileName));
  };

  const googleMapsApiKey = import.meta.env.VITE_Maps_API_KEY || "";

  const libraries: ("places" | "drawing" | "geometry" | "visualization")[] =
    useMemo(() => ["places"], []);
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: googleMapsApiKey,
    libraries: libraries,
    language: "th",
    region: "TH",
  });
  

const isValidCoordinates = useCallback((lat: number, lng: number) => {
  const valid =
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;
  console.log(
    `Checking validity for lat: ${lat}, lng: ${lng} -> Result: ${valid}`
  );
  return valid;
}, []);


  const [locationDetails, setLocationDetails] = useState({
    foundLocation: "ดอนเมือง",
    latitude: 13.926717,
    longitude: 100.585879,
    additionalDetails: "ที่จอดรถ อาคาร A",
  });

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempLocationDetails, setTempLocationDetails] =
    useState(locationDetails);

  // Map states
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const mapContainerStyle = {
    width: "100%",
    height: "300px",
    borderRadius: "8px",
    overflow: "hidden",
  };

  const currentMapCenter = useMemo(() => {
    let center = defaultCenter;
    if (
      isEditingLocation &&
      isValidCoordinates(
        tempLocationDetails.latitude,
        tempLocationDetails.longitude
      )
    ) {
      center = {
        lat: tempLocationDetails.latitude,
        lng: tempLocationDetails.longitude,
      };
    } else if (
      !isEditingLocation &&
      isValidCoordinates(locationDetails.latitude, locationDetails.longitude)
    ) {
      center = {
        lat: locationDetails.latitude,
        lng: locationDetails.longitude,
      };
    }
    console.log("currentMapCenter (computed):", center);
    return center;
  }, [
    locationDetails,
    tempLocationDetails,
    isEditingLocation,
    isValidCoordinates,
  ]);

  const onLoadMap = useCallback(
    function callback(map: google.maps.Map) {
      mapRef.current = map;
      console.log("Map loaded. Initial center set to:", currentMapCenter);

      if (isValidCoordinates(currentMapCenter.lat, currentMapCenter.lng)) {
        map.setZoom(15);
        map.panTo(currentMapCenter);
      } else {
        map.setZoom(10);
        map.panTo(defaultCenter);
      }
    },
    [currentMapCenter, isValidCoordinates]
  );

  const onUnmountMap = useCallback(function callback() {
    if (mapRef.current) {
      mapRef.current = null;
      console.log("Map unmounted.");
    }
  }, []);

  const onLoadAutocomplete = useCallback(function callback(
    autocomplete: google.maps.places.Autocomplete
  ) {
    autocompleteRef.current = autocomplete;
  },
  []);

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      console.log("Autocomplete place selected:", place);

      if (place.geometry?.location) {
        const newLat = place.geometry.location.lat();
        const newLng = place.geometry.location.lng();
        const newAddress = place.formatted_address || place.name || "";

        setTempLocationDetails((prev) => ({
          ...prev,
          foundLocation: newAddress,
          latitude: newLat,
          longitude: newLng,
        }));

        if (mapRef.current) {
          mapRef.current.panTo({ lat: newLat, lng: newLng });
          mapRef.current.setZoom(15);
        }
      } else {
        console.log("Place has no geometry or location.");
        setTempLocationDetails((prev) => ({
          ...prev,
          latitude: 0,
          longitude: 0,
        }));
      }
    }
  }, []);

  const onMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (isEditingLocation && event.latLng) {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();

        console.log("Map clicked at:", { lat: newLat, lng: newLng });
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: newLat, lng: newLng } },
          (results, status) => {
            if (status === "OK" && results && results[0]) {
              const foundAddress = results[0].formatted_address;
              setTempLocationDetails((prev) => ({
                ...prev,
                foundLocation: foundAddress,
                latitude: newLat,
                longitude: newLng,
              }));
            } else {
              console.warn("Geocoder failed due to: " + status);
              setTempLocationDetails((prev) => ({
                ...prev,
                foundLocation: `Lat: ${newLat.toFixed(
                  6
                )}, Lng: ${newLng.toFixed(6)}`,
                latitude: newLat,
                longitude: newLng,
              }));
            }
          }
        );
        console.log("tempLocationDetails after map click:", {
          lat: newLat,
          lng: newLng,
        });
      }
    },
    [isEditingLocation]
  );

  useEffect(() => {
    if (id) {
      setCaseLoading(true);
      fetchCaseIdAPI({ caseId: id })
        .then((result: any) => {
          setCaseDetails(result);
        })
        .catch((message: string) => {
          setErrorMessage(message);
          setShowError(true);
          setCaseDetails(null);
        })
        .finally(() => {
          setCaseLoading(false);
        });
    } else {
      setCaseDetails(null);
      setCaseLoading(false);
      setErrorMessage("ไม่พบ ID คดีใน URL");
      setShowError(true);
    }
  }, [id]);

  useEffect(() => {
    setEditedName(mockDataFile.evidenceFileName);
  }, [mockDataFile.evidenceFileName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSaveName = () => {
    console.log("Saving new name:", editedName);
    setCurrentEvidenceDetails((prev) => ({
      ...prev,
      evidenceFileName: editedName,
    }));
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(currentEvidenceDetails.evidenceFileName);
    setIsEditingName(false);
  };
  const handleEditDescription = () => {
    setIsEditingDescription(true);
    setTempDescription(description);
  };

  const handleSaveDescription = () => {
    console.log("Saving new description:", tempDescription);
    setDescription(tempDescription);
    setIsEditingDescription(false);
  };

  const handleCancelDescriptionEdit = () => {
    setTempDescription(description);
    setIsEditingDescription(false);
  };

  const handleEditLocationDetails = () => {
    setIsEditingLocation(true);
    setTempLocationDetails(locationDetails);
    if (
      mapRef.current &&
      isValidCoordinates(locationDetails.latitude, locationDetails.longitude)
    ) {
      mapRef.current.panTo({
        lat: locationDetails.latitude,
        lng: locationDetails.longitude,
      });
      mapRef.current.setZoom(15);
    }
  };

  const handleSaveLocationDetails = () => {
    console.log("Saving new location details:", tempLocationDetails);
    setLocationDetails(tempLocationDetails);
    setIsEditingLocation(false);
  };

  const handleCancelLocationDetailsEdit = () => {
    setTempLocationDetails(locationDetails);
    setIsEditingLocation(false);
    if (
      mapRef.current &&
      isValidCoordinates(locationDetails.latitude, locationDetails.longitude)
    ) {
      mapRef.current.panTo({
        lat: locationDetails.latitude,
        lng: locationDetails.longitude,
      });
      mapRef.current.setZoom(15);
    } else if (mapRef.current) {
      mapRef.current.panTo(defaultCenter);
      mapRef.current.setZoom(10);
    }
  };

  const handleDelete = async (idToDelete: string) => {
    console.log(`กำลังลบรายการ ID: ${idToDelete}`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setRelationshipEvidenceData((prevList) =>
        prevList.filter((item) => item.id !== idToDelete)
      );

      console.log(`ลบรายการ ID: ${idToDelete} สำเร็จ`);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการลบรายการ:", error);
    }
  };

  return (
    <div className="grid lg:grid-cols-6 lg:bg-menu min-h-screen">
      {/* เมนูด้านซ้าย */}
      <div className="hidden lg:block lg:h-full">
        <LeftMenu />
      </div>
      {/* พื้นที่เนื้อหาหลัก */}
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
        <div className="container mx-auto p-4">
          <div className="grid grid-flow-col grid-rows-2 items-center w-full p-4">
            <div className="row-span-2 flex justify-start">
              <button
                onClick={() => navigate(-1)}
                className="cursor-pointer border border-blue-500 text-blue-500 px-4 py-2 rounded-md hover:bg-blue-50 transition"
              >
                ย้อนกลับ
              </button>
            </div>

            <div className="row-span-2 flex justify-end">
              <button
                onClick={() => eid && handleOpenConfirm("delete", eid)}
                className="cursor-pointer border border-[#FF5353] text-[#FF5353] px-4 py-2 rounded-md hover:bg-[#FF5353]/10 transition flex items-center"
              >
                <FaTrashAlt className="mr-2" />
                ลบพยานหลักฐาน
              </button>
            </div>

            {showConfirmPopup && (
              <ConfirmPopUp
                header={
                  confirmAction === "delete"
                    ? "คุณต้องการลบพยานหลักฐานนี้ใช่หรือไม่?"
                    : confirmAction === "add"
                    ? "คุณต้องการเพิ่มพยานหลักฐานใช่หรือไม่?"
                    : confirmAction === "save" || confirmAction === "saveAllEvidenceDetails"
                    ? "คุณต้องการบันทึกการแก้ไขพยานหลักฐานใช่หรือไม่?"
                    : confirmAction === "saveDescription"
                    ? "คุณต้องการบันทึกการแก้ไขคำอธิบายพยานหลักฐานใช่หรือไม่?"
                    : confirmAction === "saveLocation"
                    ? "คุณต้องการบันทึกการแก้ไขสถานที่พบพยานหลักฐานใช่หรือไม่?"
                    : ""
                }
                body={`หากต้องการยืนยันการ${
                  confirmAction === "delete"
                    ? "ลบ"
                    : confirmAction === "add"
                    ? "เพิ่ม"
                    : confirmAction === "save" || confirmAction === "saveAllEvidenceDetails"
                    ? "บันทึก"
                    : ""
                }พยานหลักฐาน "${evidenceId}" กรุณากด 'ตกลง'`}
                onCancel={handleCancelConfirm}
                onConfirm={handleConfirm}
                buttonCancel="ยกเลิก"
                buttonConfrim="ตกลง"
              />
            )}
          </div>

          <div className="px-4 pb-2">
            <div className="bg-[#F4F4F4] p-6 rounded-lg w-full">
              <div className="px-4 pb-2 flex items-center flex-wrap gap-x-2 text-sm -mx-4 -mt-2">
                <h1 className="text-xl font-semibold text-gray-800 mr-2">
                  พยานหลักฐานคดี
                </h1>
                {caseLoading ? (
                  <span className="bg-blue-100 text-blue-600 font-medium px-2.5 py-0.5 rounded animate-pulse">
                    กำลังโหลดข้อมูลคดี...
                  </span>
                ) : caseDetails ? (
                  <span className="bg-blue-100 text-blue-600 font-medium px-2.5 py-0.5 rounded">
                    {caseDetails.pf_case_Title || "ไม่ระบุชื่อคดี"}
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 font-medium px-2.5 py-0.5 rounded">
                    ไม่พบข้อมูลคดี
                  </span>
                )}

                <span className="text-blue-500 hover:underline cursor-pointer">
                  สร้างวันที่
                </span>

                {caseLoading ? (
                  <span className="text-gray-500 animate-pulse">
                    กำลังโหลด...
                  </span>
                ) : caseDetails && caseDetails.pf_case_Create_Time ? (
                  <span className="text-gray-500">
                    {new Date(
                      caseDetails.pf_case_Create_Time
                    ).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    •{" "}
                    {new Date(
                      caseDetails.pf_case_Create_Time
                    ).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    น.
                  </span>
                ) : (
                  <span className="text-gray-500">ไม่พบข้อมูล</span>
                )}

                <span className="text-gray-300">|</span>
                <span className="text-blue-500 hover:underline cursor-pointer">
                  อัปเดตล่าสุด
                </span>

                {caseLoading ? (
                  <span className="text-gray-500 animate-pulse">
                    กำลังโหลด...
                  </span>
                ) : caseDetails && caseDetails.pf_case_Update_Time ? (
                  <span className="text-gray-500">
                    {new Date(
                      caseDetails.pf_case_Update_Time
                    ).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    •{" "}
                    {new Date(
                      caseDetails.pf_case_Update_Time
                    ).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    น.
                  </span>
                ) : (
                  <span className="text-gray-500">ไม่พบข้อมูล</span>
                )}
              </div>
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                <div className="lg:col-span-3 flex flex-col space-y-4">
                  <div className="px-3 py-4 rounded-[10px] bg-white flex flex-col items-center overflow-hidden">
                    <div className="w-full h-[400px] flex items-center justify-center overflow-hidden border border-gray-300 rounded-md bg-gray-50 mb-4">
                      {mockDataFile.evidenceFileUrl &&
                      (isImage || isVideo || isAudio || isDocument) ? (
                        <>
                          {isImage && (
                            <TransformWrapper
                              initialScale={1}
                              minScale={0.1}
                              maxScale={5}
                              limitToBounds={true}
                              panning={{ disabled: false }}
                              doubleClick={{ disabled: true }}
                              wheel={{ disabled: false }}
                            >
                              <TransformComponent
                                wrapperStyle={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                contentStyle={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <img
                                  src={mockDataFile.evidenceFileUrl}
                                  alt={
                                    mockDataFile.evidenceFileName ||
                                    "รูปภาพพยานหลักฐาน"
                                  }
                                  className="w-full h-full object-contain"
                                />
                              </TransformComponent>
                            </TransformWrapper>
                          )}
                          {isVideo && (
                            <div className="w-full h-full flex items-center justify-center">
                              <video
                                src={mockDataFile.evidenceFileUrl}
                                controls
                                className="w-full h-full object-contain"
                              >
                                <p>เบราว์เซอร์ของคุณไม่รองรับการแสดงวิดีโอ</p>
                              </video>
                            </div>
                          )}
                          {(isAudio || isDocument) && (
                            <div className="flex flex-col items-center justify-center text-center p-4">
                              {isAudio && (
                                <div className="flex flex-col items-center">
                                  <span className="text-8xl text-gray-400 mb-4">
                                    🔊
                                  </span>
                                  <audio
                                    controls
                                    src={mockDataFile.evidenceFileUrl}
                                    className="w-full max-w-2xl h-24"
                                  >
                                    เบราว์เซอร์ของคุณไม่รองรับการเล่นไฟล์เสียง
                                  </audio>
                                </div>
                              )}
                              {isDocument && (
                                <div className="flex flex-col items-center">
                                  <FaFileAlt
                                    className="text-blue-500 pb-4"
                                    size={120}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          {mockDataFile.evidenceFileUrl ? (
                            <p className="text-gray-500 text-sm">
                              ไม่รองรับประเภทไฟล์:{" "}
                              {mockDataFile.evidenceFileType || "ไม่ทราบประเภท"}
                              <br />({mockDataFile.evidenceFileName})
                            </p>
                          ) : (
                            <p className="text-gray-500 text-sm">
                              ไม่มีไฟล์ให้แสดง
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="w-full flex justify-between items-center space-x-4">
                      <Link to={`/manage-case/${id}/evidence/${eid}/version-control`}>
                        <button className="flex items-center justify-center px-3 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-200 text-sm md:text-xs">
                          <FaNetworkWired className="mr-2 text-sm" />
                          การเปลี่ยนแปลงพยานหลักฐาน
                        </button>
                      </Link>
                      <button
                        className="flex items-center justify-center px-3 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-200 text-sm md:text-xs"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = mockDataFile.evidenceFileUrl;
                          link.setAttribute(
                            "download",
                            decodeURIComponent(mockDataFile.evidenceFileName)
                          );
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        }}
                      >
                        <FaDownload className="mr-2 text-sm" />
                        ดาวน์โหลด
                      </button>
                    </div>
                  </div>

                  {/* ส่วนพยานหลักฐานที่เกี่ยวข้อง */}
                  <div className="w-full p-6 rounded-lg bg-white shadow-md">
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-sm font-semibold text-white bg-[#223C79] rounded-lg px-3 py-1">
                        ความสัมพันธ์
                      </h2>

                      <div className="flex gap-2">
                        {!isEditing && (
                          <button
                            className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                            aria-label="แก้ไขความสัมพันธ์"
                            onClick={() => setIsEditing(true)}
                          >
                            <MdEditSquare className="text-xl" />
                          </button>
                        )}

                        {isEditing && (
                          <>
                            <button
                              className="inline-flex items-center justify-center gap-x-1.5 w-[88px] px-3 py-1.5 bg-[#E7F3FF] text-[#2A85FF] rounded-md hover:bg-[#2A85FF] hover:text-[#E7F3FF] text-xs"
                              onClick={handleOpenEditRelationshipPopup}
                            >
                              เพิ่ม
                            </button>

                            <button
                              className="inline-flex items-center justify-center gap-x-1.5 w-[88px] px-3 py-1.5 bg-[#2A85FF] text-[#E7F3FF] rounded-md hover:bg-[#E7F3FF] hover:text-[#2A85FF] text-xs"
                              onClick={() =>
                                eid && handleOpenConfirm("add", eid)
                              }
                              aria-label="บันทึก"
                            >
                              <FaSave className="text-sm" />
                              บันทึก
                            </button>

                            <button
                              className="inline-flex items-center justify-center gap-x-1.5 w-[88px] px-3 py-1.5 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
                              onClick={handleCancel}
                              aria-label="ยกเลิก"
                            >
                              <FaTimes className="text-sm" />
                              ยกเลิก
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-sm font-bold text-gray-800 mb-4">
                      ประเภทพยานหลักฐาน
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                      <div className="flex flex-wrap">
                        {["ทั้งหมด", "รูปภาพ", "วิดีโอ", "เสียง", "ไฟล์"].map(
                          (type, index, array) => (
                            <button
                              key={type}
                              className={`
                                        px-2 py-2 font-medium transition-colors duration-200 relative
                                        border
                                        ${
                                          selectedFilter ===
                                          type
                                            ? "bg-[#E8F5FF] text-[#0059C8] border-[#0059C8] z-10"
                                            : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                                        }
                                        ${
                                          index > 0
                                            ? "-ml-px"
                                            : ""
                                        }
                                        ${
                                          index === 0
                                            ? "rounded-l-md"
                                            : ""
                                        }
                                        ${
                                          index ===
                                          array.length - 1
                                            ? "rounded-r-md"
                                            : ""
                                        }
                                        text-xs
                                        w-[50px] text-center
                                    `}
                              onClick={() => setSelectedFilter(type)}
                            >
                              {type}
                            </button>
                          )
                        )}
                      </div>

                      <div className="relative flex-grow max-w-full md:max-w-xs">
                        <input
                          type="text"
                          placeholder="ค้นหาพยานหลักฐาน"
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-[23px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-xs"
                          value={relationshipSearchTerm}
                          onChange={(e) =>
                            setRelationshipSearchTerm(e.target.value)
                          }
                        />
                        <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    <div className="w-full h-px bg-[#9B9B9B]"></div>

                    <div className="flex flex-col space-y-1 pt-2">
                      {currentItems.length > 0 ? (
                        currentItems.map((item) => {
                          const fullType = getFullLocalizedFileType(
                            item.mimeType,
                            item.fileExtension
                          );
                          const internalBaseType =
                            getInternalBaseFileType(fullType);
                          const displayType =
                            getDisplayTypeForButton(internalBaseType);

                          return (
                            <div
                              key={item.id}
                              className="flex rounded-md pb-2 items-center"
                            >
                              <button
                                className="
                                          px-2 py-1 text-xs font-medium flex-shrink-0
                                          bg-[#E8F5FF] border border-[#0059C8] text-[#0059C8]
                                          rounded-l-[23px] rounded-r-none
                                          text-center
                                          min-w-[80px]
                                          "
                              >
                                {displayType}
                              </button>

                              <div className="bg-white border border-[#D7E6F9] rounded-r-md rounded-l-none px-3 py-1 flex-grow text-xs text-[#191919] flex justify-between items-center">
                                <span className="truncate">{item.name}</span>
                                {isEditing && (
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="flex items-center justify-center w-7 h-7 rounded-md text-red-600 border border-red-600 hover:bg-red-100 transition-colors ml-2 flex-shrink-0"
                                    aria-label={`ลบ ${item.name}`}
                                    title={`ลบ ${item.name}`}
                                    type="button"
                                  >
                                    <FaTrashAlt className="text-sm" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 text-center py-4 text-sm">
                          ไม่พบพยานหลักฐานที่เกี่ยวข้อง
                        </p>
                      )}
                    </div>
                    {/* Pagination */}
                    {pageCount > 1 && (
                      <div className="flex items-center justify-center mt-6 space-x-1">
                        <ReactPaginate
                          previousLabel={
                            <button
                              className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-label="Previous Page"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 19l-7-7 7-7"
                                ></path>
                              </svg>
                            </button>
                          }
                          nextLabel={
                            <button
                              className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-label="Next Page"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 5l7 7-7 7"
                                ></path>
                              </svg>
                            </button>
                          }
                          breakLabel={"..."}
                          pageCount={pageCount}
                          marginPagesDisplayed={1}
                          pageRangeDisplayed={3}
                          onPageChange={handlePageClick}
                          containerClassName={
                            "flex items-center justify-center space-x-1"
                          }
                          pageClassName={"flex items-center justify-center"}
                          pageLinkClassName={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          activeLinkClassName={"bg-blue-700 text-white"}
                          breakClassName={"px-2 py-1 text-xs text-blue-700"}
                          disabledClassName={"opacity-50 cursor-not-allowed"}
                          forcePage={currentPage}
                        />
                      </div>
                    )}

                    <EditRelationshipPopup
                      isOpen={isEditRelationshipPopupOpen}
                      onClose={handleCloseEditRelationshipPopup}
                      availableEvidenceData={relationshipEvidenceData}
                      onAddSelectedEvidence={handleAddSelectedEvidence}
                      initialSelectedEvidenceIds={
                        evidenceToEditRelationship
                          ? currentLinkedEvidence
                              .filter(
                                (linkedItem) =>
                                  linkedItem.id ===
                                  evidenceToEditRelationship.id
                              )
                              .map((item) => item.id)
                          : currentLinkedEvidence.map((item) => item.id)
                      }
                    />
                  </div>
                </div>

                <div className="lg:col-span-2 flex flex-col space-y-4">
                  <div
                    className={`w-full p-4 rounded-lg relative transition-colors duration-200 ${
                      isEditingName ? "bg-[#DCDCDC]" : "bg-white"
                    }`}
                  >
                    {/* ปุ่มแก้ไขและปุ่มบันทึก */}
                    <div className="flex justify-end mb-2">
                      {!isEditingName ? (
                        <button
                          className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-gray-100"
                          onClick={() => setIsEditingName(true)}
                          aria-label="แก้ไขชื่อพยานหลักฐาน"
                        >
                          <MdEditSquare className="text-xl" />
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md text-xs"
                            onClick={() => eid && handleOpenConfirm("saveAllEvidenceDetails", eid)}
                            aria-label="บันทึก"
                          >
                            <FaSave className="mr-2 text-lg" />
                            บันทึก
                          </button>
                          <button
                            className="flex items-center px-3 py-1 bg-gray-300 text-gray-800 rounded-md text-xs"
                            onClick={() => {
                              setIsEditingName(false);
                              setEditedName(currentEvidenceDetails.evidenceFileName);
                              setDiscoveryDate(currentEvidenceDetails.discoveryDate);
                              setDiscoveryTime(currentEvidenceDetails.discoveryTime);
                            }}
                            aria-label="ยกเลิก"
                          >
                            <FaTimes className="mr-2 text-lg" />
                            ยกเลิก
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mb-1 grid grid-cols-[auto_1fr] gap-x-2 items-baseline">
                      <div className="col-start-1 text-sm font-semibold text-gray-800 flex-shrink-0">
                        ชื่อพยานหลักฐาน:
                      </div>
                      <div className="col-start-2 text-sm font-normal text-gray-900 overflow-hidden">
                        {isEditingName ? (
                          <>
                            <input
                              type="text"
                              value={decodeURIComponent(editedName)}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="border border-gray-300 focus:border-blue-500 outline-none px-2 py-1 rounded bg-white w-full"
                              autoFocus
                            />
                          </>
                        ) : (
                          <p className="text-sm font-normal text-gray-900">
                            {decodeURIComponent(editedName)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-[auto_1fr] gap-x-2 items-baseline text-xs">
                      <div className="col-start-1 text-xs font-semibold text-gray-800 flex-shrink-0">
                        วันที่พบ:
                      </div>
                        <div className="col-start-2 text-sm font-normal text-gray-900 overflow-hidden">
                        {isEditingName ? (
                          <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 items-center">
                            <input
                              type="date"
                              className="col-start-1 border border-gray-300 focus:border-blue-500 outline-none px-2 py-1 rounded bg-white w-full text-xs"
                              value={discoveryDate || parseThaiDateToISO(mockDataFile.discoveryDate)}
                              onChange={(e) => setDiscoveryDate(e.target.value)}
                            />
                            <span className="col-start-2 text-xs font-semibold text-gray-700 whitespace-nowrap">เวลา</span>
                            <input
                              type="time"
                              className="col-start-3 border border-gray-300 focus:border-blue-500 outline-none px-2 py-1 rounded bg-white w-full text-xs"
                              value={discoveryTime || parseThaiTimeToISO(mockDataFile.discoveryTime)}
                              onChange={(e) => setDiscoveryTime(e.target.value)}
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-gray-900">
                            {formatDateToThai(displayDiscoveryDate)} <strong>เวลา</strong> {formatTimeToThai(displayDiscoveryTime)}
                          </p>
                        )}
                        </div>
                    </div>

                    <div className="mb-1 grid grid-cols-[auto_1fr] gap-x-2 items-baseline">
                      <div className="col-start-1 text-xs font-semibold text-gray-800 flex-shrink-0">
                        วันที่นำเข้า:
                      </div>
                      <p className="col-start-2 text-xs text-gray-900">
                        {mockDataFile.importDate} <strong>เวลา</strong> {mockDataFile.importTime}
                      </p>
                    </div>

                    <div className="mb-1 grid grid-cols-[auto_1fr] gap-x-2 items-baseline">
                      <div className="col-start-1 text-xs font-semibold text-gray-800 flex-shrink-0">
                        ผู้นำเข้า:
                      </div>
                      <p className="col-start-2 text-xs text-gray-900">
                        {mockDataFile.importer}
                      </p>
                    </div>
                    <div className="mb-1 grid grid-cols-[auto_1fr] gap-x-2 items-baseline">
                      <div className="col-start-1 text-xs font-semibold text-gray-800 flex-shrink-0">
                        ประเภท:
                      </div>
                      <p className="col-start-2 text-xs text-gray-900">
                        {mockDataFile.type}
                      </p>
                    </div>
                    <div className="mb-4 grid grid-cols-[auto_1fr] gap-x-2 items-baseline">
                      <div className="col-start-1 text-xs font-semibold text-gray-800 flex-shrink-0">
                        ขนาด:
                      </div>
                      <p className="col-start-2 text-xs text-gray-900">
                        {mockDataFile.size}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-full p-4 rounded-lg relative transition-colors duration-200 ${
                      isEditingDescription ? "bg-[#DCDCDC]" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-sm font-semibold text-gray-800 bg-[#223C79] text-white rounded-lg px-2 py-1">
                        คำอธิบาย
                      </h2>
                      {!isEditingDescription ? (
                        <button
                          className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                          onClick={handleEditDescription}
                          aria-label="แก้ไขคำอธิบาย"
                        >
                          <MdEditSquare className="text-xl" />
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            className="flex items-center px-3 py-1 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-200 text-xs"
                            onClick={() =>
                              eid && handleOpenConfirm("saveDescription", eid)
                            }
                            aria-label="บันทึกคำอธิบาย"
                          >
                            <FaSave className="mr-2 text-lg" />
                            บันทึก
                          </button>
                          <button
                            className="flex items-center px-3 py-1 bg-gray-300 text-gray-800 font-semibold rounded-md shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition-colors duration-200 text-xs"
                            onClick={handleCancelDescriptionEdit}
                            aria-label="ยกเลิกการแก้ไขคำอธิบาย"
                          >
                            <FaTimes className="mr-2 text-lg" />
                            ยกเลิก
                          </button>
                        </div>
                      )}
                    </div>

                    {!isEditingDescription ? (
                      <p className="text-xs text-gray-900 mt-2">
                        {description}
                      </p>
                    ) : (
                      <textarea
                        value={tempDescription}
                        onChange={(e) => setTempDescription(e.target.value)}
                        className="w-full p-2 border border-gray-300 focus:border-blue-500 outline-none text-gray-900 text-xs rounded resize-y min-h-[100px] mt-2 bg-white"
                        autoFocus
                      />
                    )}
                  </div>

                  <div
                    className={`w-full p-6 rounded-lg relative transition-colors duration-200 ${
                      isEditingLocation ? "bg-[#DCDCDC]" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-sm font-semibold text-gray-800 bg-[#223C79] text-white rounded-lg px-2 py-1">
                        สถานที่พบ
                      </h2>
                      {!isEditingLocation ? (
                        <button
                          className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                          onClick={handleEditLocationDetails}
                          aria-label="แก้ไขสถานที่"
                        >
                          <MdEditSquare className="text-xl" />
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            className="flex items-center px-3 py-1 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-200 text-xs"
                            onClick={() =>
                              eid && handleOpenConfirm("saveLocation", eid)
                            }
                            aria-label="บันทึกสถานที่"
                          >
                            <FaSave className="mr-2 text-lg" />
                            บันทึก
                          </button>
                          <button
                            className="flex items-center px-3 py-1 bg-gray-300 text-gray-800 font-semibold rounded-md shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition-colors duration-200 text-xs"
                            onClick={handleCancelLocationDetailsEdit}
                            aria-label="ยกเลิกการแก้ไขสถานที่"
                          >
                            <FaTimes className="mr-2 text-lg" />
                            ยกเลิก
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="relative mb-4 flex justify-center">
                      <div className="w-11/12 relative">
                        {isEditingLocation && isLoaded ? (
                          <Autocomplete
                            onLoad={onLoadAutocomplete}
                            onPlaceChanged={onPlaceChanged}
                            options={{
                              fields: [
                                "formatted_address",
                                "geometry",
                                "name",
                                "place_id",
                              ],
                              types: ["geocode"],
                            }}
                          >
                            <input
                              type="text"
                              id="foundLocationSearch"
                              placeholder="ค้นหาที่อยู่หรือชื่ออาคาร"
                              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-[23px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-xs"
                              value={tempLocationDetails.foundLocation}
                              onChange={(e) =>
                                setTempLocationDetails((prev) => ({
                                  ...prev,
                                  foundLocation: e.target.value,
                                }))
                              }
                              autoFocus
                            />
                          </Autocomplete>
                        ) : null}

                        {isEditingLocation && isLoaded && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <FaSearch className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                      {isLoaded ? (
                        <GoogleMap
                          mapContainerStyle={mapContainerStyle}
                          center={
                            isEditingLocation &&
                            isValidCoordinates(
                              tempLocationDetails.latitude,
                              tempLocationDetails.longitude
                            )
                              ? {
                                  lat: tempLocationDetails.latitude,
                                  lng: tempLocationDetails.longitude,
                                }
                              : {
                                  lat: locationDetails.latitude,
                                  lng: locationDetails.longitude,
                                }
                          }
                          zoom={15}
                          onLoad={onLoadMap}
                          onUnmount={onUnmountMap}
                          onClick={isEditingLocation ? onMapClick : undefined}
                        >
                          
                          {/* Marker for edit mode */}
                          {isEditingLocation &&
                            isValidCoordinates(
                              tempLocationDetails.latitude,
                              tempLocationDetails.longitude
                            ) && (
                              <>
                                {console.log(
                                  "📍 Showing EDIT marker at:",
                                  tempLocationDetails.latitude,
                                  tempLocationDetails.longitude
                                )}
                                <Marker
                                  position={{
                                    lat: tempLocationDetails.latitude,
                                    lng: tempLocationDetails.longitude,
                                  }}
                                />
                              </>
                            )}

                          {/* Marker for view mode */}
                          {!isEditingLocation &&
                            isValidCoordinates(
                              locationDetails.latitude,
                              locationDetails.longitude
                            ) && (
                              <>
                                {console.log(
                                  "📍 Showing VIEW marker at:",
                                  locationDetails.latitude,
                                  locationDetails.longitude
                                )
                                }
                                <Marker
                                  position={{
                                    lat: locationDetails.latitude,
                                    lng: locationDetails.longitude,
                                  }}
                                  onLoad={() => {
                                    console.log("✅ Marker loaded");
                                  }}
                                />
                              </>
                            )}
                        </GoogleMap>
                      ) : (
                        <div className="w-full h-72 flex items-center justify-center text-gray-500">
                          กำลังโหลดแผนที่...
                        </div>
                      )}

                    <div className="flex flex-col pt-4 mt-2 text-gray-700">
                      <p className="mb-2">
                        <span className="text-xs text-gray-700 font-semibold">
                          สถานที่พบ:{" "}
                        </span>
                        <span className="text-xs font-normal text-blue-600">
                          {isEditingLocation
                            ? tempLocationDetails.foundLocation || "-"
                            : locationDetails.foundLocation || "-"}
                        </span>
                      </p>
                      <p className="mb-2">
                        <span className="text-xs text-gray-700 font-semibold">
                          ละติจูด:{" "}
                        </span>
                        <span className="text-xs font-normal text-blue-600">
                          {isEditingLocation
                            ? tempLocationDetails.latitude
                              ? tempLocationDetails.latitude.toFixed(6)
                              : "-"
                            : locationDetails.latitude
                            ? locationDetails.latitude.toFixed(6)
                            : "-"}
                        </span>
                      </p>
                      <p className="mb-2">
                        <span className="text-xs text-gray-700 font-semibold">
                          ลองจิจูด:{" "}
                        </span>
                        <span className="text-xs font-normal text-blue-600">
                          {isEditingLocation
                            ? tempLocationDetails.longitude
                              ? tempLocationDetails.longitude.toFixed(6)
                              : "-"
                            : locationDetails.longitude
                            ? locationDetails.longitude.toFixed(6)
                            : "-"}
                        </span>
                      </p>
                      <p className="text-xs text-gray-700 font-semibold mb-2">
                        รายละเอียดเพิ่มเติม
                      </p>
                      {isEditingLocation ? (
                        <textarea
                          id="additionalDetails"
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px] bg-white text-xs"
                          value={tempLocationDetails.additionalDetails}
                          onChange={(e) =>
                            setTempLocationDetails((prev) => ({
                              ...prev,
                              additionalDetails: e.target.value,
                            }))
                          }
                        ></textarea>
                      ) : (
                        <p className="text-xs text-gray-900 mt-2">
                          {locationDetails.additionalDetails || "-"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceDetailPage;
