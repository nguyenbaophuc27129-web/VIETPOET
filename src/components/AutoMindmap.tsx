/**
 * Auto-Mindmap Component
 * SVG-based interactive mindmap from poetry analysis
 * More reliable than ReactFlow
 */
'use client';

import React, { useState } from 'react';

interface OutlinePoint {
  point: string;
  details: string[];
  conclusion: string;
}

interface AutoMindmapProps {
  outline: OutlinePoint[];
  title: string;
}

interface NodePosition {
  x: number;
  y: number;
}

export default function AutoMindmap({ outline, title }: AutoMindmapProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Calculate positions for nodes
  const calculatePositions = () => {
    const positions: Record<string, NodePosition> = {};
    const centerX = 400;
    const startY = 80;
    const verticalSpacing = 120;

    // Root node position
    positions.root = { x: centerX, y: 40 };

    // Main point nodes
    outline.forEach((point, index) => {
      const pointId = `point-${index}`;
      positions[pointId] = { x: centerX, y: startY + (index * verticalSpacing) };

      // Detail nodes (left and right)
      point.details.forEach((_, detailIndex) => {
        const detailId = `detail-${index}-${detailIndex}`;
        const xOffset = detailIndex % 2 === 0 ? -200 : 200;
        positions[detailId] = {
          x: centerX + xOffset,
          y: startY + (index * verticalSpacing) + 60
        };
      });

      // Conclusion node
      if (point.conclusion) {
        const conclusionId = `conclusion-${index}`;
        positions[conclusionId] = { x: centerX + 280, y: startY + (index * verticalSpacing) };
      }
    });

    return positions;
  };

  const positions = calculatePositions();

  const getNodeColor = (nodeId: string): string => {
    if (nodeId === 'root') return '#667eea';
    if (nodeId.startsWith('point-')) return '#f093fb';
    if (nodeId.startsWith('detail-')) return '#4facfe';
    if (nodeId.startsWith('conclusion-')) return '#fa709a';
    return '#667eea';
  };

  const drawConnection = (from: NodePosition, to: NodePosition, color: string = '#cbd5e0') => {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    return (
      <path
        d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray={color === '#f093fb' ? '5,5' : '0'}
      />
    );
  };

  return (
    <div className="mindmap-container w-full bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg overflow-hidden">
      <svg
        width="100%"
        height={600}
        viewBox="0 0 800 600"
        className="w-full h-auto"
      >
        {/* Background pattern */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" fill="#e0e7ff" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Connections */}
        <g>
          {/* Root to main points */}
          {outline.map((_, index) => {
            const pointId = `point-${index}`;
            return (
              <g key={`connection-root-${index}`}>
                {drawConnection(positions.root, positions[pointId], '#667eea')}
              </g>
            );
          })}

          {/* Points to details */}
          {outline.map((point, index) => {
            const pointId = `point-${index}`;
            return point.details.map((_, detailIndex) => {
              const detailId = `detail-${index}-${detailIndex}`;
              return (
                <g key={`connection-${index}-${detailIndex}`}>
                  {drawConnection(positions[pointId], positions[detailId])}
                </g>
              );
            });
          })}

          {/* Points to conclusions */}
          {outline.map((point, index) => {
            if (point.conclusion) {
              const pointId = `point-${index}`;
              const conclusionId = `conclusion-${index}`;
              return (
                <g key={`connection-conclusion-${index}`}>
                  {drawConnection(positions[pointId], positions[conclusionId], '#fa709a')}
                </g>
              );
            }
            return null;
          })}
        </g>

        {/* Root Node */}
        <g
          transform={`translate(${positions.root.x - 100}, ${positions.root.y - 20})`}
          onMouseEnter={() => setHoveredNode('root')}
          onMouseLeave={() => setHoveredNode(null)}
          className="cursor-pointer"
        >
          <rect
            width={200}
            height={40}
            rx={10}
            fill="url(#rootGradient)"
            className="filter drop-shadow-lg"
          />
          <text
            x={100}
            y={25}
            textAnchor="middle"
            fill="white"
            fontSize={16}
            fontWeight="bold"
          >
            {title.substring(0, 30)}...
          </text>
        </g>

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="rootGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
          <linearGradient id="pointGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f093fb" />
            <stop offset="100%" stopColor="#f5576c" />
          </linearGradient>
          <linearGradient id="detailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4facfe" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>
          <linearGradient id="conclusionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fa709a" />
            <stop offset="100%" stopColor="#fee140" />
          </linearGradient>
        </defs>

        {/* Main Point Nodes */}
        {outline.map((point, index) => {
          const pointId = `point-${index}`;
          const pos = positions[pointId];
          return (
            <g
              key={pointId}
              transform={`translate(${pos.x - 90}, ${pos.y - 15})`}
              onMouseEnter={() => setHoveredNode(pointId)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer transition-transform hover:scale-105"
            >
              <rect
                width={180}
                height={30}
                rx={8}
                fill="url(#pointGradient)"
                className="filter drop-shadow-md"
              />
              <text
                x={90}
                y={20}
                textAnchor="middle"
                fill="white"
                fontSize={14}
                fontWeight="600"
              >
                {point.point.substring(0, 25)}
              </text>

              {/* Hover tooltip */}
              {hoveredNode === pointId && (
                <g transform={`translate(190, -40)`}>
                  <rect
                    width={200}
                    height={80}
                    rx={8}
                    fill="white"
                    stroke="#f093fb"
                    strokeWidth={2}
                    className="filter drop-shadow-xl"
                  />
                  <text x={100} y={20} textAnchor="middle" fill="#f093fb" fontSize={14} fontWeight="bold">
                    {point.point}
                  </text>
                  <text x={100} y={45} textAnchor="middle" fill="#666" fontSize={12}>
                    {point.details[0]?.substring(0, 50)}...
                  </text>
                  <text x={100} y={65} textAnchor="middle" fill="#666" fontSize={11}>
                    {point.conclusion?.substring(0, 40)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Detail Nodes */}
        {outline.map((point, index) => {
          return point.details.map((detail, detailIndex) => {
            const detailId = `detail-${index}-${detailIndex}`;
            const pos = positions[detailId];
            return (
              <g
                key={detailId}
                transform={`translate(${pos.x - 70}, ${pos.y - 12})`}
                onMouseEnter={() => setHoveredNode(detailId)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                <rect
                  width={140}
                  height={24}
                  rx={6}
                  fill="url(#detailGradient)"
                  className="filter drop-shadow-sm"
                />
                <text
                  x={70}
                  y={16}
                  textAnchor="middle"
                  fill="white"
                  fontSize={12}
                >
                  {detail.substring(0, 20)}
                </text>
              </g>
            );
          });
        })}

        {/* Conclusion Nodes */}
        {outline.map((point, index) => {
          if (point.conclusion) {
            const conclusionId = `conclusion-${index}`;
            const pos = positions[conclusionId];
            return (
              <g
                key={conclusionId}
                transform={`translate(${pos.x - 80}, ${pos.y - 12})`}
                onMouseEnter={() => setHoveredNode(conclusionId)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                <rect
                  width={160}
                  height={24}
                  rx={6}
                  fill="url(#conclusionGradient)"
                  className="filter drop-shadow-sm"
                />
                <text
                  x={80}
                  y={16}
                  textAnchor="middle"
                  fill="white"
                  fontSize={11}
                  fontWeight="600"
                >
                  {point.conclusion.substring(0, 25)}
                </text>
              </g>
            );
          }
          return null;
        })}
      </svg>

      {/* Legend */}
      <div className="p-4 bg-white bg-opacity-90 border-t border-purple-200">
        <h4 className="font-semibold text-purple-900 mb-2">Chú thích:</h4>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-600 to-pink-600"></div>
            <span>Chủ đề chính</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-400 to-cyan-400"></div>
            <span>Chi tiết</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-pink-500 to-yellow-400"></div>
            <span>Kết luận</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          👆 Di chuột vào các node để xem chi tiết
        </p>
      </div>
    </div>
  );
}