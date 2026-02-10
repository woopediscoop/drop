"use client";

import { QRCodeSVG } from "qrcode.react";

export default function QrCode({ url }: { url: string }) {
  return (
    <div className="bg-white p-3 rounded-xl inline-block">
      <QRCodeSVG value={url} size={140} />
    </div>
  );
}
