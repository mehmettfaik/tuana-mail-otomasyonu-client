import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../api/api.js';
import Navbar from '../components/Navbar.jsx';
import UploadPopup from '../components/UploadPopup.jsx';
import { generateGuessedEmails, COUNTRIES } from '../utils/emailPredictor.js';

const ContactForm = () => {
  const [activeTab, setActiveTab] = useState('tekli'); // 'tekli' or 'toplu'
  
  const initialForm = {
    country: '',
    company_name: '',
    website: '',
    first_name: '',
    last_name: '',
    position: '',
    existing_email: ''
  };
  
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploadState, setUploadState] = useState({ status: 'idle', message: '' });
  const [companyMatches, setCompanyMatches] = useState([]);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  const normalizeTurkish = (str) => {
    return str.toLowerCase()
      .replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, ''); // keep only alphanumerics
  };

  const getDomainFromWebsite = (website) => {
    if (!website) return '';
    let domain = website.toLowerCase();
    domain = domain.replace(/^https?:\/\//, '');
    domain = domain.replace(/^www\./, '');
    domain = domain.split('/')[0];
    return domain;
  };

  const checkCompany = async (companyName) => {
    if (!companyName || companyName.length < 2) {
      setCompanyMatches([]);
      return;
    }
    try {
      const response = await api.get(`/api/contacts/check-company?name=${encodeURIComponent(companyName)}`);
      if (response.data.exists) {
        setCompanyMatches(response.data.matches);
      } else {
        setCompanyMatches([]);
      }
    } catch (err) {
      console.error('Company check failed', err);
    }
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      checkCompany(formData.company_name);
    }, 400);

    return () => clearTimeout(timerRef.current);
  }, [formData.company_name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const guessedEmails = generateGuessedEmails(
        formData.first_name, 
        formData.last_name, 
        formData.website, 
        formData.country
      );

      await api.post('/api/contacts', {
        ...formData,
        guessedEmails
      });
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClear = () => {
    setFormData(initialForm);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadState({ status: 'processing', message: '' });

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
          company_name: getVal(['company', 'companyname', 'firma', 'firmaadi']),
          existing_email: getVal(['email', 'emailaddress', 'mail', 'mevcutemail']),
          country: getVal(['country', 'ulke']),
          website: getVal(['website', 'web', 'site']),
          position: getVal(['position', 'pozisyon', 'title', 'unvan'])
        };
      }).filter(c => c.first_name);

      // Add guessed emails for bulk upload
      const contactsWithGuesses = parsedContacts.map(c => {
        const guesses = generateGuessedEmails(c.first_name, c.last_name, c.website || c.company_name, c.country || '');
        return { ...c, guessedEmails: guesses };
      });

      if (contactsWithGuesses.length > 0) {
        const response = await api.post('/api/contacts/bulk', { contacts: contactsWithGuesses });
        setUploadState({ status: 'success', message: `${response.data.count} kontak başarıyla yüklendi!` });
        setTimeout(() => {
            navigate('/dashboard');
        }, 1500);
      } else {
        setUploadState({ status: 'error', message: 'Excel dosyasında geçerli kontak bulunamadı. Lütfen "Ad" sütununun olduğundan emin olun.' });
      }
    } catch (err) {
      console.error(err);
      setUploadState({ status: 'error', message: 'Kontaklar yüklenirken bir hata oluştu.' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const closeUploadPopup = () => {
    setUploadState({ status: 'idle', message: '' });
  };

  return (
    <div className="min-h-screen bg-white">
      <UploadPopup 
        status={uploadState.status} 
        message={uploadState.message} 
        onClose={closeUploadPopup} 
      />
      <Navbar />
      <main className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-10 right-4 sm:right-6 lg:right-8">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-sm font-medium text-black hover:text-gray-600"
            >
              ← Dashboard'a Dön
            </button>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">TUANA B2B Kontak Formu</h2>
          <p className="text-gray-500 text-sm">Yeni kontak bilgilerini girin veya toplu yükleyin</p>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('tekli')}
              className={`${
                activeTab === 'tekli'
                  ? 'border-black bg-gray-100 text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm rounded-t-md transition-colors`}
            >
              Tekli Giriş
            </button>
            <button
              onClick={() => setActiveTab('toplu')}
              className={`${
                activeTab === 'toplu'
                  ? 'border-black bg-gray-100 text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm rounded-t-md transition-colors`}
            >
              Toplu Yükleme
            </button>
          </nav>
        </div>

        {activeTab === 'tekli' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Ülke <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="country"
                list="countries"
                placeholder="Ulke yazin..."
                value={formData.country}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                required
              />
              <datalist id="countries">
                {COUNTRIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Firma Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                placeholder="ABC Tekstil A.S."
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                required
              />
              {companyMatches.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                  <strong>Uyarı:</strong> Bu firmadan kayıtlı kişiler var: {companyMatches.join(', ')}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Firma Web Sitesi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="website"
                placeholder="https://www.abctekstil.com"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Ad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Pozisyon</label>
              <input
                type="text"
                name="position"
                placeholder="Satin Alma Muduru"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mevcut Email</label>
              <input
                type="email"
                name="existing_email"
                placeholder="varsa mevcut email adresi"
                value={formData.existing_email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
              />
            </div>

            <div className="flex flex-col space-y-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
              >
                {loading ? 'Kaydediliyor...' : 'Kaydet ve Email Tahmin Et'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Temizle
              </button>
            </div>
          </form>
        )}

        {activeTab === 'toplu' && (
          <div className="py-10 text-center border-2 border-dashed border-gray-300 rounded-lg p-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-4 flex text-sm text-gray-600 justify-center">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-black hover:text-gray-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-black">
                <span>Excel Dosyası Seçin</span>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  className="sr-only" 
                  accept=".xlsx, .xls"
                  ref={fileInputRef}
                  onChange={handleImportExcel}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">.xlsx, .xls</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ContactForm;
