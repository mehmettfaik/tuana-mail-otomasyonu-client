export const ULKE_TLD = {
  'almanya':'.de','arjantin':'.ar','arnavutluk':'.al','avustralya':'.au','avusturya':'.at',
  'azerbaycan':'.az','banglades':'.bd','bae':'.ae','birlesik arap emirlikleri':'.ae','belcika':'.be','bosna hersek':'.ba',
  'brezilya':'.br','bulgaristan':'.bg','cin':'.cn','cekya':'.cz','cek cumhuriyeti':'.cz','danimarka':'.dk',
  'ekvador':'.ec','endonezya':'.id','estonya':'.ee','fas':'.ma','filipinler':'.ph',
  'finlandiya':'.fi','fransa':'.fr','guney afrika':'.za','guney kore':'.kr','gurcistan':'.ge',
  'hindistan':'.in','hirvatistan':'.hr','hollanda':'.nl','hong kong':'.hk',
  'irak':'.iq','iran':'.ir','irlanda':'.ie','ispanya':'.es','israil':'.il',
  'isvec':'.se','isvicre':'.ch','italya':'.it','japonya':'.jp','kanada':'.ca',
  'karadag':'.me','kazakistan':'.kz','kolombiya':'.co','letonya':'.lv','litvanya':'.lt',
  'luksemburg':'.lu','lubnan':'.lb',
  'macaristan':'.hu','makedonya':'.mk','malezya':'.my','malta':'.mt','meksika':'.mx','misir':'.eg',
  'norvec':'.no','ozbekistan':'.uz',
  'pakistan':'.pk','peru':'.pe','polonya':'.pl','portekiz':'.pt',
  'romanya':'.ro','rusya':'.ru',
  'sili':'.cl','singapur':'.sg','sirbistan':'.rs','slovakya':'.sk','slovenya':'.si','suudi arabistan':'.sa','suriye':'.sy',
  'tayland':'.th','tayvan':'.tw','tunus':'.tn','turkiye':'.com.tr',
  'uruguay':'.uy','ukrayna':'.ua','urdun':'.jo',
  'venezuela':'.ve','vietnam':'.vn',
  'yeni zelanda':'.nz','yunanistan':'.gr',
  'abd':'.us','amerika':'.us','amerika birlesik devletleri':'.us',
  'ingiltere':'.co.uk','birlesik krallik':'.co.uk','paraguay':'.py',
  'kibris':'.cy','izlanda':'.is','katar':'.qa','kuveyt':'.kw','bahreyn':'.bh','umman':'.om',
  'nijerya':'.ng','kenya':'.ke','gana':'.gh','cezayir':'.dz','etiyopya':'.et',
  'sri lanka':'.lk','nepal':'.np','kamboçya':'.kh','myanmar':'.mm',
  'kosta rika':'.cr','panama':'.pa','kuba':'.cu'
};

export const COUNTRIES = Object.keys(ULKE_TLD).map(c => {
  return c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
});

function normalizeCountry(str) {
    if (!str) return '';
    return str.toLowerCase()
      .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ü/g,'u')
      .replace(/ş/g,'s').replace(/ç/g,'c').replace(/ğ/g,'g')
      .replace(/[âàá]/g,'a')
      .replace(/[îìí]/g,'i')
      .replace(/[ûùú]/g,'u')
      .replace(/[êèé]/g,'e')
      .replace(/[ôòó]/g,'o')
      .replace(/\s+/g,' ').trim();
  }

function cleanTurkish(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTurkishNoSpace(str) {
  return cleanTurkish(str).replace(/\s+/g, '');
}

export const generateGuessedEmails = (firstName, lastName, website, country) => {
  if (!firstName || !lastName || !website) return [];

  const fClean = cleanTurkishNoSpace(firstName);
  const lClean = cleanTurkishNoSpace(lastName);
  
  let domain = website
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .trim();

  // Alan adi gecersizse (nokta icermiyorsa) tahmin yapma
  if (!domain || !domain.includes('.')) return [];

  const guesses = new Array(18).fill('');

  // Ana domain uzerinden tahminler (Indices 0-3)
  guesses[0] = fClean + '.' + lClean + '@' + domain;
  guesses[1] = fClean[0] + '.' + lClean + '@' + domain;
  guesses[2] = fClean + '@' + domain;
  guesses[3] = fClean + lClean + '@' + domain;

  // Ulke bazli ek domain tahminleri (Indices 4-7)
  const ulkeNorm = normalizeCountry(country || '');
  const ulkeTld = ULKE_TLD[ulkeNorm] || '';
  const baseDomain = domain.replace(/\.[^.]+$/, ''); 

  if (ulkeTld && (baseDomain + ulkeTld) !== domain) {
    const countryDomain = baseDomain + ulkeTld;
    guesses[4] = fClean + '.' + lClean + '@' + countryDomain;
    guesses[5] = fClean[0] + '.' + lClean + '@' + countryDomain;
    guesses[6] = fClean + '@' + countryDomain;
    guesses[7] = fClean + lClean + '@' + countryDomain;
  }

  // .com uzantili email tahminleri (Indices 12-15)
  const comDomain = baseDomain + '.com';
  if (!domain.endsWith('.com')) {
    guesses[12] = fClean + '.' + lClean + '@' + comDomain;
    guesses[13] = fClean[0] + '.' + lClean + '@' + comDomain;
    guesses[14] = fClean + '@' + comDomain;
    guesses[15] = fClean + lClean + '@' + comDomain;
  }

  return guesses;
};
