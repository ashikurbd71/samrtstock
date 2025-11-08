'use client';

import React, { useState } from 'react';
import axios from 'axios';

export default function DownloadButton({ date }) {
  const [downloading, setDownloading] = useState(false);

  const onDownload = async () => {
    try {
      setDownloading(true);
      const res = await axios.get(`/api/report/export?date=${date}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${date}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download Excel file.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={onDownload}
      disabled={downloading}
      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
    >
      {downloading ? 'Downloading...' : 'Download Excel'}
    </button>
  );
}
