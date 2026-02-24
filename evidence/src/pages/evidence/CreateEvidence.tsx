import {
  Autocomplete,
  GoogleMap,
  MarkerF,
  useLoadScript,
} from "@react-google-maps/api";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FaCloudUploadAlt,
  FaFileAlt,
  FaPlus,
  FaSave,
  FaSearch,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { fetchCaseIdAPI } from "../../api/caseHandlers";
import AlertPopup from "../../components/common/AlertPopup";
import Header from "../../components/common/Header";
import LeftMenu from "../../components/common/LeftMenu";
import LoadingOverlay from "../../components/common/LoadingOverlay";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "0.5rem",
};

const defaultMapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
};

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = [
  "places",
];

const defaultCenter = {
  lat: 13.645792,
  lng: 100.535217,
};

const MAX_FILE_SIZE = 1024 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/svg+xml",
  "audio/wav",
  "audio/mpeg",
  "video/mpeg",
  "video/mp4",
  "video/x-msvideo",
]);

const isValidFile = (
  file: File,
  setErrorMessage: (msg: string) => void,
  setShowError: (show: boolean) => void
) => {
  if (file.size > MAX_FILE_SIZE) {
    setErrorMessage("ขนาดไฟล์เกิน 1GB โปรดเลือกไฟล์ที่เล็กกว่า");
    setShowError(true);
    return false;
  }

  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    console.warn("Unsupported file type:", file.type);
    setErrorMessage(
      `ประเภทไฟล์ไม่ถูกต้อง: ${file.type} (ไฟล์ที่อนุญาต: Word, Excel, PowerPoint, CSV, PDF, รูปภาพ, เสียง, วิดีโอ)`
    );
    setShowError(true);
    return false;
  }
  return true;
};

const getFriendlyFileType = (mimeType: string, fileName: string) => {
  const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

  if (mimeType.startsWith("image/")) {
    return `รูปภาพ/${fileExtension}`;
  } else if (mimeType.startsWith("audio/")) {
    return `เสียง/${fileExtension}`;
  } else if (mimeType.startsWith("video/")) {
    return `วีดิโอ/${fileExtension}`;
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
  return mimeType;
};

const CreateEvidencePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const { id } = useParams();

  const viewPage = id ? "เพิ่มพยานหลักฐาน" : "";

  const pageTitle = ["จัดการคดี", "แก้ไขคดี", viewPage];

  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [caseLoading, setCaseLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [evidenceName, setEvidenceName] = useState("");
  const [foundLocation, setFoundLocation] = useState("");
  const [description, setDescription] = useState("");
  const [remark, setRemark] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [discoveryDate, setDiscoveryDate] = useState<string>("");
  const [discoveryTime, setDiscoveryTime] = useState<string>("");

  const addDaysToDiscoveryDate = (daysToAdd: number) => {
    if (discoveryDate) {
      const parsedDate = new Date(discoveryDate);

      if (!isNaN(parsedDate.getTime())) {
        parsedDate.setDate(parsedDate.getDate() + daysToAdd);
        const newDateString = parsedDate.toISOString().split("T")[0];
        setDiscoveryDate(newDateString);
      } else {
        console.error("Invalid date format for discoveryDate:", discoveryDate);
      }
    }
  };

  const addMinutesToDiscoveryTime = (minutesToAdd: number) => {
    if (discoveryTime) {
      const dummyDate = "2000-01-01";
      const combinedDateTimeString = `${dummyDate}T${discoveryTime}:00`;

      const parsedTime = new Date(combinedDateTimeString);

      if (!isNaN(parsedTime.getTime())) {
        parsedTime.setMinutes(parsedTime.getMinutes() + minutesToAdd);
        const newTimeString = parsedTime
          .toTimeString()
          .split(" ")[0]
          .substring(0, 5);

        setDiscoveryTime(newTimeString);
      } else {
        console.error("Invalid time format for discoveryTime:", discoveryTime);
      }
    }
  };

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY || "",
    libraries: libraries,
    language: "th",
    region: "TH",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [currentCenter, setCurrentCenter] = useState(defaultCenter);
  const [importerName, setImporterName] = useState<string>("-");

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("session") || "{}");
      if (session?.user?.pf_user_Firstname && session?.user?.pf_user_Lastname) {
        setImporterName(
          `${session.user.pf_user_Firstname} ${session.user.pf_user_Lastname}`
        );
      } else {
        setImporterName("ไม่พบข้อมูลผู้ใช้งาน");
      }
    } catch (e) {
      console.error("Failed to parse session from localStorage", e);
      setImporterName("ข้อผิดพลาดในการโหลดข้อมูลผู้ใช้");
    }
  }, []);

  const onMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setMarkerPosition({ lat, lng });
        if (isLoaded && window.google) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              setFoundLocation(results[0].formatted_address);
            } else {
              console.error("Geocoder failed due to: " + status);
              setFoundLocation(
                `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
              );
            }
          });
        }
        console.log("Map clicked at:", lat, lng);
      }
    },
    [isLoaded]
  );

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback((map: google.maps.Map) => {
    mapRef.current = null;
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();

      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMarkerPosition({ lat, lng });
        setCurrentCenter({ lat, lng });
        setFoundLocation(place.name || place.formatted_address || "");

        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(15);
        }
      } else {
        setErrorMessage("ไม่พบข้อมูลตำแหน่งสำหรับสถานที่นี้");
        setShowError(true);
      }
    }
  }, []);

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
    if (filePreviewUrl) {
      return () => {
        URL.revokeObjectURL(filePreviewUrl);
      };
    }
  }, [filePreviewUrl]);

  const processSelectedFile = (file: File) => {
    if (isValidFile(file, setErrorMessage, setShowError)) {
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
      if (
        showError &&
        (errorMessage.includes("ประเภทไฟล์ไม่ถูกต้อง") ||
          errorMessage.includes("ขนาดไฟล์เกิน"))
      ) {
        setErrorMessage("");
        setShowError(false);
      }
    } else {
      setSelectedFile(null);
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
      setFilePreviewUrl(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      processSelectedFile(event.target.files[0]);
    }
  };

  const handleBrowseFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processSelectedFile(event.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleSaveEvidence = () => {
    if (!selectedFile) {
      setErrorMessage("กรุณาเลือกไฟล์พยานหลักฐานก่อนบันทึก");
      setShowError(true);
      return;
    }
    if (!evidenceName) {
      setErrorMessage("กรุณากรอกชื่อพยานหลักฐานก่อนบันทึก");
      setShowError(true);
      return;
    }
    if (!foundLocation && !markerPosition?.lat && !markerPosition?.lng) {
      setErrorMessage("กรุณาเลือกสถานที่พบก่อนบันทึก");
      setShowError(true);
      return;
    }

    console.log("Saving Evidence:", {
      caseId: id,
      file: selectedFile,
      name: evidenceName,
      location: foundLocation,
      mapLat: markerPosition?.lat,
      mapLng: markerPosition?.lng,
      remark: remark,
      description: description,
    });
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setErrorMessage("บันทึกพยานหลักฐานสำเร็จ!");
      setShowError(true);
      navigate(`/manage-case/update-case/${id}/evidence`);
    }, 2000);
  };

  const renderMap = () => {
    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded)
      return (
        <div className="flex items-center justify-center h-full">
          กำลังโหลดแผนที่...
        </div>
      );

    return (
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={currentCenter}
        zoom={markerPosition ? 15 : 10}
        options={defaultMapOptions}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        onClick={onMapClick}
      >
        {markerPosition && <MarkerF position={markerPosition} />}
      </GoogleMap>
    );
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
            <div className="row-span-2 flex justify-between items-center w-full">
              <button
                onClick={() => navigate(-1)}
                className="cursor-pointer border border-blue-500 text-blue-500 px-4 py-2 rounded-md hover:bg-blue-50 transition"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleSaveEvidence}
                className="cursor-pointer flex items-center gap-2  bg-blue-500 text-white  px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                <FaSave /> บันทึก
              </button>
            </div>
          </div>

          <div className="px-4 pb-2">
            <div className="bg-[#F4F4F4] p-6 rounded-lg w-full">
              <div className="flex items-center flex-wrap gap-x-2 text-sm mb-4">
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
              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="col-span-1 flex flex-col gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4">
                      นำเข้าข้อมูลพยานหลักฐาน
                    </h2>
                    <div
                      className="border border-dashed border-blue-400 rounded-lg flex flex-col items-center justify-center text-center h-[400px]"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      <div className="flex flex-col items-center justify-center w-full py-8 px-6">
                        {selectedFile ? (
                          <div className="relative flex flex-col items-center justify-center w-full h-full">
                            {filePreviewUrl ? (
                              selectedFile.type.startsWith("image/") ? (
                                <div className="w-full h-[300px] flex items-center justify-center overflow-hidden border border-gray-300 rounded-md bg-gray-50">
                                  <TransformWrapper
                                    initialScale={1}
                                    minScale={0.1}
                                    maxScale={5}
                                    limitToBounds={true}
                                    panning={{ disabled: false }}
                                    doubleClick={{ disabled: true }}
                                    wheel={{ disabled: false }}
                                  >
                                    {({
                                      zoomIn,
                                      zoomOut,
                                      resetTransform,
                                      ...rest
                                    }) => (
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
                                          src={filePreviewUrl}
                                          alt="File preview"
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                          }}
                                        />
                                      </TransformComponent>
                                    )}
                                  </TransformWrapper>
                                </div>
                              ) : selectedFile.type.startsWith("video/") ? (
                                <video
                                  src={filePreviewUrl}
                                  controls
                                  className="max-w-full h-[300px] object-contain mb-2"
                                />
                              ) : (
                                <FaFileAlt
                                  className="text-blue-500 pb-4"
                                  size={120}
                                />
                              )
                            ) : (
                              <FaFileAlt
                                className="text-blue-500 pb-4"
                                size={120}
                              />
                            )}
                          </div>
                        ) : (
                          <>
                            <FaCloudUploadAlt
                              className="text-blue-500 mb-4"
                              size={90}
                            />
                            <p className="text-blue-800 text-lg font-semibold text-sm">
                              เลือกไฟล์จากเครื่องของคุณ หรือลากไฟล์มาวางที่นี่
                            </p>
                            <p className="text-gray-500 text-xs mb-2 mt-2 text-xs">
                              MS Word, MS Excel, MS PowerPoint, CSV, PDF, <br />
                              JPEG, MPEG, PNG, SVG, WAV, MP3, MP4, AVI <br />
                              สามารถอัปโหลดขนาดสูงสุดไม่เกิน 1GB
                            </p>
                          </>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept={Array.from(ALLOWED_FILE_TYPES).join(",")}
                        />
                        <button
                          onClick={handleBrowseFileClick}
                          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition flex items-center gap-2 mt-2 text-xs"
                        >
                          <FaPlus className="h-3 w-3" />
                          Browse File
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-gray-700 font-semibold mb-2 text-sm">
                      ข้อมูลไฟล์:
                    </p>
                    <p className="text-gray-700 text-xs">
                      ชื่อไฟล์:{" "}
                      <span className="font-normal ml-2 text-xs">
                        {selectedFile ? selectedFile.name : "-"}
                      </span>
                    </p>
                    <p className="text-gray-700 text-xs">
                      วันที่นำเข้า:{" "}
                      <span className="font-normal ml-2 text-xs">
                        {selectedFile
                          ? new Date().toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "numeric",
                              year: "numeric",
                            })
                          : "-"}
                      </span>
                    </p>
                    <p className="text-gray-700 text-xs">
                      ผู้นำเข้า:{" "}
                      <span className="font-normal ml-2 text-xs">
                        {importerName}
                      </span>
                    </p>
                    <p className="text-gray-700 text-xs">
                      ประเภท:{" "}
                      <span className="font-normal ml-2 text-xs">
                        {selectedFile
                          ? getFriendlyFileType(
                              selectedFile.type,
                              selectedFile.name
                            )
                          : "-"}
                      </span>
                    </p>
                    <p className="text-gray-700 text-xs">
                      ขนาด:{" "}
                      <span className="font-normal ml-2 text-xs">
                        {selectedFile
                          ? `${(selectedFile.size / (1024 * 1024)).toFixed(
                              2
                            )} MB`
                          : "-"}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="col-span-1 flex flex-col gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <label
                      htmlFor="evidenceName"
                      className="block text-gray-700 font-semibold mb-1 text-sm"
                    >
                      ชื่อพยานหลักฐาน
                    </label>
                    <input
                      type="text"
                      id="evidenceName"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs"
                      placeholder=""
                      value={evidenceName}
                      onChange={(e) => setEvidenceName(e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label
                          htmlFor="discoveryDate"
                          className="block text-gray-700 font-semibold mb-1 text-sm"
                        >
                          วันที่พบ
                        </label>
                        <input
                          type="date"
                          id="discoveryDate"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs"
                          value={discoveryDate}
                          onChange={(e) => setDiscoveryDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="discoveryTime"
                          className="block text-gray-700 font-semibold mb-1 text-sm"
                        >
                          เวลาที่พบ
                        </label>
                        <input
                          type="time"
                          id="discoveryTime"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs"
                          value={discoveryTime}
                          onChange={(e) => setDiscoveryTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <label
                      htmlFor="description"
                      className="block text-gray-700 font-semibold mb-1 text-sm"
                    >
                      คำอธิบาย
                    </label>
                    <textarea
                      id="description"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-28 resize-none text-xs"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <label
                      htmlFor="foundLocation"
                      className="block text-gray-700 font-semibold mb-1 text-sm"
                    >
                      สถานที่พบ
                    </label>
                    <div className="relative">
                      {isLoaded && (
                        <Autocomplete
                          onLoad={(autocomplete) => {
                            autocompleteRef.current = autocomplete;
                          }}
                          onPlaceChanged={onPlaceChanged}
                        >
                          <input
                            type="text"
                            id="foundLocation"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10 text-xs"
                            placeholder="ค้นหาที่อยู่หรือชื่ออาคาร"
                            value={foundLocation}
                            onChange={(e) => setFoundLocation(e.target.value)}
                          />
                        </Autocomplete>
                      )}
                      {!isLoaded && (
                        <input
                          type="text"
                          id="foundLocation"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10"
                          placeholder="ค้นหาที่อยู่หรือชื่ออาคาร"
                          value={foundLocation}
                          onChange={(e) => setFoundLocation(e.target.value)}
                          disabled
                        />
                      )}
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <FaSearch className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="mt-2">{renderMap()}</div>
                    <div className="flex flex-col pt-4 mt-2 text-gray-700 text-xs">
                      <p className="mt-2">
                        <span className="text-gray-700 pt-2">สถานที่พบ:</span>{" "}
                        <span className="font-normal text-blue-600">
                          {foundLocation || "-"}
                        </span>
                      </p>
                      <p className="mt-2">
                        <span className="text-gray-700 pt-2">ละติจูด:</span>{" "}
                        <span className="font-normal text-blue-600">
                          {markerPosition ? markerPosition.lat.toFixed(6) : "-"}
                        </span>
                      </p>
                      <p className="mt-2">
                        <span className="text-gray-700 pt-2">ลองจิจูด:</span>{" "}
                        <span className="font-normal text-blue-600">
                          {markerPosition ? markerPosition.lng.toFixed(6) : "-"}
                        </span>
                      </p>
                      <p className="mt-2">
                        <span className="text-gray-700 pt-2">
                          รายละเอียดเพิ่มเติม
                        </span>
                      </p>
                      <textarea
                        id="remark"
                        className="w-full p-2 mt-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-28 resize-none"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                      ></textarea>
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

export default CreateEvidencePage;
