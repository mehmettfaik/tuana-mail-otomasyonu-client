import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api.js';

const DEFAULT_SUBJECT = 'New Possibilities';

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

const EmailAutomationPanel = ({ isOpen, onClose, senderName = 'Selin' }) => {
  const [status, setStatus] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(getDefaultBody(senderName));
  const [showErrors, setShowErrors] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const intervalRef = useRef(null);

  // Update body template when senderName changes, if the user hasn't heavily modified it
  // For simplicity, we just replace the name in the current body if it's there
  useEffect(() => {
    const otherName = senderName === 'Selin' ? 'Alex' : 'Selin';
    setBody(prev => prev.replace(`My name is ${otherName}`, `My name is ${senderName}`));
  }, [senderName]);

  // Poll status every 5 seconds when panel is open
  useEffect(() => {
    if (!isOpen) return;
    const fetchStatus = async () => {
      try {
        const res = await api.get('/api/email-automation/status');
        setStatus(res.data);
      } catch (err) {
        console.error('Status fetch error', err);
      }
    };
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 5000);
    return () => clearInterval(intervalRef.current);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStart = async () => {
    if (!subject.trim() || !body.trim()) return;
    setStartLoading(true);
    try {
      await api.post('/api/email-automation/start', { subject, body });
      setShowStartModal(false);
      setSubject(DEFAULT_SUBJECT);
      setBody(getDefaultBody(senderName));
    } catch (err) {
      alert(err.response?.data?.error || 'Başlatılamadı');
    } finally {
      setStartLoading(false);
    }
  };

  const handleStop = async () => {
    if (!window.confirm('Otomasyonu durdurmak istediğinize emin misiniz?')) return;
    try {
      await api.post('/api/email-automation/stop');
    } catch (err) {
      alert('Durdurma hatası');
    }
  };

  const isRunning = status?.isRunning;
  const progress = status?.totalTarget > 0 ? Math.round((status.totalSent / status.totalTarget) * 100) : 0;

  // Countdown
  let countdown = '';
  if (status?.isPaused && status?.pausedUntil) {
    const remaining = new Date(status.pausedUntil).getTime() - Date.now();
    if (remaining > 0) {
      const min = Math.floor(remaining / 60000);
      const sec = Math.floor((remaining % 60000) / 1000);
      countdown = `${min}dk ${sec}sn`;
    }
  }

  return (
    <>
      {/* Overlay panel */}
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-start justify-center pt-10" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">Email Otomasyonu</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold">✕</button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">

            {/* Status message */}
            <div className={`p-3 rounded-lg text-sm font-medium ${isRunning ? 'bg-green-50 text-green-800 border border-green-200' :
                status?.message?.includes('🛑') ? 'bg-red-50 text-red-800 border border-red-200' :
                  'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
              {status?.message || 'Durum bilgisi yükleniyor...'}
            </div>

            {/* Progress bar */}
            {(isRunning || status?.totalSent > 0) && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{status.totalSent} / {status.totalTarget} gönderildi</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-black rounded-full h-2.5 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Countdown */}
            {countdown && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-yellow-600 text-sm">⏳ Bekleme: <strong>{countdown}</strong></span>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xl font-bold text-gray-900">{status?.totalSent || 0}</div>
                <div className="text-xs text-gray-500">Gönderildi</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xl font-bold text-red-600">{status?.totalFailed || 0}</div>
                <div className="text-xs text-gray-500">Başarısız</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xl font-bold text-gray-900">{status?.dailySendCount || 0}/{status?.dailyLimit || 250}</div>
                <div className="text-xs text-gray-500">Günlük</div>
              </div>
            </div>

            {/* Current contact */}
            {isRunning && status?.currentContact && (
              <div className="text-xs text-gray-500">
                Şu an: <span className="font-medium text-gray-700">{status.currentContact}</span>
              </div>
            )}

            {/* Errors toggle */}
            {status?.errors?.length > 0 && (
              <div>
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  {showErrors ? '▾ Hataları gizle' : `▸ Hataları göster (${status.errors.length})`}
                </button>
                {showErrors && (
                  <div className="mt-2 max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                    {status.errors.map((err, i) => (
                      <div key={i} className="text-xs text-red-700">
                        <span className="text-red-400">{new Date(err.time).toLocaleTimeString('tr-TR')}</span> — {err.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              {!isRunning ? (
                <button
                  onClick={() => setShowStartModal(true)}
                  className="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors"
                >
                  Otomasyonu Başlat
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors"
                >
                  Durdur
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Start Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Otomasyonu Başlat</h3>
            <p className="text-xs text-gray-500 mb-4">
              <code>{'{{first_name}}'}</code> kullanarak kişiselleştirme yapabilirsiniz.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">KONU</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Email konusu..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">İÇERİK (HTML)</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Merhaba {{first_name}},&#10;&#10;Mail içeriğiniz..."
                  rows="6"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowStartModal(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-sm transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleStart}
                  disabled={startLoading || !subject.trim() || !body.trim()}
                  className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {startLoading ? 'Başlatılıyor...' : ' Başlat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmailAutomationPanel;
