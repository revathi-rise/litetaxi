/**
 * Maps provider abstraction. Selected via env:
 *   GEO_PROVIDER=mock|nominatim     ROUTING_PROVIDER=mock|osrm
 *
 * - "mock" providers are DEV ONLY. Mock routes are labelled `source: "mock_estimate"`
 *   (haversine x road factor) and must never be presented as real road data.
 * - "osrm" / "nominatim" use public OpenStreetMap-based services (no API key). Their public
 *   demo servers have usage policies and no SLA; self-host or switch to Google Maps for production.
 */
export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceResult extends LatLng {
  id: string;
  name: string;
  address: string;
}

export interface RouteStep {
  instruction: string;
  maneuver?: string;
  distanceMeters: number;
  location?: [number, number];
}

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  /** [lng, lat] pairs (GeoJSON order). */
  geometry: [number, number][];
  source: 'google_routes' | 'osrm' | 'mock_estimate';
  /** true when not derived from real road network data. */
  isEstimate: boolean;
  steps?: RouteStep[];
}

export class GeoProviderError extends Error {
  constructor(message: string, public readonly code: 'ROUTE_UNAVAILABLE' | 'GEOCODE_UNAVAILABLE' | 'NO_ROUTE') {
    super(message);
  }
}

export interface GeocodingProvider {
  search(query: string, near?: LatLng): Promise<PlaceResult[]>;
  reverse(point: LatLng): Promise<PlaceResult | null>;
}

export interface RoutingProvider {
  route(points: LatLng[]): Promise<RouteResult>;
}

export const GEOCODING_PROVIDER = Symbol('GEOCODING_PROVIDER');
export const ROUTING_PROVIDER = Symbol('ROUTING_PROVIDER');

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371.0088;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** fetch with timeout and bounded retry (network errors / 5xx only). */
export async function fetchJson(url: string, opts: { timeoutMs?: number; retries?: number; headers?: Record<string, string> } = {}): Promise<any> {
  const { timeoutMs = 5000, retries = 2, headers } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers });
      if (res.status >= 500) throw new Error(`upstream ${res.status}`);
      if (!res.ok) throw Object.assign(new Error(`upstream ${res.status}`), { noRetry: true });
      return await res.json();
    } catch (e: any) {
      lastErr = e;
      if (e?.noRetry) break;
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

/* ------------------------------ PAN-INDIA GAZETTEER & GEOCODING ------------------------------ */

export const MOCK_PLACES: PlaceResult[] = [
  // Tamil Nadu - Coimbatore & Surroundings
  { id: 'in-cbe-eachanari-temple', name: 'Eachanari Vinayagar Temple', address: 'Pollachi Main Rd, Eachanari, Coimbatore, Tamil Nadu 641021', lat: 10.9252, lng: 76.9820 },
  { id: 'in-cbe-eachanari-jn', name: 'Eachanari Junction & Bus Stop', address: 'Pollachi Main Road, Eachanari, Coimbatore, Tamil Nadu', lat: 10.9265, lng: 76.9818 },
  { id: 'in-cbe-eachanari-karpagam', name: 'Karpagam Academy of Higher Education', address: 'Eachanari Post, Pollachi Main Rd, Coimbatore, Tamil Nadu', lat: 10.9160, lng: 76.9840 },
  { id: 'in-cbe-sundarapuram', name: 'Sundarapuram', address: 'Sundarapuram, Pollachi Main Rd, Coimbatore, Tamil Nadu', lat: 10.9535, lng: 76.9748 },
  { id: 'in-cbe-kuniyamuthur', name: 'Kuniyamuthur', address: 'Palakkad Main Rd, Kuniyamuthur, Coimbatore, Tamil Nadu', lat: 10.9630, lng: 76.9530 },
  { id: 'in-cbe-malumichampatti', name: 'Malumichampatti', address: 'Chettipalayam Rd, Malumichampatti, Coimbatore, Tamil Nadu', lat: 10.8980, lng: 77.0080 },
  { id: 'in-cbe-ukkadam', name: 'Ukkadam Bus Terminus & Lake', address: 'Ukkadam, Coimbatore, Tamil Nadu', lat: 10.9902, lng: 76.9604 },
  { id: 'in-cbe-townhall', name: 'Town Hall', address: 'Town Hall, Coimbatore, Tamil Nadu', lat: 10.9960, lng: 76.9630 },
  { id: 'in-cbe-gandhi', name: 'Gandhipuram Central Bus Stand', address: 'Gandhipuram, Coimbatore, Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { id: 'in-cbe-rspuram', name: 'RS Puram (DB Road)', address: 'RS Puram, Coimbatore, Tamil Nadu', lat: 11.0080, lng: 76.9420 },
  { id: 'in-cbe-station', name: 'Coimbatore Junction Railway Station', address: 'State Bank Road, Gopalapuram, Coimbatore', lat: 11.0016, lng: 76.9629 },
  { id: 'in-cbe-airport', name: 'Coimbatore International Airport (CJB)', address: 'Civil Aerodrome, Peelamedu, Coimbatore', lat: 11.0300, lng: 77.0434 },
  { id: 'in-cbe-tidel', name: 'Tidel Park Coimbatore', address: 'Peelamedu, Coimbatore, Tamil Nadu', lat: 11.0285, lng: 77.0267 },
  { id: 'in-cbe-peelamedu', name: 'Peelamedu / Fun Republic Mall', address: 'Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu', lat: 11.0240, lng: 77.0020 },
  { id: 'in-cbe-saravan', name: 'Saravanampatti Tech Zone', address: 'Sathy Rd, Saravanampatti, Coimbatore', lat: 11.0780, lng: 76.9980 },
  { id: 'in-cbe-saibaba', name: 'Saibaba Colony', address: 'NSR Road, Saibaba Colony, Coimbatore, Tamil Nadu', lat: 11.0280, lng: 76.9460 },
  { id: 'in-cbe-thudiyalur', name: 'Thudiyalur', address: 'Mettupalayam Rd, Thudiyalur, Coimbatore, Tamil Nadu', lat: 11.0820, lng: 76.9400 },
  { id: 'in-cbe-singanallur', name: 'Singanallur Bus Stand', address: 'Trichy Rd, Singanallur, Coimbatore, Tamil Nadu', lat: 10.9990, lng: 77.0250 },
  { id: 'in-cbe-vadavalli', name: 'Vadavalli', address: 'Marudhamalai Rd, Vadavalli, Coimbatore, Tamil Nadu', lat: 11.0250, lng: 76.9020 },
  { id: 'in-cbe-marudhamalai', name: 'Marudhamalai Murugan Temple', address: 'Marudhamalai, Coimbatore, Tamil Nadu', lat: 11.0450, lng: 76.8520 },
  { id: 'in-cbe-brookefields', name: 'Brookefields Mall', address: 'Dr Krishnasamy Mudaliar Rd, Brookefields, Coimbatore', lat: 11.0090, lng: 76.9580 },
  { id: 'in-cbe-prozone', name: 'Prozone Mall', address: 'Sathy Rd, Saravanampatti, Coimbatore, Tamil Nadu', lat: 11.0540, lng: 76.9940 },
  { id: 'in-cbe-kmch', name: 'Kovai Medical Center and Hospital (KMCH)', address: 'Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu', lat: 11.0380, lng: 77.0370 },
  { id: 'in-cbe-psg', name: 'PSG College of Technology', address: 'Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu', lat: 11.0230, lng: 77.0030 },
  // Pollachi & Anaimalai Taluk (including Odayakulam)
  { id: 'in-cbe-pollachi', name: 'Pollachi Bus Stand', address: 'Central Bus Stand, Pollachi, Coimbatore, Tamil Nadu', lat: 10.6600, lng: 77.0070 },
  { id: 'in-cbe-odayakulam', name: 'Odayakulam (Pollachi)', address: 'Odayakulam Town Panchayat, Pollachi, Coimbatore, Tamil Nadu 642129', lat: 10.5931, lng: 76.9058 },
  { id: 'in-cbe-anaimalai', name: 'Anaimalai', address: 'Anaimalai Town, Pollachi Taluk, Coimbatore, Tamil Nadu 642104', lat: 10.5833, lng: 76.9333 },
  { id: 'in-cbe-vettaikaranpudur', name: 'Vettaikaranpudur', address: 'Vettaikaranpudur, Pollachi, Coimbatore, Tamil Nadu 642129', lat: 10.5630, lng: 76.8830 },
  { id: 'in-cbe-valparai', name: 'Valparai Hill Station', address: 'Valparai Town, Coimbatore, Tamil Nadu 642127', lat: 10.3264, lng: 76.9554 },
  { id: 'in-cbe-kinathukadavu', name: 'Kinathukadavu', address: 'Kinathukadavu, Coimbatore, Tamil Nadu 642109', lat: 10.8202, lng: 77.0195 },
  { id: 'in-cbe-negamam', name: 'Negamam', address: 'Negamam, Pollachi, Coimbatore, Tamil Nadu 642120', lat: 10.7936, lng: 77.1081 },
  { id: 'in-cbe-kottur', name: 'Kottur', address: 'Kottur, Pollachi, Coimbatore, Tamil Nadu 642114', lat: 10.5348, lng: 76.9806 },

  // Tamil Nadu - Chennai
  { id: 'in-chn-central', name: 'Chennai Central Railway Station', address: 'Park Town, Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2755 },
  { id: 'in-chn-airport', name: 'Chennai International Airport (MAA)', address: 'Meenambakkam, Chennai, Tamil Nadu', lat: 12.9941, lng: 80.1709 },
  { id: 'in-chn-tnagar', name: 'T. Nagar (Pondy Bazaar)', address: 'T. Nagar, Chennai, Tamil Nadu', lat: 13.0418, lng: 80.2341 },
  { id: 'in-chn-marina', name: 'Marina Beach', address: 'Kamarajar Promenade, Marina Beach, Chennai', lat: 13.0500, lng: 80.2824 },
  { id: 'in-chn-omr', name: 'OMR Sholinganallur Tech Corridor', address: 'Old Mahabalipuram Rd, Chennai', lat: 12.9010, lng: 80.2279 },
  { id: 'in-chn-koyambedu', name: 'CMBT Bus Terminus Koyambedu', address: 'Koyambedu, Chennai, Tamil Nadu', lat: 13.0694, lng: 80.1948 },
  { id: 'in-chn-velachery', name: 'Phoenix MarketCity Velachery', address: 'Velachery Main Rd, Chennai', lat: 12.9906, lng: 80.2175 },

  // Tamil Nadu - Other Cities
  { id: 'in-mdu-meenakshi', name: 'Madurai Meenakshi Temple', address: 'Madurai Main, Madurai, Tamil Nadu', lat: 9.9195, lng: 78.1193 },
  { id: 'in-mdu-airport', name: 'Madurai Airport (IXM)', address: 'Avaniyapuram, Madurai, Tamil Nadu', lat: 9.8345, lng: 78.0934 },
  { id: 'in-slm-bus', name: 'Salem New Bus Stand', address: 'Fairlands, Salem, Tamil Nadu', lat: 11.6643, lng: 78.1460 },
  { id: 'in-tpr-hub', name: 'Tirupur Old Bus Stand', address: 'Tirupur Bazaar, Tirupur, Tamil Nadu', lat: 11.1085, lng: 77.3411 },
  { id: 'in-try-airport', name: 'Tiruchirappalli International Airport', address: 'Trichy, Tamil Nadu', lat: 10.7654, lng: 78.7097 },

  // Karnataka - Bengaluru
  { id: 'in-blr-airport', name: 'Kempegowda International Airport (BLR)', address: 'Devanahalli, Bengaluru, Karnataka', lat: 13.1986, lng: 77.7066 },
  { id: 'in-blr-koramangala', name: 'Koramangala (Sony World Signal)', address: 'Koramangala, Bengaluru, Karnataka', lat: 12.9352, lng: 77.6245 },
  { id: 'in-blr-indiranagar', name: 'Indiranagar 100ft Road', address: 'Indiranagar, Bengaluru, Karnataka', lat: 12.9719, lng: 77.6412 },
  { id: 'in-blr-whitefield', name: 'ITPB Whitefield Tech Hub', address: 'Whitefield, Bengaluru, Karnataka', lat: 12.9866, lng: 77.7381 },
  { id: 'in-blr-majestic', name: 'Majestic / KSR Bengaluru Railway Station', address: 'Kempegowda, Bengaluru, Karnataka', lat: 12.9781, lng: 77.5694 },
  { id: 'in-blr-ecity', name: 'Electronic City Phase 1', address: 'Hosur Rd, Bengaluru, Karnataka', lat: 12.8399, lng: 77.6770 },

  // Maharashtra - Mumbai & Pune
  { id: 'in-bom-airport', name: 'Mumbai Airport (T2 CSMIA)', address: 'Sahar, Andheri East, Mumbai, Maharashtra', lat: 19.0896, lng: 72.8656 },
  { id: 'in-bom-bkc', name: 'Bandra Kurla Complex (BKC)', address: 'Bandra East, Mumbai, Maharashtra', lat: 19.0657, lng: 72.8687 },
  { id: 'in-bom-cst', name: 'Chhatrapati Shivaji Maharaj Terminus (CST)', address: 'Fort, Mumbai, Maharashtra', lat: 18.9400, lng: 72.8353 },
  { id: 'in-pun-airport', name: 'Pune International Airport (PNQ)', address: 'Lohegaon, Pune, Maharashtra', lat: 18.5822, lng: 73.9197 },
  { id: 'in-pun-hinjawadi', name: 'Hinjawadi Rajiv Gandhi Infotech Park', address: 'Hinjawadi, Pune, Maharashtra', lat: 18.5913, lng: 73.7389 },
  { id: 'in-pun-koregaon', name: 'Koregaon Park (North Main Rd)', address: 'Koregaon Park, Pune, Maharashtra', lat: 18.5362, lng: 73.8940 },

  // Delhi NCR
  { id: 'in-del-cp', name: 'Connaught Place (CP)', address: 'Central Delhi, New Delhi', lat: 28.6304, lng: 77.2177 },
  { id: 'in-del-airport', name: 'Indira Gandhi International Airport (DEL)', address: 'Palam, New Delhi', lat: 28.5562, lng: 77.1000 },
  { id: 'in-del-station', name: 'New Delhi Railway Station (NDLS)', address: 'Paharganj, New Delhi', lat: 28.6431, lng: 77.2197 },
  { id: 'in-ggn-cybercity', name: 'DLF Cyber City Gurugram', address: 'Sector 24, Gurugram, Haryana', lat: 28.4952, lng: 77.0895 },
  { id: 'in-noid-sec18', name: 'Noida Sector 18 (Atta Market)', address: 'Sector 18, Noida, Uttar Pradesh', lat: 28.5708, lng: 77.3271 },

  // Telangana & Andhra Pradesh - Hyderabad & Vizag
  { id: 'in-hyd-hitec', name: 'Hitec City (Cyber Towers)', address: 'Madhapur, Hyderabad, Telangana', lat: 17.4504, lng: 78.3808 },
  { id: 'in-hyd-airport', name: 'Rajiv Gandhi International Airport (HYD)', address: 'Shamshabad, Hyderabad, Telangana', lat: 17.2403, lng: 78.4294 },
  { id: 'in-hyd-banjara', name: 'Banjara Hills Road No 1', address: 'Banjara Hills, Hyderabad, Telangana', lat: 17.4156, lng: 78.4418 },
  { id: 'in-vt-beach', name: 'RK Beach Visakhapatnam', address: 'Beach Rd, Visakhapatnam, Andhra Pradesh', lat: 17.7126, lng: 83.3195 },

  // Kerala - Kochi & Trivandrum
  { id: 'in-cok-airport', name: 'Cochin International Airport (COK)', address: 'Nedumbassery, Kochi, Kerala', lat: 10.1518, lng: 76.3930 },
  { id: 'in-cok-infopark', name: 'Infopark Kakkanad', address: 'Kakkanad, Kochi, Kerala', lat: 10.0104, lng: 76.3608 },
  { id: 'in-cok-mgroad', name: 'MG Road Ernakulam', address: 'Ernakulam South, Kochi, Kerala', lat: 9.9674, lng: 76.2828 },
  { id: 'in-trv-airport', name: 'Thiruvananthapuram Airport (TRV)', address: 'Chacka, Thiruvananthapuram, Kerala', lat: 8.4821, lng: 76.9200 },

  // West Bengal - Kolkata
  { id: 'in-ccu-howrah', name: 'Howrah Railway Station', address: 'Howrah, Kolkata, West Bengal', lat: 22.5850, lng: 88.3426 },
  { id: 'in-ccu-parkst', name: 'Park Street', address: 'Central Kolkata, Kolkata, West Bengal', lat: 22.5510, lng: 88.3524 },
  { id: 'in-ccu-airport', name: 'Netaji Subhash Chandra Bose Airport (CCU)', address: 'Dum Dum, Kolkata, West Bengal', lat: 22.6547, lng: 88.4467 },

  // Gujarat & Rajasthan
  { id: 'in-amd-airport', name: 'Sardar Vallabhbhai Patel Airport (AMD)', address: 'Hansol, Ahmedabad, Gujarat', lat: 23.0734, lng: 72.6266 },
  { id: 'in-amd-ashram', name: 'Sabarmati Riverfront', address: 'Ashram Rd, Ahmedabad, Gujarat', lat: 23.0338, lng: 72.5850 },
  { id: 'in-jpr-hawa', name: 'Hawa Mahal (Pink City)', address: 'Badi Choupad, Jaipur, Rajasthan', lat: 26.9239, lng: 75.8267 },

  // Goa & Others
  { id: 'in-goa-airport', name: 'Goa Dabolim Airport (GOI)', address: 'Dabolim, Vasco da Gama, Goa', lat: 15.3808, lng: 73.8314 },
  { id: 'in-goa-panjim', name: 'Panaji City Promenade', address: 'Panaji, North Goa, Goa', lat: 15.4989, lng: 73.8278 },
];

export class MockGeocodingProvider implements GeocodingProvider {
  async search(query: string, near?: LatLng): Promise<PlaceResult[]> {
    const raw = query.trim().toLowerCase();
    if (!raw) return MOCK_PLACES.slice(0, 10);

    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/\bechanari\b/g, 'eachanari')
        .replace(/\bukadam\b/g, 'ukkadam')
        .replace(/\brs\s*puram\b/g, 'rs puram')
        .replace(/\bsundarampuram\b/g, 'sundarapuram')
        .replace(/\bpeelamedu\b/g, 'peelamedu');

    const q = norm(raw);

    // 1. Check matching places in our local gazetteer
    const localMatches = MOCK_PLACES.filter((p) => {
      const target = norm(`${p.name} ${p.address}`);
      return (
        target.includes(raw) ||
        target.includes(q) ||
        p.name.toLowerCase().includes(raw) ||
        p.address.toLowerCase().includes(raw)
      );
    });

    const results: PlaceResult[] = [...localMatches];
    const seenIds = new Set(results.map((m) => m.id.toLowerCase()));
    const seenNames = new Set(results.map((m) => m.name.toLowerCase()));

    // 2. High-speed Photon Geocoding (OpenStreetMap based, finds all Indian villages/hamlets/towns)
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      let pUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(raw)}&limit=10`;
      if (near) {
        pUrl += `&lat=${near.lat}&lon=${near.lng}`;
      }
      const pRes = await fetch(pUrl, { signal: ctrl.signal });
      clearTimeout(timer);
      if (pRes.ok) {
        const pData: any = await pRes.json();
        const features = pData?.features || [];
        for (const f of features) {
          const props = f.properties || {};
          const coords = f.geometry?.coordinates;
          if (!coords || coords.length < 2) continue;
          const name = props.name || props.street || 'Location';
          const nameLower = name.toLowerCase();
          if (seenNames.has(nameLower)) continue;

          const parts = [
            props.name,
            props.street,
            props.district || props.county,
            props.city,
            props.state,
            props.country || 'India',
          ].filter(Boolean);
          const fullAddress = Array.from(new Set(parts)).join(', ');

          const id = `photon-${props.osm_id || Math.random()}`;
          seenNames.add(nameLower);
          results.push({
            id,
            name,
            address: fullAddress,
            lat: Number(coords[1]),
            lng: Number(coords[0]),
          });
        }
      }
    } catch {
      // Photon fallback
    }

    // 3. OpenStreetMap Nominatim for official Indian administrative boundaries & villages
    if (results.length < 8) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5000);
        const searchQuery = q !== raw ? q : raw;
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&countrycodes=in&q=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'SwiftCab-PanIndia/1.0 (contact@swiftcab.local)' } });
        clearTimeout(timer);
        if (res.ok) {
          const osmData: any = await res.json();
          if (Array.isArray(osmData) && osmData.length > 0) {
            for (const p of osmData) {
              const name = p.name || String(p.display_name).split(',')[0].trim();
              const nameLower = name.toLowerCase();
              if (seenNames.has(nameLower)) continue;
              seenNames.add(nameLower);
              results.push({
                id: `osm-${p.place_id}`,
                name,
                address: p.display_name,
                lat: Number(p.lat),
                lng: Number(p.lon),
              });
            }
          }
        }
      } catch {
        // Nominatim fallback
      }
    }

    // 4. India Postal Pincode API for rural villages, hamlets, and post offices
    if (results.length < 5) {
      try {
        const pCtrl = new AbortController();
        const pTimer = setTimeout(() => pCtrl.abort(), 4000);
        const postRes = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(raw)}`, { signal: pCtrl.signal });
        clearTimeout(pTimer);
        if (postRes.ok) {
          const postData: any = await postRes.json();
          if (Array.isArray(postData) && postData[0]?.Status === 'Success') {
            const offices = postData[0].PostOffice || [];
            for (const po of offices.slice(0, 4)) {
              const poName = po.Name;
              const poLower = poName.toLowerCase();
              if (seenNames.has(poLower)) continue;
              seenNames.add(poLower);

              const district = po.District || 'Coimbatore';
              const state = po.State || 'Tamil Nadu';
              const pincode = po.Pincode || '';
              const address = `${poName}, ${po.Division ? po.Division + ' Division, ' : ''}${district}, ${state} ${pincode}`.trim();
              
              // Base coordinates for district fallback
              let lat = 10.5931;
              let lng = 76.9058;
              if (pincode) {
                try {
                  const pinRes = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&q=${encodeURIComponent(pincode)}`, {
                    headers: { 'User-Agent': 'SwiftCab-PanIndia/1.0 (contact@swiftcab.local)' }
                  });
                  if (pinRes.ok) {
                    const pinData: any = await pinRes.json();
                    if (pinData && pinData.length > 0 && pinData[0].lat && pinData[0].lon) {
                      lat = Number(pinData[0].lat);
                      lng = Number(pinData[0].lon);
                    }
                  }
                } catch {}
              }

              results.push({
                id: `po-${pincode}-${poName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                name: `${poName} (${district})`,
                address,
                lat,
                lng,
              });
            }
          }
        }
      } catch {
        // Postal fallback
      }
    }

    return results.slice(0, 15);
  }

  async reverse(point: LatLng): Promise<PlaceResult | null> {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4500);
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lng}`;
      const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'SwiftCab-PanIndia/1.0 (contact@swiftcab.local)' } });
      clearTimeout(timer);
      if (res.ok) {
        const d: any = await res.json();
        if (d && d.display_name) {
          const addr = d.address || {};
          const specificName =
            addr.village ||
            addr.hamlet ||
            addr.isolated_dwelling ||
            addr.suburb ||
            addr.neighbourhood ||
            addr.town ||
            addr.city_district ||
            addr.road ||
            d.name ||
            'Location';

          return {
            id: `osm-rev-${d.place_id || Date.now()}`,
            name: specificName,
            address: d.display_name,
            lat: point.lat,
            lng: point.lng,
          };
        }
      }
    } catch {}

    const sorted = [...MOCK_PLACES].sort((a, b) => haversineKm(a, point) - haversineKm(b, point));
    const nearest = sorted[0];
    if (!nearest || haversineKm(nearest, point) > 5) {
      return {
        id: 'pin',
        name: 'Pinned Location',
        address: `Pinned Location (${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})`,
        lat: point.lat,
        lng: point.lng,
      };
    }
    return { ...nearest, lat: point.lat, lng: point.lng, name: nearest.name, address: nearest.address };
  }
}

export class MockRoutingProvider implements RoutingProvider {
  constructor(private roadFactor = 1.3, private avgKmh = 24) {}
  async route(points: LatLng[]): Promise<RouteResult> {
    let straight = 0;
    for (let i = 1; i < points.length; i++) straight += haversineKm(points[i - 1], points[i]);
    const distanceKm = Math.round(straight * this.roadFactor * 100) / 100;
    return {
      distanceKm,
      durationMin: Math.max(1, Math.round((distanceKm / this.avgKmh) * 60)),
      geometry: points.map((p) => [p.lng, p.lat] as [number, number]),
      source: 'mock_estimate',
      isEstimate: true,
    };
  }
}

export class GoogleRoutesProvider implements RoutingProvider {
  constructor(private apiKey: string) {}

  private decode(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push([lng * 1e-5, lat * 1e-5]); // [lng, lat]
    }
    return points;
  }

  async route(points: LatLng[]): Promise<RouteResult> {
    if (points.length < 2) throw new GeoProviderError('At least 2 points required', 'NO_ROUTE');
    const origin = points[0];
    const destination = points[points.length - 1];
    const intermediates = points.slice(1, -1).map((p) => ({
      location: { latLng: { latitude: p.lat, longitude: p.lng } },
    }));

    try {
      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.steps',
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
          intermediates: intermediates.length ? intermediates : undefined,
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_UNAWARE',
        }),
      });

      if (!res.ok) {
        throw new Error(`Google Routes API status: ${res.status}`);
      }

      const data: any = await res.json();
      const r = data.routes?.[0];
      if (!r || !r.polyline?.encodedPolyline) {
        throw new GeoProviderError('No drivable route found', 'NO_ROUTE');
      }

      const geom = this.decode(r.polyline.encodedPolyline);
      const distKm = Math.round(((r.distanceMeters ?? 0) / 1000) * 100) / 100;
      const durSec = parseInt(String(r.duration || '0s').replace('s', ''), 10) || 60;
      const durMin = Math.max(1, Math.round(durSec / 60));

      const rawSteps = r.legs?.[0]?.steps || [];
      const steps: RouteStep[] = rawSteps.map((s: any) => ({
        instruction: s.navigationInstruction?.instructions || 'Continue along the route',
        maneuver: s.navigationInstruction?.maneuver || 'STRAIGHT',
        distanceMeters: s.distanceMeters ?? 100,
        location: s.startLocation?.latLng ? [s.startLocation.latLng.latitude, s.startLocation.latLng.longitude] as [number, number] : undefined,
      }));

      return {
        distanceKm: distKm,
        durationMin: durMin,
        geometry: geom,
        source: 'google_routes',
        isEstimate: false,
        steps: steps.length ? steps : undefined,
      };
    } catch (e: any) {
      if (e instanceof GeoProviderError) throw e;
      throw new GeoProviderError(e?.message || 'Google routing failed', 'ROUTE_UNAVAILABLE');
    }
  }
}

export class FallbackRoutingProvider implements RoutingProvider {
  constructor(private providers: RoutingProvider[]) {}

  async route(points: LatLng[]): Promise<RouteResult> {
    for (const p of this.providers) {
      try {
        const res = await p.route(points);
        if (res && res.geometry && res.geometry.length >= 2) return res;
      } catch (_) {}
    }
    return this.providers[this.providers.length - 1].route(points);
  }
}

/* ------------------------------ REAL (OSM) ------------------------------ */

export class OsrmRoutingProvider implements RoutingProvider {
  constructor(private baseUrl = 'https://router.project-osrm.org') {}
  async route(points: LatLng[]): Promise<RouteResult> {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
    let data: any;
    try {
      data = await fetchJson(`${this.baseUrl}/route/v1/driving/${coords}?overview=full&geometries=geojson`);
    } catch {
      throw new GeoProviderError('Routing service unavailable', 'ROUTE_UNAVAILABLE');
    }
    if (data?.code !== 'Ok' || !data.routes?.length) {
      throw new GeoProviderError('No drivable route between these points', 'NO_ROUTE');
    }
    const r = data.routes[0];
    return {
      distanceKm: Math.round((r.distance / 1000) * 100) / 100,
      durationMin: Math.max(1, Math.round(r.duration / 60)),
      geometry: r.geometry.coordinates,
      source: 'osrm',
      isEstimate: false,
    };
  }
}

export class NominatimGeocodingProvider implements GeocodingProvider {
  constructor(private baseUrl = 'https://nominatim.openstreetmap.org', private userAgent = 'SwiftCab-dev/0.1') {}
  private map(p: any): PlaceResult {
    return { id: `osm-${p.place_id}`, name: p.name || String(p.display_name).split(',')[0], address: p.display_name, lat: Number(p.lat), lng: Number(p.lon) };
  }
  async search(query: string, near?: LatLng): Promise<PlaceResult[]> {
    const vb = near ? `&viewbox=${near.lng - 0.5},${near.lat + 0.5},${near.lng + 0.5},${near.lat - 0.5}&bounded=0` : '';
    try {
      const data = await fetchJson(`${this.baseUrl}/search?format=jsonv2&limit=8&countrycodes=in&q=${encodeURIComponent(query)}${vb}`, { headers: { 'User-Agent': this.userAgent } });
      return data.map((p: any) => this.map(p));
    } catch {
      throw new GeoProviderError('Address search unavailable', 'GEOCODE_UNAVAILABLE');
    }
  }
  async reverse(point: LatLng): Promise<PlaceResult | null> {
    try {
      const data = await fetchJson(`${this.baseUrl}/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lng}`, { headers: { 'User-Agent': this.userAgent } });
      return data?.place_id ? this.map(data) : null;
    } catch {
      throw new GeoProviderError('Reverse geocoding unavailable', 'GEOCODE_UNAVAILABLE');
    }
  }
}
