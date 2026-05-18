import React from 'react';

const StatsCards = ({ stats = { total: 0, sent: 0, opened: 0 } }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-gray-500 text-sm font-medium">Toplam Kontak</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
      </div>
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-gray-500 text-sm font-medium">Gönderilen</h3>
        <p className="text-3xl font-bold text-black mt-2">{stats.sent}</p>
      </div>
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-gray-500 text-sm font-medium">Açılan</h3>
        <p className="text-3xl font-bold text-gray-700 mt-2">{stats.opened}</p>
      </div>
    </div>
  );
};

export default StatsCards;
