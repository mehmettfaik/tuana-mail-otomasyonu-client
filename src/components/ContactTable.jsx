import React from 'react';

const ContactTable = ({ contacts, onDelete, onSendEmail }) => {
  const getStatusBadge = (contact) => {
    if (contact.email_opened) {
      return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded bg-black text-white">Açıldı</span>;
    }
    if (contact.email_sent) {
      return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded bg-gray-200 text-gray-800">Gönderildi</span>;
    }
    return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded bg-white border border-gray-200 text-gray-400">Bekliyor</span>;
  };

  const getGuessedEmails = (contact) => {
    const guesses = [];
    for (let i = 1; i <= 18; i++) {
      const email = contact[`guessed_email_${i}`];
      if (email) guesses.push(email);
    }
    return guesses;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 bg-white sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wider">FİRMA</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wider">ULKE</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wider">AD SOYAD</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wider">POZİSYON</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wider">TAHMİN EDİLEN</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wider">DURUM</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wider">TARİH</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wider">ISLEM</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {contacts.map((contact) => {
                  const guessedEmails = getGuessedEmails(contact);
                  return (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {contact.company_name || '-'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {contact.country || '-'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {contact.first_name} {contact.last_name}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {contact.position || '-'}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {guessedEmails.length > 0 ? (
                          <div className="flex flex-col space-y-1 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {guessedEmails.map((email, i) => (
                              <span key={i}>{email}</span>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {getStatusBadge(contact)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(contact.created_at)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium flex items-center space-x-2">
                        <button 
                          onClick={() => onSendEmail(contact)}
                          className="bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                        >
                          Email Gönder
                        </button>
                        <button 
                          onClick={() => onDelete(contact.id)}
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-transparent hover:border-red-200 rounded"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default ContactTable;
