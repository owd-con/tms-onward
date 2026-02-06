/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Stage, Layer, Rect, Group, Text, Label, Tag } from "react-konva";
import { useRef, useState, useEffect } from "react";
import type { LocationLayout } from "@/services/types";
import { Button } from "@/components";
import {
  HiMagnifyingGlassMinus,
  HiMagnifyingGlassPlus,
  HiMiniChevronUpDown,
} from "react-icons/hi2";

const GRID_SIZE = 20;
const M_TO_PX = 20;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

const DEFAULT_ZOOM = 0.5; // 50%
const ZOOM_STEP = 0.1;    // 10%

export default function WarehouseCanvas({
  parentRef,
  areas,
}: {
  parentRef: any;
  areas: LocationLayout[];
}) {
  const stageRef = useRef<any>(null);
  const didInitialFit = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 400 });
  const [zoom, setZoom] = useState(1);

  // ============================
  // GRID BACKGROUND
  // ============================
  const renderGrid = () => {
    const lines = [];
    const size = 5000;

    for (let i = 0; i < size / GRID_SIZE; i++) {
      const pos = i * GRID_SIZE;
      lines.push(
        <Rect
          key={`v${i}`}
          x={pos}
          y={0}
          width={1}
          height={size}
          fill="#e8e8e8"
        />,
        <Rect
          key={`h${i}`}
          x={0}
          y={pos}
          width={size}
          height={1}
          fill="#e8e8e8"
        />
      );
    }
    return lines;
  };

  // ============================
  // BOUNDING BOX
  // ============================
  const getBoundingBox = (items: LocationLayout[]) => {
    if (!items.length) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    items.forEach((item) => {
      const x = item.coordinate_x ?? 0;
      const y = item.coordinate_y ?? 0;

      const rawW = (item.width ?? 0) * M_TO_PX;
      const rawH = (item.height ?? 0) * M_TO_PX;

      const rotated = item.orientation !== "horizontal";

      // 👉 swap width & height kalau rotate 90°
      const w = rotated ? rawH : rawW;
      const h = rotated ? rawW : rawH;

      // 👉 offset correction (rotate di titik 0,0 bikin melebar ke kiri)
      const offsetX = rotated ? -h : 0;
      const offsetY = 0;

      const finalX = x + offsetX;
      const finalY = y + offsetY;

      minX = Math.min(minX, finalX);
      minY = Math.min(minY, finalY);
      maxX = Math.max(maxX, finalX + w);
      maxY = Math.max(maxY, finalY + h);
    });

    const width = maxX - minX;
    const height = maxY - minY;

    if (width <= 0 || height <= 0) return null;

    return { x: minX, y: minY, width, height };
  };

  // ============================
  // FIT TO SCREEN
  // ============================
  const fitToScreen = () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (!areas.length) return;

    const box = getBoundingBox(areas);
    if (!box) return;

    const scale = DEFAULT_ZOOM;

    // reset dulu
    stage.scale({ x: scale, y: scale });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    const x = Math.round(size.width / 2 - centerX * scale);
    const y = Math.round(size.height / 2 - centerY * scale);

    stage.position({ x, y });
    stage.batchDraw();

    setZoom(scale);
  };

  // ============================
  // AREA COMPONENT
  // ============================
  const AreaGroup = ({ item }: { item: LocationLayout }) => {
    const wPx = item.width * M_TO_PX;
    const hPx = item.height * M_TO_PX;

    return (
      <Group
        x={item.coordinate_x}
        y={item.coordinate_y}
        rotation={item.orientation === "horizontal" ? 0 : 90}
      >
        <Rect
          width={wPx}
          height={hPx}
          fill="#DBDBDB"
          cornerRadius={6}
        />

        <Label x={0} y={-35}>
          <Tag fill={item?.fill} opacity={0.5} cornerRadius={4} />
          <Text
            align="center"
            verticalAlign="middle"
            text={
              item?.qty_available == 0 && item?.qty_allocated == 0
                ? item.name
                : `${item?.qty_allocated}  / ${item?.qty_available}`
            }
            fontSize={Math.max(14, Math.min(24, wPx / 8))}
            fill="#fff"
            padding={4}
            listening={false}
          />
        </Label>
      </Group>
    )
  };

  // ============================
  // LOCATION
  // ============================
  const LocationGroup = ({ item }: { item: LocationLayout }) => {
    const wPx = item.width;
    const hPx = item.height;

    return (
      <Group
        x={item.coordinate_x ?? 0}
        y={item.coordinate_y ?? 0}
        rotation={item.orientation === "horizontal" ? 0 : 90}
        offsetX={item.orientation === "horizontal" ? 0 : wPx}
      >
        <Rect
          width={wPx}
          height={hPx}
          fill={item.fill}
          stroke="#ffffff"
          strokeWidth={2}
          cornerRadius={6}
        />

        <Text
          width={wPx}
          height={hPx}
          align="center"
          verticalAlign="middle"
          fontSize={Math.max(12, Math.min(25, wPx / 6))}
          text={
            item?.qty_available == 0 && item?.qty_allocated == 0
              ? item.name
              : `${item?.qty_allocated}  / ${item?.qty_available}`
          }
          fill="#f0f0f0"
          listening={false}
        />
      </Group>
    );
  };

  // ============================
  // ZOOM HANDLER
  // ============================
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const scale = stage.scaleX();
    const dir = e.evt.deltaY > 0 ? -1 : 1;
    applyZoom(scale + dir * ZOOM_STEP);
  };

  const applyZoom = (newScale: number, center?: { x: number; y: number }) => {
    const stage = stageRef.current;
    if (!stage) return;

    newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

    const pointer =
      center ??
      stage.getPointerPosition() ?? {
        x: size.width / 2,
        y: size.height / 2,
      };

    const oldScale = stage.scaleX();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });

    stage.batchDraw();
    setZoom(newScale);
  };

  const zoomIn = () => applyZoom(zoom + ZOOM_STEP);
  const zoomOut = () => applyZoom(zoom - ZOOM_STEP);

  // ============================
  // CANVAS SIZE OBSERVER
  // ============================
  useEffect(() => {
    if (!parentRef?.current) return;

    const el = parentRef.current;

    const updateSize = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);

    return () => observer.disconnect();
  }, [parentRef]);

  // ============================
  // AUTO FIT - Hanya saat pertama load
  // ============================
  useEffect(() => {
    if (didInitialFit.current) return;
    if (!size.width || !size.height) return;
    if (!areas.length) return;

    didInitialFit.current = true;
    requestAnimationFrame(() => fitToScreen());
  }, [size.width, size.height, areas.length]);

  // ============================
  // RENDER
  // ============================
  return (
    <div className="w-full h-full bg-base-200 rounded-xl overflow-hidden relative">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        draggable
        onWheel={handleWheel}
      >
        <Layer>{renderGrid()}</Layer>

        <Layer>
          {areas.map((area, i) => (
            <Group key={i}>
              <AreaGroup item={area} />
              {area.locations?.map((loc, key) => (
                <LocationGroup key={key} item={loc} />
              ))}
            </Group>
          ))}
        </Layer>
      </Stage>

      <div className="absolute top-3 left-3 bg-base-100 p-2 rounded-xl shadow">
        <div className="flex gap-2 items-center">
          <Button size="sm" onClick={zoomIn}>
            <HiMagnifyingGlassPlus />
          </Button>
          <Button size="sm" onClick={zoomOut}>
            <HiMagnifyingGlassMinus />
          </Button>
          <Button size="sm" onClick={fitToScreen}>
            <HiMiniChevronUpDown className="rotate-45" />
          </Button>
          <div className="text-sm">{(zoom * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
}
