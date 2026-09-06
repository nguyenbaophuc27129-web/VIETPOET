/**
 * Tab Navigation Component
 * Switch between VIET-POET AI and VIET-POET EXAM
 */
'use client';

import React, { useState } from 'react';

interface TabNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  const tabs = [
    { id: 'ai', label: 'VIET-POET AI', icon: '🤖' },
    { id: 'exam', label: 'VIET-POET EXAM', icon: '📝' }
  ];

  return (
    <div className="tab-navigation mb-6">
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}