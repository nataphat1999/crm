import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCaseIdAPI } from "../../api/caseHandlers";
import { fetchEvidenceIdAPI } from "../../api/evidenceHandlers";
import AlertPopup from "../../components/common/AlertPopup";
import Header from "../../components/common/Header";
import LeftMenu from "../../components/common/LeftMenu";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import GitDisplay from "../../components/evidence/GitDisplay";
import { mapEvidenceFromApi } from "../../mappers/EvidenceMapper";
import { CaseModel } from "../../types/case";
import { EvidenceModel, EvidenceVersion } from "../../types/evidence";
import { UserCase } from "../../types/user";
const defaultCaseForm: Partial<CaseModel> = {
  type: "",
  caseNumber: "",
  caseName: "",
  description: "",
  caseStatus: true,
};
const defaultEviForm: Partial<EvidenceModel> = {
  category: "",
  lable: "",
  description: "",
};
export default function VersionControlEvidencePage() {
  const { id, eid } = useParams();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [caseDetails, setCaseDetails] =
    useState<Partial<CaseModel>>(defaultCaseForm);
  const [eviDetails, setEviDetails] =
    useState<Partial<EvidenceModel>>(defaultEviForm);
  const [evidenceHistory, setEvidenceHistory] = useState<EvidenceVersion | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const session = JSON.parse(localStorage.getItem("session") || "{}");
  const userId = session?.user_id ? session?.user_id : "";
  const [members, setMembers] = useState<UserCase[]>([]);
  const [casePermission, setCasePermission] = useState<UserCase>();
  const viewPage = id ? "พยานหลักฐาน" : "";
  const pageTitle = useMemo(() => {
    return [
      "จัดการคดี",
      viewPage,
      "เชื่อมโยงการเปลี่ยนแปลง",
    ];
  }, [viewPage]);
  const loadCaseAndEvidenceDetails = async () => {
    setLoading(true);
    try {
      const caseResult = await fetchCaseIdAPI({ caseId: id! });
      setCaseDetails(caseResult);
      setMembers(caseResult.permissions ?? []);
      const fetchedEvidence = await fetchEvidenceIdAPI({
        evidenceId: eid!,
      });

      console.log(fetchedEvidence)
      setEvidenceHistory(fetchedEvidence);
      const eviData = {
        ...mapEvidenceFromApi(fetchedEvidence),
        id: eid,
      };
      setEviDetails(eviData);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการโหลดข้อมูล";
      setErrorMessage(message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (id && eid) {
      loadCaseAndEvidenceDetails();
    }
  }, [id, eid]);
  useEffect(() => {
    if (members.length > 0) {
      const matched = members.find((m) => m.id === userId) || null;
      setCasePermission(matched!);
    }
  }, [members, userId]);
  const handleBack = () => {
    if (id && eid) {
      navigate(`/manage-case/update-case/${id}/evidence/${eid}`);
    }
  };
  return (
    <div className="grid lg:grid-cols-6 lg:bg-menu min-h-screen">
      {/* เมนูด้านซ้าย */}
      <div className="hidden lg:block lg:h-full">
        <LeftMenu />
      </div>
      {/* พื้นที่เนื้อหาหลัก */}
      <div className="bg-[#FFFFFF] min-h-screen col-span-5 rounded-s-3xl overflow-y-auto">
        <Header headerText={pageTitle} />
        {loading && <LoadingOverlay />}
        {showError && (
          <AlertPopup
            message={errorMessage}
            onClose={() => setShowError(false)}
          />
        )}
        <div className="container mx-auto p-4">
          <div className="mb-4 ps-6">
            <div className="row-span-2 mb-2">
              <button
                onClick={() => navigate(-1)}
                className="cursor-pointer border border-blue-500 text-blue-500 px-4 py-2 rounded-md hover:bg-blue-50 transition"
              >
                ย้อนกลับ
              </button>
            </div>
            {caseDetails && evidenceHistory && (
              <GitDisplay
                caseDetails={caseDetails}
                eviDetails={eviDetails}
                loading={loading}
                id={eid}
                evidenceHistory={evidenceHistory}
              />
            )}
            {(!caseDetails || !evidenceHistory) && !loading && (
                <p className="text-center text-gray-500 mt-8">ไม่พบข้อมูลการเชื่อมโยงพยานหลักฐาน</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}