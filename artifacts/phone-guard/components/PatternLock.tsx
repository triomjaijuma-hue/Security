import React, { useRef, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface PatternLockProps {
  onComplete: (pattern: number[]) => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
  correctPattern?: number[];
}

const GRID = 3;
const CONTAINER_SIZE = 280;
const PADDING = 44;
const AVAILABLE = CONTAINER_SIZE - PADDING * 2;
const STEP = AVAILABLE / (GRID - 1);
const DOT_RADIUS = 10;
const HIT_RADIUS = 38;

const DOT_POSITIONS = Array.from({ length: GRID * GRID }, (_, i) => ({
  x: PADDING + (i % GRID) * STEP,
  y: PADDING + Math.floor(i / GRID) * STEP,
}));

export default function PatternLock({
  onComplete,
  onError,
  disabled = false,
}: PatternLockProps) {
  const colors = useColors();
  const selectedRef = useRef<number[]>([]);
  const [selectedDots, setSelectedDots] = useState<number[]>([]);
  const [currentTouch, setCurrentTouch] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [flash, setFlash] = useState(false);

  const findNearestDot = (x: number, y: number): number | null => {
    for (let i = 0; i < DOT_POSITIONS.length; i++) {
      const dx = DOT_POSITIONS[i].x - x;
      const dy = DOT_POSITIONS[i].y - y;
      if (Math.sqrt(dx * dx + dy * dy) < HIT_RADIUS) {
        return i;
      }
    }
    return null;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        selectedRef.current = [];
        const dot = findNearestDot(locationX, locationY);
        if (dot !== null) {
          selectedRef.current = [dot];
          setSelectedDots([dot]);
        }
        setCurrentTouch({ x: locationX, y: locationY });
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentTouch({ x: locationX, y: locationY });
        const dot = findNearestDot(locationX, locationY);
        if (dot !== null && !selectedRef.current.includes(dot)) {
          selectedRef.current = [...selectedRef.current, dot];
          setSelectedDots([...selectedRef.current]);
        }
      },
      onPanResponderRelease: () => {
        const pattern = [...selectedRef.current];
        setCurrentTouch(null);
        setFlash(true);
        setTimeout(() => {
          setFlash(false);
          setSelectedDots([]);
          selectedRef.current = [];
          if (pattern.length >= 4) {
            onComplete(pattern);
          } else {
            onError?.("Connect at least 4 dots");
          }
        }, 300);
      },
    })
  ).current;

  const isSelected = (i: number) => selectedDots.includes(i);
  const lastDot =
    selectedDots.length > 0
      ? DOT_POSITIONS[selectedDots[selectedDots.length - 1]]
      : null;

  return (
    <View
      style={[styles.container, { width: CONTAINER_SIZE, height: CONTAINER_SIZE }]}
      {...panResponder.panHandlers}
    >
      <Svg
        width={CONTAINER_SIZE}
        height={CONTAINER_SIZE}
        style={StyleSheet.absoluteFill}
      >
        {/* Lines between selected dots */}
        {selectedDots.slice(0, -1).map((dotIdx, i) => {
          const from = DOT_POSITIONS[dotIdx];
          const to = DOT_POSITIONS[selectedDots[i + 1]];
          return (
            <Line
              key={`line-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={flash ? colors.success : colors.primary}
              strokeWidth={2.5}
              strokeOpacity={0.8}
            />
          );
        })}
        {/* Line to current touch */}
        {lastDot && currentTouch && (
          <Line
            x1={lastDot.x}
            y1={lastDot.y}
            x2={currentTouch.x}
            y2={currentTouch.y}
            stroke={colors.primary}
            strokeWidth={2.5}
            strokeOpacity={0.5}
            strokeDasharray="4,4"
          />
        )}
        {/* Dots */}
        {DOT_POSITIONS.map((pos, i) => (
          <React.Fragment key={`dot-${i}`}>
            {isSelected(i) && (
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={22}
                fill={flash ? colors.success : colors.primary}
                fillOpacity={0.15}
              />
            )}
            <Circle
              cx={pos.x}
              cy={pos.y}
              r={DOT_RADIUS}
              fill={
                isSelected(i)
                  ? flash
                    ? colors.success
                    : colors.primary
                  : "transparent"
              }
              stroke={
                isSelected(i)
                  ? flash
                    ? colors.success
                    : colors.primary
                  : colors.mutedForeground
              }
              strokeWidth={2}
            />
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
});
