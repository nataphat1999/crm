import {
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { CommitNode } from "../../types/evidence";
interface EvidenceDetailProps {
  title: string;
  imageSrc?: string;
  name: string;
  date: string;
  owner: string;
  type: string;
  size: string;
  bgColor?: string;
  nodeId: string;
  nodeLabel: string;
}

type CommitWithPosition = CommitNode & {
  x: number;
  y: number;
  level: number;
};

const getRandomColor = (() => {
  const usedHues = new Set<number>();

  return () => {
    if (usedHues.size >= 360) {
      usedHues.clear(); // reset ถ้าหมดทุกสีแล้ว
    }

    let hue: number;
    do {
      hue = Math.floor(Math.random() * 360);
    } while (usedHues.has(hue));

    usedHues.add(hue);
    return `hsl(${hue}, 70%, 55%)`;
  };
})();
const makeColorSofter = (hslColor: string): string => {
  if (!hslColor) return "#f8f9fa"; // ค่าเริ่มต้นถ้าไม่มีสี

  try {
    // ถ้าเป็นสี hex
    if (hslColor.startsWith("#")) {
      // แปลง hex เป็น RGB แล้วทำให้อ่อนลง
      const r = Number.parseInt(hslColor.slice(1, 3), 16);
      const g = Number.parseInt(hslColor.slice(3, 5), 16);
      const b = Number.parseInt(hslColor.slice(5, 7), 16);

      // ผสมกับสีขาวเพื่อให้อ่อนลง
      const lightR = Math.floor(r * 0.3 + 255 * 0.7);
      const lightG = Math.floor(g * 0.3 + 255 * 0.7);
      const lightB = Math.floor(b * 0.3 + 255 * 0.7);

      return `rgb(${lightR}, ${lightG}, ${lightB})`;
    }

    // ถ้าเป็นสี hsl
    const parts = hslColor.match(/\d+/g);
    if (!parts || parts.length < 3) {
      return "#f8f9fa";
    }

    const hue = Number.parseInt(parts[0], 10);
    return `hsl(${hue}, 30%, 95%)`; // เพิ่ม lightness เป็น 95%
  } catch (error) {
    console.error("Error in makeColorSofter:", error);
    return "#f8f9fa";
  }
};
export default function GitTree() {
  const svgRef = useRef<SVGSVGElement>(null);

  const generateCommitsWithPosition = useCallback(
    (rawCommits: CommitNode[]): CommitWithPosition[] => {
      const nodeGap = 100;
      const branchGap = 50;
      const startX = 100;
      const startY = 600;
      const branchOrder: string[] = [];
      const idMap = new Map<string, CommitNode>();
      rawCommits.forEach((commit) => {
        idMap.set(commit.id, commit);
        branchOrder.push(commit.branch);
      });

      const calculateLevel = (
        commitId: string,
        visited = new Set<string>()
      ): number => {
        if (visited.has(commitId)) return 0;
        visited.add(commitId);

        const commit = idMap.get(commitId);
        if (!commit || !commit.parentId) return 0;

        return calculateLevel(commit.parentId, visited) + 1;
      };

      const branchXMap = new Map<string, number>();
      branchOrder.forEach((branch, index) => {
        branchXMap.set(branch, startX + index * branchGap);
      });

      const allBranches = Array.from(new Set(rawCommits.map((c) => c.branch)));
      let extraBranchIndex = branchOrder.length;
      allBranches.forEach((branch) => {
        if (!branchXMap.has(branch)) {
          branchXMap.set(branch, startX + extraBranchIndex * branchGap);
          extraBranchIndex++;
        }
      });

      const commitsWithLevel = rawCommits.map((commit) => ({
        ...commit,
        level: calculateLevel(commit.id),
      }));

      commitsWithLevel.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;

        const aBranchIndex = branchOrder.indexOf(a.branch);
        const bBranchIndex = branchOrder.indexOf(b.branch);

        if (aBranchIndex !== -1 && bBranchIndex !== -1) {
          return aBranchIndex - bBranchIndex;
        }

        return a.branch.localeCompare(b.branch);
      });

      const results: CommitWithPosition[] = [];
      const occupiedPositions = new Set<string>();

      for (const commit of commitsWithLevel) {
        const baseX = branchXMap.get(commit.branch)!;
        const baseY = startY - commit.level * nodeGap;

        let x = baseX;
        let y = baseY;
        let offset = 0;

        while (occupiedPositions.has(`${x},${y}`)) {
          offset += 1;
          if (offset % 2 === 1) {
            x = baseX + Math.ceil(offset / 2) * 60;
          } else {
            x = baseX - Math.ceil(offset / 2) * 60;
          }

          if (Math.abs(x - baseX) > branchGap / 2) {
            x = baseX;
            y = baseY + (offset > 10 ? (offset - 10) * 50 : 0);
          }
        }

        occupiedPositions.add(`${x},${y}`);

        const positioned: CommitWithPosition = {
          ...commit,
          x,
          y,
          level: commit.level,
        };

        results.push(positioned);
      }

      return results;
    },
    []
  );

  const closePopup = useCallback(() => {
    setActiveNode(null);
  }, []);

  const commitsData = useMemo(() => {
    return generateCommitsWithPosition(rawCommits);
  }, [generateCommitsWithPosition]);
  const renderEvidenceDetail = useCallback(
    ({
      title,
      name,
      date,
      owner,
      type,
      size,
      bgColor = "#ffffff",
      nodeId,
    }: EvidenceDetailProps): ReactNode => {
      return (
        <div className="relative" style={{ zIndex: 10 }}>
          <div
            className="relative rounded-lg p-4 w-80 max-w-[90vw] max-h-[80vh] overflow-y-auto shadow-2xl"
            style={{ backgroundColor: bgColor, zIndex: 10 }}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{title}</h3>
              </div>
              <button
                onClick={closePopup}
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

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">ชื่อไฟล์:</span>
                <span className="text-gray-800">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">วันที่นำเข้า:</span>
                <span className="text-gray-800">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">ผู้นำเข้า:</span>
                <span className="text-gray-800">{owner}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">ประเภท:</span>
                <span className="text-gray-800">{type}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">ขนาด:</span>
                <span className="text-gray-800">{size}</span>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [closePopup]
  );
  const branches = useMemo(
    () => Array.from(new Set(commitsData.map((c) => c.branch))),
    [commitsData]
  );

  const branchColors = useMemo(() => {
    const map = new Map<string, string>();
    branches.forEach((b) => {
      if (!map.has(b)) {
        map.set(b, getRandomColor());
      }
    });
    return map;
  }, [branches]);

  const commits = useMemo(() => {
    return commitsData.map((data) => {
      // สร้างสีอ่อนสำหรับ popup
      const branchColor = branchColors.get(data.branch) || "#999";
      const softColor = makeColorSofter(branchColor);

      return {
        ...data,
        detail: renderEvidenceDetail({
          title:
            data.label === "1"
              ? "หลักฐานต้นฉบับ"
              : `สืบเนื่องจากต้นฉบับ ลำดับ ${data.label}`,
          imageSrc: data.label === "1" || data.label === "2" ? dImg : "",
          name: "ไฟแช็กสีส้ม",
          date: "20 เมษายน 2568 เวลา 08:30 น.",
          owner: "มาริษา เกียรตดังงาม",
          type: "รูปภาพ/JPEG",
          size: "500 KB",
          bgColor: softColor,
          nodeId: data.id,
          nodeLabel: data.label,
        }),
        popupColor: softColor,
      };
    });
  }, [branchColors, commitsData, renderEvidenceDetail]);

  const nodeRadius = 25;
  const padding = 120;

  const allX = commits.map((c) => c.x);
  const allY = commits.map((c) => c.y);

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const svgWidth = maxX - minX + padding * 2 + nodeRadius * 2;
  const svgHeight = maxY - minY + padding * 2 + nodeRadius * 2;

  const renderConnection = (
    parent: CommitWithPosition,
    child: CommitWithPosition,
    key: string
  ) => {
    const adjustedParentX = parent.x - minX + padding + nodeRadius;
    const adjustedParentY = parent.y - minY + padding + nodeRadius;
    const adjustedChildX = child.x - minX + padding + nodeRadius;
    const adjustedChildY = child.y - minY + padding + nodeRadius;

    const isSameBranch = parent.branch === child.branch;
    const parentColor = branchColors.get(parent.branch) || "#666";

    if (isSameBranch) {
      // เส้นเชื่อมใน branch เดียวกัน (เส้นทึบ)
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
      // เส้นเชื่อมระหว่าง branch (เส้นประ)
      return (
        <g key={key}>
          <line
            x1={adjustedParentX}
            y1={adjustedParentY}
            x2={adjustedChildX}
            y2={adjustedChildY}
            stroke={parentColor}
            strokeWidth={2}
            strokeDasharray="5,5" // เส้นประ
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
    if (!activeNode || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const nodeX = activeNode.x;
    const nodeY = activeNode.y;

    const nodeScreenX = svgRect.left + nodeX;
    const nodeScreenY = svgRect.top + nodeY;

    const popupWidth = Math.min(320, window.innerWidth * 0.9);
    const popupHeight = Math.min(400, window.innerHeight * 0.8);

    let popupX = nodeScreenX + 60;
    let popupY = nodeScreenY - popupHeight / 2;

    const windowWidth = window.innerWidth;
    if (popupX + popupWidth > windowWidth - 20) {
      popupX = nodeScreenX - popupWidth - 60;
    }

    if (popupX < 20) {
      popupX = 20;
    }

    const windowHeight = window.innerHeight;
    if (popupY < 20) {
      popupY = 20;
    } else if (popupY + popupHeight > windowHeight - 20) {
      popupY = windowHeight - popupHeight - 20;
    }

    setPopupPosition({ x: popupX, y: popupY });
  }, [activeNode]);
  const handleNodeClick = (
    node: CommitWithPosition,
    bgColor: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    if (activeNode) {
      return;
    }

    setActiveNode({
      id: node.id,
      x: node.x,
      y: node.y,
      label: node.label,
      detail: node.detail ?? null,
      bgColor,
    });
  };

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

  return (
    <div>
      <div className="h-[50%] border border-gray-200 bg-white rounded-lg m-4 overflow-auto relative">
        <svg ref={svgRef} width={svgWidth} height={svgHeight}>
          {/* Parent-child connections - วาดก่อน nodes เพื่อไม่ให้ทับ */}
          {commits.map((node) => {
            const parent = commits.find((p) => p.id === node.parentId);
            if (!parent) return null;

            return renderConnection(parent, node, `connection-${node.id}`);
          })}

          {/* Nodes - วาดทับเส้นเชื่อม */}
          {commits.map((node) => {
            const adjustedX = node.x - minX + padding + nodeRadius;
            const adjustedY = node.y - minY + padding + nodeRadius;
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
                style={{ cursor: activeNode ? "not-allowed" : "pointer" }}
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
                    isActive ? "drop-shadow-lg" : "hover:stroke-gray-300"
                  }`}
                  transform={isActive ? `scale(1.2)` : "scale(1)"}
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
        </svg>
      </div>
      {/* Popup Portal */}
      {activeNode &&
        portalContainer &&
        createPortal(
          <div
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

            {/* เส้นเชื่อมระหว่าง node และ popup */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 9998 }}
            >
              <line
                x1={activeNode.x}
                y1={activeNode.y}
                x2={
                  popupPosition.x +
                  (popupPosition.x > activeNode.x
                    ? 0
                    : Math.min(320, window.innerWidth * 0.9))
                }
                y2={popupPosition.y + Math.min(200, window.innerHeight * 0.4)} // กึ่งกลางของ popup
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="animate-dash"
              />
            </svg>
          </div>,
          portalContainer
        )}
    </div>
  );
}
