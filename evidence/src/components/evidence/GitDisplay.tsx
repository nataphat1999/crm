import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaFileSignature,
  FaHandPaper,
  FaMapMarkerAlt,
  FaUser,
  FaFileAlt,
  FaImage,
  FaVideo,
  FaVolumeUp,
  FaSearchPlus,
} from "react-icons/fa";
import { MdManageSearch } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { CaseModel } from "../../types/case";
import {
  EvidenceModel,
  EvidenceVersion,
} from "../../types/evidence";
import { UserCase } from "../../types/user";

type CommitNode = {
  id: string;
  label: string;
  branch: string;
  parentId?: string;
  detail?: ReactNode;
  hash?: string;
};

type CommitWithPosition = CommitNode & {
  x: number;
  y: number;
  level: number;
};

type Props = {
  caseDetails: Partial<CaseModel>;
  eviDetails: Partial<EvidenceModel>;
  loading: boolean;
  id?: string;
  casePermission?: UserCase;
  evidenceHistory: EvidenceVersion | null;
};

const getRandomColor = (() => {
  const usedHues = new Set<number>();
  return () => {
    if (usedHues.size >= 360) {
      usedHues.clear();
    }
    let hue: number;
    do {
      hue = Math.floor(Math.random() * 360);
    } while (usedHues.has(hue));
    usedHues.add(hue);
    return `hsl(${hue}, 70%, 55%)`;
  };
})();

const EVIDENCE_CATEGORY_MAP: { [key: string]: string } = {
  Person: "พยานบุคคล",
  Evidence: "หลักฐาน",
  Location: "ตำแหน่ง",
  Action: "การกระทำ",
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

const getFileIcon = (fileExtension: string | null) => {
  if (!fileExtension) return <FaFileAlt />;

  const lowerCaseExt = fileExtension.toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".gif"].includes(lowerCaseExt)) {
    return <FaImage />;
  } else if ([".mp4", ".avi", ".mov"].includes(lowerCaseExt)) {
    return <FaVideo />;
  } else if ([".mp3", ".wav"].includes(lowerCaseExt)) {
    return <FaVolumeUp />;
  }
  return <FaFileAlt />;
};

const renderFileContent = (
  filePath: string | undefined | null,
  fileExtension: string | undefined | null,
  fileName: string | undefined | null
) => {
  if (!filePath || !fileExtension) {
    return (
      <div className="flex items-center text-gray-500 justify-center h-full">
        ไม่มีไฟล์
      </div>
    );
  }

  const lowerCaseExt = fileExtension.toLowerCase();
  const fileType = (() => {
    if ([".jpg", ".jpeg", ".png", ".gif"].includes(lowerCaseExt)) {
      return "image";
    } else if ([".mp4", ".avi", ".mov"].includes(lowerCaseExt)) {
      return "video";
    } else if ([".mp3", ".wav"].includes(lowerCaseExt)) {
      return "audio";
    }
    return "document";
  })();

  switch (fileType) {
    case "image":
      return (
        <img
          src={filePath}
          alt={fileName || ""}
          className="max-w-full max-h-48 object-contain rounded"
        />
      );
    case "video":
      return (
        <video
          src={filePath}
          controls
          className="max-w-full max-h-48 rounded"
        />
      );
    case "audio":
      return (
        <audio
          src={filePath}
          controls
          className="max-w-full"
        />
      );
    default:
      return (
        <div className="flex items-center justify-center h-16 rounded">
          <span className="text-6xl text-blue-600">
            {getFileIcon(fileExtension)}
          </span>
        </div>
      );
  }
};

const makeColorSofter = (hslColor: string): string => {
  if (!hslColor) return "#f8f9fa";
  try {
    if (hslColor.startsWith("#")) {
      const r = Number.parseInt(hslColor.slice(1, 3), 16);
      const g = Number.parseInt(hslColor.slice(3, 5), 16);
      const b = Number.parseInt(hslColor.slice(5, 7), 16);
      const lightR = Math.floor(r * 0.3 + 255 * 0.7);
      const lightG = Math.floor(g * 0.3 + 255 * 0.7);
      const lightB = Math.floor(b * 0.3 + 255 * 0.7);
      return `rgb(${lightR}, ${lightG}, ${lightB})`;
    }
    const parts = hslColor.match(/\d+/g);
    if (!parts || parts.length < 3) {
      return "#f8f9fa";
    }
    const hue = Number.parseInt(parts[0], 10);
    return `hsl(${hue}, 30%, 95%)`;
  } catch (error) {
    console.error("Error in makeColorSofter:", error);
    return "#f8f9fa";
  }
};


interface EvidenceDetailProps {
  title: string;
  fileContent: ReactNode;
  name: string;
  date: string;
  owner: string;
  type: string;
  size: string;
  bgColor?: string;
  nodeId: string;
  nodeLabel: string;
  isRootVersion: boolean;
  parentVersion?: string;
  onClose: () => void;
}

const renderEvidenceDetail = ({
  title,
  fileContent,
  name,
  date,
  owner,
  type,
  size,
  bgColor = "#ffffff",
  nodeId,
  nodeLabel,
  isRootVersion,
  parentVersion,
  onClose,
}: EvidenceDetailProps): ReactNode => {
  return (
    <div className="relative" style={{ zIndex: 10 }}>
      <div
        className="relative rounded-lg p-4 w-80 max-w-[90vw] max-h-[80vh] overflow-y-auto shadow-2xl"
        style={{ backgroundColor: bgColor, zIndex: 10 }}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-800">
              {isRootVersion ? (
                title
              ) : (
                <>
                  สืบเนื่องจากต้นฉบับ V {parentVersion}
                </>
              )}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full hover:bg-gray-200 p-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <input type="hidden" value={nodeId} />
        <div className="mb-4 flex justify-center">{fileContent}</div>
        <div className="grid grid-cols-[auto_1fr] gap-x-2 text-sm">
          <span className="font-medium text-gray-600">เวอร์ชัน:</span>
          <span className="text-gray-800">{nodeLabel}</span>
          <span className="font-medium text-gray-600">ชื่อไฟล์:</span>
          <span className="text-gray-800">{name}</span>
          <span className="font-medium text-gray-600">วันที่นำเข้า:</span>
          <span className="text-gray-800">{date}</span>
          <span className="font-medium text-gray-600">ประเภท:</span>
          <span className="text-gray-800">{type}</span>
          <span className="font-medium text-gray-600">ขนาด:</span>
          <span className="text-gray-800">{size}</span>
        </div>
      </div>
    </div>
  );
};


export default function GitDisplay({
  caseDetails,
  eviDetails,
  loading,
  id,
  casePermission,
  evidenceHistory,
}: Props) {
  const navigate = useNavigate();
  const [activeNode, setActiveNode] = useState<{
    id: string;
    x: number;
    y: number;
    label: string;
    detail: ReactNode;
    bgColor?: string;
  } | null>(null);

  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );
  const [activeSvgOffset, setActiveSvgOffset] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "none";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      document.body.removeChild(container);
    };
  }, []);

  useEffect(() => {
    if (!activeNode) return;

    const nodeScreenX = activeSvgOffset.x + activeNode.x;
    const nodeScreenY = activeSvgOffset.y + activeNode.y;

    const popupWidth = Math.min(320, window.innerWidth * 0.9);
    const popupHeight = Math.min(400, window.innerHeight * 0.8);
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let popupX, popupY;

    if (nodeScreenX + 60 + popupWidth < windowWidth - 20) {
      popupX = nodeScreenX + 60;
    } else {
      popupX = nodeScreenX - popupWidth - 60;
    }

    popupY = nodeScreenY - popupHeight / 2;

    const verticalPadding = 60;
    if (popupY + popupHeight > windowHeight - verticalPadding) {
      popupY = windowHeight - popupHeight - verticalPadding;
    }
    if (popupY < verticalPadding) {
      popupY = verticalPadding;
    }
    setPopupPosition({ x: popupX, y: popupY });
  }, [activeNode, activeSvgOffset]);

  const closePopup = useCallback(() => {
    setActiveNode(null);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (activeNode && popupRef.current && !popupRef.current.contains(e.target as Node)) {
        closePopup();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [activeNode, closePopup]);


  const generateCommitsWithPosition = useCallback(
    (rawCommits: CommitNode[]): CommitWithPosition[] => {
      const nodeGap = 100;
      const siblingGap = 120;
      const startY = 600;

      const nodes = new Map<string, CommitNode>();
      const childrenMap = new Map<string, string[]>();

      rawCommits.forEach(commit => {
        nodes.set(commit.id, commit);
        if (commit.parentId) {
          if (!childrenMap.has(commit.parentId)) {
            childrenMap.set(commit.parentId, []);
          }
          childrenMap.get(commit.parentId)!.push(commit.id);
        }
      });

      const rootNodes = rawCommits.filter(c => !c.parentId).map(c => c.id);
      const positioned: CommitWithPosition[] = [];
      const visited = new Set<string>();
      const queue: { id: string; level: number; x: number; y: number; }[] = [];

      rootNodes.forEach(id => {
        queue.push({ id, level: 0, x: 0, y: startY });
      });

      while (queue.length > 0) {
        const { id, level, x, y } = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);

        const commit = nodes.get(id)!;
        
        positioned.push({
          ...commit,
          x,
          y,
          level,
        });

        const children = childrenMap.get(id) || [];
        if (children.length > 0) {
          const childrenY = y - nodeGap;
          let childrenTotalWidth = (children.length - 1) * siblingGap;
          let startChildrenX = x - childrenTotalWidth / 2;

          children.forEach((childId, index) => {
            const childX = startChildrenX + index * siblingGap;
            queue.push({ id: childId, level: level + 1, x: childX, y: childrenY });
          });
        }
      }

      positioned.sort((a, b) => a.level - b.level);
      
      const results: CommitWithPosition[] = [];
      const occupiedPositions = new Set<string>();
      for (const commit of positioned) {
          let x = commit.x;
          let y = commit.y;
          let offset = 0;
          while (occupiedPositions.has(`${x},${y}`)) {
              offset += 1;
              if (offset % 2 === 1) {
                  x = commit.x + offset * 20;
              } else {
                  x = commit.x - offset * 20;
              }
          }
          occupiedPositions.add(`${x},${y}`);
          results.push({...commit, x, y});
      }
      return results;
    },
    []
  );

  const rawCommitsData = useMemo(() => {
    if (
      !evidenceHistory ||
      !evidenceHistory.pf_case_Evidence_File ||
      !Array.isArray(evidenceHistory.pf_case_Evidence_File) ||
      evidenceHistory.pf_case_Evidence_File.length === 0
    ) {
      return [];
    }

    const files = evidenceHistory.pf_case_Evidence_File;

    const rawCommits = files.map((file) => {
      const label = `${file.version}`;
      const versionNumber = parseFloat(label);
      const fileExtension =
        file.pf_case_Evidence_Extension?.toUpperCase().replace(".", "") ||
        "ไม่ระบุ";

      let parentId;
      let branchName = `branch-${Math.floor(versionNumber)}`;
      let isRootVersion = true;
      let parentVersion;
      
      const refVersion = file.pf_case_Evidence_Metadata?.version || file.pf_case_Evidence_Metadata?.pf_case_Evidence_Ref?.version;

      if (label.endsWith('.1')) {
          const mainVersion = Math.floor(versionNumber);
          const parentFile = files.find(f => f.version === mainVersion);
          if (parentFile) {
              parentId = `${mainVersion}`;
              branchName = `branch-${mainVersion}`;
              isRootVersion = false;
              parentVersion = `${mainVersion}`;
          }
      } else if (refVersion !== undefined && refVersion !== null && refVersion !== file.version) {
        const parentFile = files.find(f => f.version === refVersion);
        if (parentFile) {
            parentId = `${parentFile.version}`;
            branchName = `branch-${Math.floor(parseFloat(parentId))}`;
            isRootVersion = false;
            parentVersion = `${parentFile.version}`;
        }
      } 
      
      if (!parentId && (file.pf_case_Evidence_Metadata?.pf_case_Evidence_Ref?.hash_sha256)) {
        const parentHash = file.pf_case_Evidence_Metadata?.pf_case_Evidence_Ref?.hash_sha256;
        const parentFile = files.find(
            (f) =>
                f.pf_case_Evidence_Hash === parentHash
        );
        if (parentFile) {
            parentId = `${parentFile.version}`;
            branchName = `branch-${Math.floor(parseFloat(parentId))}`;
            isRootVersion = false;
            parentVersion = `${parentFile.version}`;
        }
      }

      const title = isRootVersion
        ? `หลักฐานต้นฉบับ`
        : `สืบเนื่องจากต้นฉบับ V ${parentVersion}`;

      const typeDisplay = (() => {
        const ext = file.pf_case_Evidence_Extension?.toLowerCase();
        if (!ext) return `ไม่ระบุ/${fileExtension}`;
        if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext))
          return `รูปภาพ/${fileExtension}`;
        if ([".mp4", ".avi", ".mov"].includes(ext))
          return `วิดีโอ/${fileExtension}`;
        if ([".mp3", ".wav"].includes(ext)) return `เสียง/${fileExtension}`;
        return `เอกสาร/${fileExtension}`;
      })();
      
      const detailNode = renderEvidenceDetail({
        title: title,
        fileContent: renderFileContent(
          file.pf_case_Evidence_Path,
          file.pf_case_Evidence_Extension,
          file.pf_case_Evidence_Filename
        ),
        name: file.pf_case_Evidence_Filename || "ไม่ระบุ",
        date:
          new Date(file.datetime || "").toLocaleDateString("th-TH", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }) +
          "  " +
          new Date(file.datetime || "").toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }) +
          " น.",
        owner: "ไม่ระบุ",
        type: typeDisplay,
        size: file.pf_case_Evidence_File_Size || "ไม่ระบุ",
        bgColor: makeColorSofter(getRandomColor()),
        nodeId: `${file.version}`,
        nodeLabel: label,
        isRootVersion: isRootVersion,
        parentVersion: parentVersion,
        onClose: closePopup,
      });

      return {
        id: `${file.version}`,
        label: label,
        branch: branchName,
        parentId: parentId || undefined,
        hash: file.pf_case_Evidence_Hash,
        detail: detailNode,
      };
    });
    return rawCommits;
  }, [evidenceHistory, closePopup]);

  const groupedCommits = useMemo(() => {
    const groups = new Map<number, CommitNode[]>();
    rawCommitsData.forEach((commit) => {
      const mainVersion = Math.floor(parseFloat(commit.id));
      if (!groups.has(mainVersion)) {
        groups.set(mainVersion, []);
      }
      groups.get(mainVersion)?.push(commit);
    });

    return Array.from(groups.values());
  }, [rawCommitsData]);

  interface GitDisplayCardProps {
    group: CommitNode[];
    groupIndex: number;
    setActiveNode: (node: any) => void;
    setActiveSvgOffset: (offset: { x: number; y: number }) => void;
  }

  const GitDisplayCard: React.FC<GitDisplayCardProps> = ({
    group,
    groupIndex,
    setActiveNode,
    setActiveSvgOffset,
  }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const [zoomEnabled, setZoomEnabled] = useState(false);

    const toggleZoom = (e: React.MouseEvent) => {
      e.stopPropagation();
      setZoomEnabled(prev => !prev);
    };

    useEffect(() => {
      if (zoomEnabled) {
        document.body.style.overflowY = 'hidden';
      } else {
        document.body.style.overflowY = 'auto';
      }
      return () => {
        document.body.style.overflowY = 'auto';
      };
    }, [zoomEnabled]);

    const positionedCommits = useMemo(() => generateCommitsWithPosition(group), [group]);
    const branches = Array.from(new Set(positionedCommits.map((c) => c.branch)));
    const branchColors = new Map<string, string>();
    branches.forEach((b) => {
        if (!branchColors.has(b)) {
            branchColors.set(b, getRandomColor());
        }
    });

    const commits = positionedCommits.map((data) => ({
        ...data,
        popupColor: makeColorSofter(branchColors.get(data.branch) || "#999"),
    }));

    const nodeRadius = 25;
    const padding = 60;
    const commitsExist = commits && commits.length > 0;
    const allX = commitsExist ? commits.map((c) => c.x) : [];
    const allY = commitsExist ? commits.map((c) => c.y) : [];

    const minX = commitsExist ? Math.min(...allX) : 0;
    const maxX = commitsExist ? Math.max(...allX) : 0;
    const minY = commitsExist ? Math.min(...allY) : 0;
    const maxY = commitsExist ? Math.max(...allY) : 0;

    const graphWidth = maxX - minX;
    const svgWidth = Math.max(graphWidth + padding * 2, 400);
    const svgHeight = commitsExist ? maxY - minY + padding * 2 : 200;
    const horizontalOffset = -minX + (svgWidth - graphWidth) / 2;

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if (!zoomEnabled) return;
      e.preventDefault();
      if (e.buttons === 1) {
        setIsPanning(true);
        setStartPan({ x: e.clientX, y: e.clientY });
      }
    }, [zoomEnabled]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (isPanning && zoomEnabled) {
        const dx = (e.clientX - startPan.x) / scale;
        const dy = (e.clientY - startPan.y) / scale;
        setPan(prevPan => ({ x: prevPan.x + dx, y: prevPan.y + dy }));
        setStartPan({ x: e.clientX, y: e.clientY });
      }
    }, [isPanning, startPan, scale, zoomEnabled]);

    const handleMouseUp = useCallback(() => {
      setIsPanning(false);
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
      if (!zoomEnabled) return;
      e.preventDefault();
      const zoomFactor = 1.1;
      const newScale = e.deltaY > 0 ? scale / zoomFactor : scale * zoomFactor;
      const newScaleCapped = Math.max(0.1, Math.min(newScale, 5));
      
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (svgRect) {
        const mouseX = e.clientX - svgRect.left - svgRect.width / 2;
        const mouseY = e.clientY - svgRect.top - svgRect.height / 2;
        
        const newPanX = pan.x + mouseX * (1 - newScaleCapped / scale);
        const newPanY = pan.y + mouseY * (1 - newScaleCapped / scale);
        setPan({ x: newPanX, y: newPanY });
      }
      setScale(newScaleCapped);
    }, [scale, pan, zoomEnabled]);
    
    const handleNodeClick = useCallback(
      (node: CommitWithPosition, bgColor: string, event: React.MouseEvent) => {
        event.stopPropagation();
        const svgElement = event.currentTarget.closest('svg');
        if (svgElement) {
          const svgRect = svgElement.getBoundingClientRect();
          setActiveSvgOffset({ x: svgRect.left, y: svgRect.top });
        }
        setActiveNode({
          id: node.id,
          x: node.x,
          y: node.y,
          label: node.label,
          detail: node.detail ?? null,
          bgColor,
        });
      }, [setActiveNode, setActiveSvgOffset]);

    const renderConnection = (
      parent: CommitWithPosition,
      child: CommitWithPosition,
      key: string
    ) => {
      const adjustedParentX = parent.x + horizontalOffset;
      const adjustedParentY = parent.y - minY + padding;
      const adjustedChildX = child.x + horizontalOffset;
      const adjustedChildY = child.y - minY + padding;
      
      const isDirectUpdate = child.parentId === parent.id;
      
      const parentColor = branchColors.get(parent.branch) || "#666";

      if (isDirectUpdate) {
        return (
          <line
            key={key}
            x1={adjustedParentX}
            y1={adjustedParentY}
            x2={adjustedChildX}
            y2={adjustedChildY}
            stroke={parentColor}
            strokeWidth={3}
          />
        );
      } else {
        return (
          <g key={key}>
            <line
              x1={adjustedParentX}
              y1={adjustedParentY}
              x2={adjustedChildX}
              y2={adjustedChildY}
              stroke={parentColor}
              strokeWidth={2}
              strokeDasharray="5,5"
            />
            <circle
              cx={adjustedParentX}
              cy={adjustedParentY}
              r={3}
              fill={parentColor}
              opacity={0.7}
            />
          </g>
        );
      }
    };

    return (
      <div
        key={groupIndex}
        className="p-4 border border-gray-300 rounded-lg shadow-sm bg-gray-50 mb-6 flex justify-center relative"
      >
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={toggleZoom}
            className="p-2 rounded-full bg-white shadow-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {zoomEnabled ? (
              <FaHandPaper className="w-5 h-5 text-blue-500" />
            ) : (
              <FaSearchPlus className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className={`w-full h-[300px] relative ${zoomEnabled ? 'overflow-hidden' : 'overflow-auto'}`}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{
              minHeight: "200px",
              cursor: zoomEnabled ? (isPanning ? "grabbing" : "grab") : "default",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
              {commits.map((node) => {
                const parent = commits.find(
                  (p) => p.id === node.parentId
                );
                if (!parent) return null;
                return renderConnection(
                  parent,
                  node,
                  `connection-${node.id}`
                );
              })}
              {commits.map((node) => {
                const adjustedX = node.x + horizontalOffset;
                const adjustedY = node.y - minY + padding;
                const branchColor = branchColors.get(node.branch) || "#999";
                const isActive = activeNode?.id === node.id;
                const isInactive = activeNode && activeNode.id !== node.id;
                return (
                  <g
                    key={`node-${node.id}`}
                    onClick={(e) =>
                      handleNodeClick(
                        { ...node, x: adjustedX, y: adjustedY },
                        node.popupColor,
                        e
                      )
                    }
                    style={{
                      cursor: activeNode
                        ? "not-allowed"
                        : "pointer",
                    }}
                  >
                    {isActive && (
                      <circle
                        cx={adjustedX}
                        cy={adjustedY}
                        r={nodeRadius + 8}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        opacity="0.6"
                        className="animate-pulse"
                      />
                    )}
                    <circle
                      cx={adjustedX}
                      cy={adjustedY}
                      r={nodeRadius}
                      fill={branchColor}
                      stroke="white"
                      strokeWidth={isActive ? 5 : 3}
                      opacity={isInactive ? 0.3 : 1}
                      className={`transition-all duration-300 ${
                        isActive
                          ? "drop-shadow-lg"
                          : "hover:stroke-gray-300"
                      }`}
                      transform={
                        isActive ? `scale(1.2)` : "scale(1)"
                      }
                      style={{
                        transformOrigin: `${adjustedX}px ${adjustedY}px`,
                      }}
                    />
                    <text
                      x={adjustedX}
                      y={adjustedY + 5}
                      textAnchor="middle"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                      opacity={isInactive ? 0.3 : 1}
                      className="transition-opacity duration-300"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    );
  };
  

  return (
    <div className="">
      <div className={`grid grid-cols-12 gap-4`}>
        <div className="col-span-12">
          <div className="w-full border border-gray-200 bg-[#F4F4F4] rounded-lg">
            <div className="text-2xl font-bold tracking-tight text-[rgba(4,16,59,1)] p-4">
              <div className="flex items-center flex-wrap">
                <div className="px-2 flex items-center flex-wrap gap-x-2 text-sm">
                  {loading ? (
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
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center flex-wrap pb-2">
              <div className="ps-6 pe-4 text-xl font-bold tracking-tight text-[rgba(4,16,59,1)]">
                พยานหลักฐาน
              </div>
              {eviDetails && (
                <div className="ps-6 pe-6 md:ps-4 flex flex-col md:flex-row md:items-center md:gap-x-2 gap-y-1 text-sm text-gray-500 mt-2 md:mt-0">
                  <span className="flex items-center gap-2">
                    <span className="text-blue-500 hover:underline cursor-pointer">
                      สร้างวันที่
                    </span>
                    {loading ? (
                      <span className="animate-pulse">กำลังโหลด...</span>
                    ) : eviDetails?.createdTime ? (
                      <span>
                        {new Date(eviDetails.createdTime).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        •{" "}
                        {new Date(eviDetails.createdTime).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        น.
                      </span>
                    ) : (
                      <span>ไม่พบข้อมูล</span>
                    )}
                  </span>
                  <span className="text-gray-300 hidden md:block">|</span>
                  <span className="flex items-center gap-2">
                    <span className="text-blue-500 hover:underline cursor-pointer">
                      อัปเดตล่าสุด
                    </span>
                    {loading ? (
                      <span className="animate-pulse">กำลังโหลด...</span>
                    ) : eviDetails?.updateTime ? (
                      <span>
                        {new Date(eviDetails.updateTime).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        •{" "}
                        {new Date(eviDetails.updateTime).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        น.
                      </span>
                    ) : (
                      <span>ไม่พบข้อมูล</span>
                    )}
                  </span>
                </div>
              )}
            </div>
            
            <div className="border border-gray-200 bg-white rounded-sm ms-4 mb-4 me-4 px-4 py-2">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-6 gap-y-2 text-sm">
                  <div className="flex w-full justify-between items-center sm:w-auto">
                      <span className="flex items-center gap-2">
                          <strong>ประเภทพยานหลักฐาน:</strong>
                          {loading ? (
                              <span className="animate-pulse">กำลังโหลด...</span>
                          ) : eviDetails.category ? (
                              <div className="flex items-center gap-2">
                                  {getEvidenceTypeIcon(eviDetails.category)}
                                  <span>
                                      {EVIDENCE_CATEGORY_MAP[eviDetails.category] ||
                                          eviDetails.category ||
                                          "-"}
                                  </span>
                              </div>
                          ) : (
                              "-"
                          )}
                      </span>
                      <button
                          type="button"
                          onClick={() =>
                              navigate(
                                  `/manage-case/update-case/${caseDetails.caseId}/update-evidence/${eviDetails.id}`
                              )
                          }
                          className="text-blue-600 cursor-pointer sm:hidden"
                          title="ดูรายละเอียด"
                      >
                          <MdManageSearch className="w-5 h-5" />
                      </button>
                  </div>

                  <span className="flex items-center gap-2">
                      <strong>ชื่อที่แสดง:</strong>
                      {loading ? (
                          <span className="animate-pulse">กำลังโหลด...</span>
                      ) : (
                          <span
                              className="truncate max-w-[200px]"
                              title={eviDetails.lable}
                          >
                              {eviDetails.lable || "-"}
                          </span>
                      )}
                  </span>
                  <span className="flex items-center gap-2">
                      <strong>คำอธิบาย:</strong>
                      {loading ? (
                          <span className="animate-pulse">กำลังโหลด...</span>
                      ) : (
                          <span
                              className="truncate max-w-[300px] whitespace-nowrap"
                              title={eviDetails.description}
                          >
                              {eviDetails.description || "-"}
                          </span>
                      )}
                  </span>

                  <button
                      type="button"
                      onClick={() =>
                          navigate(
                              `/manage-case/update-case/${caseDetails.caseId}/update-evidence/${eviDetails.id}`
                          )
                      }
                      className="hidden sm:ml-auto sm:flex text-blue-600 cursor-pointer"
                      title="ดูรายละเอียด"
                  >
                      <MdManageSearch className="w-5 h-5" />
                  </button>
              </div>
          </div>
            <div className="ps-6 font-bold text-xl mb-2">
              การเชื่อมโยงการเปลี่ยนแปลงของพยานหลักฐาน
              <span className="text-sm font-normal text-gray-600 ml-2">
                (มี {rawCommitsData.length} รายการ )
              </span>
            </div>

            <div className="border border-gray-200 bg-white rounded-lg m-4 p-4 overflow-hidden relative">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-500">
                    กำลังโหลดการเชื่อมโยง...
                  </span>
                </div>
              ) : groupedCommits.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-500">
                    ไม่พบการเชื่อมโยงการเปลี่ยนแปลง
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {groupedCommits.map((group, groupIndex) => (
                    <GitDisplayCard
                      key={groupIndex}
                      group={group}
                      groupIndex={groupIndex}
                      setActiveNode={setActiveNode}
                      setActiveSvgOffset={setActiveSvgOffset}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {activeNode &&
        portalContainer && (
            createPortal(
                <div
                  ref={popupRef}
                  className="fixed inset-0 pointer-events-none z-[9999]"
                  style={{ pointerEvents: "none" }}
                >
                    <div
                        className="absolute animate-slideIn pointer-events-auto"
                        style={{
                            left: popupPosition.x,
                            top: popupPosition.y,
                            zIndex: 9999,
                        }}
                    >
                      {activeNode.detail}
                    </div>
                    <svg
                        className="absolute inset-0 pointer-events-none"
                        style={{ zIndex: 9998 }}
                    >
                        <line
                            x1={activeNode.x + activeSvgOffset.x}
                            y1={activeNode.y + activeSvgOffset.y}
                            x2={
                                popupPosition.x + (popupPosition.x > activeNode.x ? 0 : 320)
                            }
                            y2={popupPosition.y + 200}
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            className="animate-dash"
                        />
                    </svg>
                </div>,
                portalContainer
            )
        )}
    </div>
  );
}