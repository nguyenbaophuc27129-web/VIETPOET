/**
 * Geospatial Poetry Map Component
 * Interactive map showing poetry locations across Vietnam
 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

// Vietnam simplified geo (in production, load from proper geojson)
const vietnamGeo = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'Vietnam' }, geometry: { type: 'Polygon', coordinates: [[[102, 9], [107, 9], [107, 23], [102, 23], [102, 9]]] } }
  ]
};

interface PoetryLocation {
  name: string;
  province: string;
  coordinates: [number, number];
  poems: string[];
  author: string;
  description: string;
}

const poetryLocations: PoetryLocation[] = [
  {
    name: 'Sông Mã',
    province: 'Sơn La',
    coordinates: [103.85, 21.33],
    poems: ['Sáng月在Sông Mã', 'Chiều Sông Mã'],
    author: 'Various poets',
    description: 'Sông Mã là nguồn cảm hứng bất tận của thơ ca Việt Nam, gắn liền với chiến tranh và hòa bình.'
  },
  {
    name: 'Sông Hương',
    province: 'Thừa Thiên Huế',
    coordinates: [107.58, 16.47],
    poems: ['Hương thơm Ai Ai'],
    author: 'Hàn Mặc Tử',
    description: 'Sông Hượng symbolizes the romantic beauty of Hue, appearing in many romantic poems.'
  },
  {
    name: 'Hồ Gươm',
    province: 'Hà Nội',
    coordinates: [105.85, 21.03],
    poems: ['Bên Hồ Gươm'],
    author: 'Various',
    description: 'Hồ Gươm (Hồ Sword) is the heart of Hanoi, featured in poetry about the capital.'
  },
  {
    name: 'Biển Đông',
    province: 'Đà Nẵng',
    coordinates: [108.22, 16.06],
    poems: ['Biển và quê hương'],
    author: 'Various',
    description: 'The East Sea represents the vastness of the homeland in Vietnamese poetry.'
  }
];

export default function GeospatialMap() {
  const [selectedLocation, setSelectedLocation] = useState<PoetryLocation | null>(null);
  const [zoom, setZoom] = useState(1);

  // Memoize map data for performance
  const mapData = useMemo(() => vietnamGeo, []);

  return (
    <div className="geospatial-map w-full h-[600px] bg-gradient-to-br from-blue-50 to-green-50 rounded-xl shadow-lg overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 p-4 rounded-lg shadow-lg max-w-xs">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          Bản Đồ Thi Ca Việt Nam
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          Khám phá địa danh trong thơ ca Việt Nam. Nhấn vào markers để xem chi tiết.
        </p>
      </div>

      <div className="absolute bottom-4 right-4 z-10 bg-white bg-opacity-90 p-2 rounded-lg shadow-lg flex gap-2">
        <button
          onClick={() => setZoom(Math.max(1, zoom - 0.5))}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={zoom <= 1}
        >
          -
        </button>
        <span className="px-3 py-1 flex items-center text-gray-700">
          {zoom}x
        </span>
        <button
          onClick={() => setZoom(Math.min(5, zoom + 0.5))}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={zoom >= 5}
        >
          +
        </button>
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1500,
          center: [105, 16]
        }}
        width={800}
        height={600}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup zoom={zoom} center={[0, 0]}>
          <Geographies geography={mapData}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#e0f2fe"
                  stroke="#0ea5e9"
                  strokeWidth={0.5}
                  style={{
                    default: { fill: '#dbeafe', stroke: '#3b82f6', strokeWidth: 0.5 },
                    hover: { fill: '#bfdbfe', stroke: '#2563eb', strokeWidth: 1 },
                    pressed: { fill: '#93c5fd', stroke: '#1d4ed8', strokeWidth: 2 }
                  }}
                />
              ))
            }
          </Geographies>

          {poetryLocations.map((location, index) => (
            <Marker
              key={index}
              coordinates={location.coordinates}
              onClick={() => setSelectedLocation(location)}
            >
              <g className="cursor-pointer hover:scale-125 transition-transform">
                <circle
                  r={12}
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth={2}
                  opacity={0.8}
                />
                <text
                  textAnchor="middle"
                  y={4}
                  fontSize={14}
                  fill="#ffffff"
                  fontWeight="bold"
                >
                  📜
                </text>
              </g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Location Detail Popup */}
      {selectedLocation && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 max-w-md z-20 animate-fade-in">
          <button
            onClick={() => setSelectedLocation(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>

          <h4 className="text-xl font-bold text-gray-900 mb-2">
            {selectedLocation.name}
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            {selectedLocation.province}
          </p>

          <div className="mb-4">
            <h5 className="font-semibold text-gray-800 mb-2">Tác phẩm liên quan:</h5>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {selectedLocation.poems.map((poem, index) => (
                <li key={index}>{poem}</li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h5 className="font-semibold text-gray-800 mb-2">Tác giả:</h5>
            <p className="text-sm text-gray-700">{selectedLocation.author}</p>
          </div>

          <p className="text-sm text-gray-600">
            {selectedLocation.description}
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}