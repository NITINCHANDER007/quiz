import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode, Smartphone } from 'lucide-react';

export default function QRCodeModal({ isOpen, onClose, roomCode, joinUrl }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-pop-in">
      <div className="relative w-full max-w-md bg-brand-surface border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="w-12 h-12 rounded-2xl bg-brand-purple/20 text-brand-pink flex items-center justify-center mx-auto mb-4 border border-brand-pink/30">
          <QrCode className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-black text-white">Scan to Join Quiz</h3>
        <p className="text-sm text-gray-400 mt-1 flex items-center justify-center gap-1.5">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Point phone camera at this QR code</span>
        </p>

        {/* QR Code Container */}
        <div className="my-6 p-4 bg-white rounded-2xl inline-block shadow-xl">
          <QRCodeSVG
            value={joinUrl}
            size={220}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Room Code Display */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-5">
          <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">
            Game Room PIN
          </span>
          <div className="text-3xl font-black tracking-widest text-yellow-400 mt-0.5">
            {roomCode}
          </div>
        </div>

        {/* Copy Link Button */}
        <button
          onClick={handleCopy}
          className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
            copied
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-brand-purple hover:bg-brand-purple/90 text-white shadow-lg shadow-brand-purple/30'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              <span>Join Link Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              <span>Copy Direct Join Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
