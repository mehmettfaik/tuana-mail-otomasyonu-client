import React, { useState, useEffect } from 'react';
import api from '../api/api.js';

const getDefaultBody = (name) => `Hi {{first_name}},

My name is ${name}, and I am reaching out on behalf of Tuana.

We are a family-owned textile company with over four generations of experience in fabric development and production.
We specialize in flexible and sustainable productions, offering:

- Low MOQs, including handloom, lab dips, prints, and various customization options
- Certified production (GOTS, GRS, BCI, OCS, RCS, European Flax, Lenzing, ECOVERO, and others)
- Stock service programs

Our collection includes both woven and knit fabrics, covering a wide range of applications—from linings, interlinings, and pocketing fabrics to more advanced constructions.
We offer any classic weave to technical finishes, including yarn-dyed fabrics, dobbies, jacquards, coatings, flocks, embroideries, and other special developments, using both standard and high-count yarns.

If you currently have any researches or development requests, it would be a pleasure to support you.
We would also be happy to send a selection of hangers or samples upon request.

Looking forward to your feedback.`;

const EmailModal = ({ contact, isOpen, onClose, onSuccess, senderName = 'Selin' }) => {
  const [subject, setSubject] = useState('New Possibilities');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableEmails, setAvailableEmails] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);

  useEffect(() => {
    if (contact && isOpen) {
      // Gather unique emails
      const emails = [];
      if (contact.existing_email) emails.push(contact.existing_email);
      if (contact.selected_email) emails.push(contact.selected_email);
      for (let i = 1; i <= 18; i++) {
        const guessed = contact[`guessed_email_${i}`];
        if (guessed) emails.push(guessed);
      }
      const uniqueEmails = [...new Set(emails)].filter(Boolean);
      setAvailableEmails(uniqueEmails);
      
      // Auto-select the first one if none selected yet, or just leave empty depending on preference.
      // Let's select all by default or none. The screenshot shows all unchecked initially or user can click 'TUMUNU SEC'.
      // I'll default to none selected.
      setSelectedEmails([]);
      setSubject('New Possibilities');
      setBody(getDefaultBody(senderName).replace('{{first_name}}', contact.first_name || ''));
      setError('');
    }
  }, [contact, isOpen, senderName]);

  if (!isOpen || !contact) return null;

  const isAllSelected = availableEmails.length > 0 && selectedEmails.length === availableEmails.length;

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails([...availableEmails]);
    }
  };

  const toggleEmail = (email) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (selectedEmails.length === 0) {
      setError('Lütfen en az bir e-posta adresi seçin.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      await api.post('/api/email/send', {
        contact_id: contact.id,
        subject,
        body,
        emails: selectedEmails
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Email gönderme başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl p-8">
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Email Gonder</h2>
          <p className="text-gray-500 text-sm mt-1">
            {contact.first_name} {contact.last_name} — {contact.company_name}
          </p>
        </div>

        {error && <div className="mb-4 text-red-600 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSend} className="space-y-6">
          
          {/* ALICI EMAIL LİSTESİ */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 tracking-wide">
              ALİCİ EMAİL(LER)
            </label>
            <div className="border border-gray-200 rounded-md bg-white max-h-48 overflow-y-auto">
              <label className="flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors bg-gray-50/50">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 text-gray-900 bg-white border-gray-300 rounded focus:ring-gray-900"
                />
                <span className="ml-3 text-sm font-bold text-gray-700 tracking-wide">
                  TUMUNU SEC
                </span>
              </label>

              {availableEmails.map((email, idx) => (
                <label key={idx} className="flex items-center px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(email)}
                    onChange={() => toggleEmail(email)}
                    className="w-4 h-4 text-gray-900 bg-white border-gray-300 rounded focus:ring-gray-900"
                  />
                  <span className="ml-3 text-sm font-bold text-gray-800">
                    {email}
                  </span>
                </label>
              ))}
              
              {availableEmails.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500">Kayıtlı e-posta bulunamadı.</div>
              )}
            </div>
          </div>

          {/* KONU */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 tracking-wide">
              KONU
            </label>
            <input
              type="text"
              placeholder="Email konusu..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              required
            />
          </div>

          {/* ICERIK */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 tracking-wide">
              ICERİK
            </label>
            <textarea
              placeholder="Email icerigini yazin..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows="5"
              className="w-full px-4 py-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 resize-none"
              required
            ></textarea>
          </div>

          {/* BUTONLAR */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-md transition-colors text-sm"
              disabled={loading}
            >
              Iptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-md transition-colors text-sm flex items-center"
            >
              {loading ? 'Gonderiliyor...' : 'Gonder'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EmailModal;
