const https = require('https');
const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9',
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function parseVenues(html) {
  // Extract venue list from boatrace.jp top page
  const venues = [];
  // Pattern: venue links like /owpc/pc/race/racelist?jcd=01&hd=20241105
  const venueRegex = /jcd=(\d{2})&hd=(\d{8})/g;
  const nameRegex = /<[^>]*class="[^"]*table1_boatrace[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/g;

  // Try to find venue list table
  const tableMatch = html.match(/<table[^>]*(?:table1_boatrace|schedule)[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return null;

  const tableHtml = tableMatch[1];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const row = rowMatch[1];
    const jcdMatch = row.match(/jcd=(\d{2})/);
    const hdMatch = row.match(/hd=(\d{8})/);
    const nameMatch = row.match(/<a[^>]*>([^<]+)<\/a>/);
    if (jcdMatch && nameMatch) {
      venues.push({
        jcd: jcdMatch[1],
        name: nameMatch[1].trim(),
        date: hdMatch ? hdMatch[1] : null
      });
    }
  }
  return venues.length > 0 ? venues : null;
}

function parseRaceTimes(html, jcd) {
  const times = [];
  // Pattern for race start times in racelist page
  // Look for time patterns like "10:30" near race numbers
  const timeRegex = /(\d{2}):(\d{2})/g;

  // Try to find the race time table
  // boatrace.jp racelist has times in a specific format
  const raceBlocks = html.match(/1R[\s\S]{0,500}?(\d{2}:\d{2})/);

  // Extract all times that look like race start times (between 08:00 and 17:00)
  const allTimes = [];
  let m;
  while ((m = timeRegex.exec(html)) !== null) {
    const h = parseInt(m[1]);
    const min = parseInt(m[2]);
    if (h >= 8 && h <= 17) {
      allTimes.push(`${m[1]}:${m[2]}`);
    }
  }

  // Deduplicate and take first 12
  const unique = [...new Set(allTimes)];
  return unique.slice(0, 12);
}

// Known approximate race times per venue (fallback)
const FALLBACK_TIMES = {
  '01': ['08:30','08:55','09:20','09:45','10:10','10:35','11:00','11:25','11:50','12:15','12:40','13:05'], // 桐生 morning
  '02': ['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'], // 戸田
  '03': ['10:30','10:55','11:20','11:45','12:10','12:35','13:00','13:25','13:50','14:15','14:40','15:05'], // 江戸川
  '04': ['10:15','10:40','11:05','11:30','11:55','12:20','12:45','13:10','13:35','14:00','14:25','14:50'], // 平和島
  '05': ['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'], // 多摩川
  '06': ['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'], // 浜名湖
  '07': ['10:30','10:55','11:20','11:45','12:10','12:35','13:00','13:25','13:50','14:15','14:40','15:05'], // 蒲郡
  '08': ['10:30','10:55','11:20','11:45','12:10','12:35','13:00','13:25','13:50','14:15','14:40','15:05'], // 常滑
  '09': ['10:20','10:45','11:10','11:35','12:00','12:25','12:50','13:15','13:40','14:05','14:30','14:55'], // 津
  '10': ['10:30','10:55','11:20','11:45','12:10','12:35','13:00','13:25','13:50','14:15','14:40','15:05'], // 三国
  '11': ['11:00','11:25','11:50','12:15','12:40','13:05','13:30','13:55','14:20','14:45','15:10','15:35'], // びわこ
  '12': ['10:30','10:55','11:20','11:45','12:10','12:35','13:00','13:25','13:50','14:15','14:40','15:05'], // 住之江
  '13': ['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'], // 尼崎
  '14': ['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'], // 鳴門
  '15': ['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'], // 丸亀
  '16': ['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'], // 児島
  '17': ['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'], // 宮島
  '18': ['10:30','10:55','11:20','11:45','12:10','12:35','13:00','13:25','13:50','14:15','14:40','15:05'], // 徳山
  '19': ['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'], // 下関
  '20': ['10:30','10:55','11:20','11:45','12:10','12:35','13:00','13:25','13:50','14:15','14:40','15:05'], // 若松
  '21': ['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'], // 芦屋
  '22': ['10:30','10:55','11:20','11:45','12:10','12:35','13:00','13:25','13:50','14:15','14:40','15:05'], // 福岡
  '23': ['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'], // 唐津
  '24': ['10:00','10:25','10:50','11:15','11:40','12:05','12:30','12:55','13:20','13:45','14:10','14:35'], // 大村
};

const VENUE_NAMES = {
  '01':'桐生','02':'戸田','03':'江戸川','04':'平和島','05':'多摩川',
  '06':'浜名湖','07':'蒲郡','08':'常滑','09':'津','10':'三国',
  '11':'びわこ','12':'住之江','13':'尼崎','14':'鳴門','15':'丸亀',
  '16':'児島','17':'宮島','18':'徳山','19':'下関','20':'若松',
  '21':'芦屋','22':'福岡','23':'唐津','24':'大村'
};

// Morning race venues (sometimes)
const MORNING_VENUES = ['01', '02', '05', '06', '07', '14', '16', '19', '23', '24'];

async function getTodayVenuesFromBoatrace() {
  const now = new Date();
  // JST = UTC+9
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jst.getUTCDate()).padStart(2, '0');
  const hd = `${y}${m}${d}`;

  // Try to fetch today's race schedule from boatrace.jp
  const indexUrl = `https://www.boatrace.jp/owpc/pc/race/index`;

  try {
    const html = await fetchUrl(indexUrl);

    // Parse venue JCDs from links
    const jcdSet = new Set();
    const jcdRegex = /jcd=(\d{2})&hd=(\d{8})/g;
    let match;
    while ((match = jcdRegex.exec(html)) !== null) {
      if (match[2] === hd) {
        jcdSet.add(match[1]);
      }
    }

    // Also try without hd parameter
    if (jcdSet.size === 0) {
      const jcdRegex2 = /jcd=(\d{2})/g;
      while ((match = jcdRegex2.exec(html)) !== null) {
        const jcd = match[1];
        if (parseInt(jcd) >= 1 && parseInt(jcd) <= 24) {
          jcdSet.add(jcd);
        }
      }
    }

    if (jcdSet.size === 0) {
      return null;
    }

    // For each venue, fetch race times
    const venues = [];
    const jcds = Array.from(jcdSet).sort();

    for (const jcd of jcds) {
      const name = VENUE_NAMES[jcd] || jcd;
      let times = FALLBACK_TIMES[jcd] || FALLBACK_TIMES['08'];

      try {
        const racelistUrl = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${hd}`;
        const raceHtml = await fetchUrl(racelistUrl);

        // Parse race start times
        // Look for patterns like "10:30" in race schedule
        const extractedTimes = [];

        // boatrace.jp racelist has times in format matching race slots
        // Try multiple patterns
        const patterns = [
          /class="[^"]*time[^"]*"[^>]*>(\d{2}:\d{2})/gi,
          /発走[^<]*(\d{2}:\d{2})/g,
          />\s*(\d{2}:\d{2})\s*</g,
        ];

        for (const pattern of patterns) {
          let m2;
          const found = [];
          pattern.lastIndex = 0;
          while ((m2 = pattern.exec(raceHtml)) !== null) {
            const t = m2[1];
            const h2 = parseInt(t.split(':')[0]);
            if (h2 >= 8 && h2 <= 17) {
              found.push(t);
            }
          }
          const unique = [...new Set(found)].sort();
          if (unique.length >= 10) {
            extractedTimes.push(...unique.slice(0, 12));
            break;
          }
        }

        if (extractedTimes.length >= 10) {
          times = extractedTimes;
        }
      } catch (e) {
        // Use fallback times
      }

      venues.push({ jcd, name, times });
    }

    return { venues, date: hd, source: 'boatrace.jp' };
  } catch (e) {
    return null;
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'max-age=1800', // 30 min cache
  };

  try {
    const result = await getTodayVenuesFromBoatrace();

    if (result && result.venues && result.venues.length > 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    // Fallback: return empty to signal client should use hardcoded
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ venues: [], source: 'fallback', error: 'Could not fetch from boatrace.jp' }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ venues: [], source: 'error', error: err.message }),
    };
  }
};
