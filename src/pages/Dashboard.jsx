import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../api/api.js';
import Navbar from '../components/Navbar.jsx';
import StatsCards from '../components/StatsCards.jsx';
import ContactTable from '../components/ContactTable.jsx';
import EmailModal from '../components/EmailModal.jsx';
import EmailAutomationPanel from '../components/EmailAutomationPanel.jsx';
import { generateGuessedEmails, COUNTRIES } from '../utils/emailPredictor.js';

const Dashboard = () => {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, opened: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, sent, opened, pending
  const [selectedContact, setSelectedContact] = useState(null);
  const [senderName, setSenderName] = useState('Selin'); // Account toggle
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const [automationOpen, setAutomationOpen] = useState(false);
  const navigate = useNavigate();

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'Ulke': '',
        'Firma Adi': '',
        'Firma Web Sitesi': '',
        'Ad': '',
        'Soyad': '',
        'Pozisyon': '',
        'Mevcut Email': ''
      }
    ]);

    // Ülke listesini aynı sayfada I sütununa (boş H sütunundan sonra) yaz
    const countryRows = [['Ülke Listesi'], ...COUNTRIES.map(c => [c])];
    XLSX.utils.sheet_add_aoa(ws, countryRows, { origin: 'I1' });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contacts");
    XLSX.writeFile(wb, "B2B_Kontak_Taslagi.xlsx");
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/contacts/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit: 100
      });
      if (search) queryParams.append('search', search);
      if (filterStatus !== 'all') queryParams.append('status', filterStatus);

      const response = await api.get(`/api/contacts?${queryParams.toString()}`);
      setContacts(response.data.data);
      setTotalPages(Math.ceil(response.data.total / response.data.limit));

      // Fetch stats only if it's the first page or automation is open to avoid unnecessary calls
      if (page === 1) {
        fetchStats();
      }
    } catch (err) {
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset to page 1 when search or filter changes
    setPage(1);
  }, [search, filterStatus]);

  useEffect(() => {
    fetchContacts();
  }, [page, search, filterStatus]);

  // Otomasyon açıkken veya sayfa 1'deyken kontakları 30 sn'de bir yenile (dashboard sayaçları güncellenir)
  useEffect(() => {
    if (!automationOpen && page !== 1) return;
    const interval = setInterval(() => {
      fetchContacts();
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [automationOpen, page, search, filterStatus]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await api.delete(`/api/contacts/${id}`);
        fetchContacts();
      } catch (err) {
        alert('Failed to delete contact');
      }
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);

      const parsedContacts = rows.map(row => {
        // Handle case-insensitive headers
        const getVal = (keys) => {
          const key = Object.keys(row).find(k => keys.includes(k.toLowerCase().replace(/[^a-z]/g, '')));
          return key ? row[key] : '';
        };

        return {
          first_name: getVal(['firstname', 'first', 'ad']),
          last_name: getVal(['lastname', 'last', 'surname', 'soyad']),
          company_name: getVal(['company', 'companyname', 'organization', 'firma', 'firmaadi']),
          country: getVal(['country', 'ulke']),
          website: getVal(['website', 'web', 'site', 'firmawebsitesi']),
          position: getVal(['position', 'pozisyon', 'title', 'unvan']),
          existing_email: getVal(['email', 'emailaddress', 'mail', 'mevcutemail'])
        };
      }).filter(c => c.first_name);

      const contactsWithGuesses = parsedContacts.map(c => {
        const guesses = generateGuessedEmails(c.first_name, c.last_name, c.website || c.company_name, c.country || '');
        return { ...c, guessedEmails: guesses };
      });

      if (contactsWithGuesses.length > 0) {
        const response = await api.post('/api/contacts/bulk', { contacts: contactsWithGuesses });
        alert(`${response.data.count} kontak başarıyla yüklendi!`);
        fetchContacts();
      } else {
        alert('Excel dosyasında geçerli kontak bulunamadı. Lütfen "Ad" sütununun olduğundan emin olun.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to import contacts');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Removing client side filtering since it's done on backend

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onToggleAutomation={() => setAutomationOpen(!automationOpen)} senderName={senderName} setSenderName={setSenderName} />
      <EmailAutomationPanel isOpen={automationOpen} onClose={() => setAutomationOpen(false)} senderName={senderName} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <StatsCards stats={stats} />

        <div className="mb-6 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Kontak ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="shadow-sm focus:ring-black focus:border-black block w-full sm:w-40 sm:text-sm border-gray-300 rounded-md py-2 px-3 border bg-white"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="sent">Gönderildi</option>
              <option value="pending">Bekliyor</option>
              <option value="opened">Açıldı</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-end">
            <button
              onClick={downloadTemplate}
              className="bg-white border border-black text-black hover:bg-gray-50 font-bold py-2 px-4 rounded shadow-sm transition-colors text-sm"
            >
              Taslak İndir
            </button>
            <button
              onClick={() => navigate('/contacts/new')}
              className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
            >
              Kontak Ekle
            </button>
            <input
              type="file"
              accept=".xlsx, .xls"
              ref={fileInputRef}
              onChange={handleImportExcel}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="bg-white border border-black text-black hover:bg-gray-50 font-bold py-2 px-4 rounded shadow-sm transition-colors text-sm"
            >
              Excel Yükle
            </button>
          </div>
        </div>

        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

        {loading ? (
          <div className="text-center py-10">Loading contacts...</div>
        ) : (
          <>
            <ContactTable
              contacts={contacts}
              onDelete={handleDelete}
              onSendEmail={setSelectedContact}
            />
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 text-sm font-medium bg-white"
                >
                  Önceki
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Sayfa {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 text-sm font-medium bg-white"
                >
                  Sonraki
                </button>
              </div>
            )}
          </>
        )}

        <EmailModal
          contact={selectedContact}
          isOpen={!!selectedContact}
          onClose={() => setSelectedContact(null)}
          onSuccess={fetchContacts}
          senderName={senderName}
        />
      </main>
    </div>
  );
};

export default Dashboard;
