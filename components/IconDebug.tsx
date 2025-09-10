"use client";
import React from 'react';

// Import all the icons being used
import {
  HiHome,
  HiUser,
  HiCog,
  HiStar,
  HiCheckCircle,
  HiLockClosed,
  HiHand,
  HiClock,
  HiUsers,
  HiClipboard,
  HiChat,
  HiLink,
  HiTag,
  HiXCircle,
  HiPlay,
  HiCurrencyDollar,
  HiStop,
  HiLightningBolt,
  HiChartBar,
  HiBadgeCheck
} from 'react-icons/hi';

export default function IconDebug() {
  const icons = {
    HiHome,
    HiUser,
    HiCog,
    HiStar,
    HiCheckCircle,
    HiLockClosed,
    HiHand,
    HiClock,
    HiUsers,
    HiClipboard,
    HiChat,
    HiLink,
    HiTag,
    HiXCircle,
    HiPlay,
    HiCurrencyDollar,
    HiStop,
    HiLightningBolt,
    HiChartBar,
    HiBadgeCheck
  };

  console.log('Icon check:', Object.entries(icons).map(([name, icon]) => ({
    name,
    defined: icon !== undefined,
    type: typeof icon
  })));

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Icon Debug</h2>
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(icons).map(([name, Icon]) => (
          <div key={name} className="p-2 border rounded">
            <div className="text-xs mb-2">{name}</div>
            {Icon ? (
              <Icon className="w-6 h-6 text-blue-600" />
            ) : (
              <div className="w-6 h-6 bg-red-200 text-red-600 text-xs flex items-center justify-center">
                ❌
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
