import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/95 backdrop-blur px-3.5 py-2 text-xs font-semibold text-white shadow-xl animate-bounce">
      <WifiOff size={16} />
      <span>Đang ngoại tuyến — Bạn vẫn có thể chơi bình thường!</span>
    </div>
  );
};
