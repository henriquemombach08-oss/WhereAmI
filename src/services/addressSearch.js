import * as Location from 'expo-location';

const MIN_RESULTS = 8;
const NATIVE_RESULT_LIMIT = 3;
const resultCache = new Map();

function normalizeText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function buildQueryString(params) {
  return Object.entries(params)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

function getDistanceKm(from, to) {
  if (!from || !to) {
    return null;
  }

  const earthRadiusKm = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function levenshteinDistance(source, target) {
  if (!source.length) return target.length;
  if (!target.length) return source.length;

  const matrix = Array.from({ length: source.length + 1 }, () => Array(target.length + 1).fill(0));

  for (let row = 0; row <= source.length; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column <= target.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= source.length; row += 1) {
    for (let column = 1; column <= target.length; column += 1) {
      const cost = source[row - 1] === target[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      );
    }
  }

  return matrix[source.length][target.length];
}

function similarityScore(query, candidate) {
  const normalizedQuery = normalizeText(query);
  const normalizedCandidate = normalizeText(candidate);

  if (!normalizedQuery || !normalizedCandidate) {
    return 0;
  }

  if (normalizedCandidate === normalizedQuery) {
    return 1;
  }

  if (normalizedCandidate.startsWith(normalizedQuery)) {
    return 0.98;
  }

  if (normalizedCandidate.includes(normalizedQuery)) {
    return 0.9;
  }

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const candidateTokens = normalizedCandidate.split(' ').filter(Boolean);
  const tokenMatches =
    queryTokens.filter((token) => candidateTokens.some((candidateToken) => candidateToken.includes(token))).length /
    Math.max(queryTokens.length, 1);

  const editDistance = levenshteinDistance(normalizedQuery, normalizedCandidate);
  const editSimilarity = 1 - editDistance / Math.max(normalizedQuery.length, normalizedCandidate.length, 1);

  return Math.max(tokenMatches * 0.85, editSimilarity * 0.75);
}

function formatDistanceLabel(distanceKm) {
  if (distanceKm == null) {
    return null;
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}

function buildSecondaryText(parts) {
  return parts.filter(Boolean).join(', ');
}

function getQueryParts(query) {
  const segments = query
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
  const firstSegment = segments[0] || query.trim();
  const houseNumberMatch = firstSegment.match(/\b\d+[A-Za-z]?\b/);
  const houseNumber = houseNumberMatch?.[0] || '';
  const street = firstSegment.replace(/\b\d+[A-Za-z]?\b/, '').replace(/\s+/g, ' ').trim();

  return {
    cityHint: segments[1] || '',
    districtHint: segments[2] || '',
    houseNumber,
    street,
  };
}

function hasHouseNumber(query) {
  return /\b\d+[A-Za-z]?\b/.test(query);
}

function mapPhotonResult(feature) {
  const properties = feature.properties || {};
  const [longitude, latitude] = feature.geometry?.coordinates || [];
  const primaryText = properties.name || properties.street || properties.city || properties.state || properties.country;
  const secondaryText = buildSecondaryText([
    properties.street,
    properties.housenumber,
    properties.city || properties.state,
    properties.countrycode ? properties.countrycode.toUpperCase() : '',
  ]);

  return {
    id: `photon-${properties.osm_type || 'unknown'}-${properties.osm_id || `${latitude}-${longitude}`}`,
    latitude,
    longitude,
    primaryText: primaryText || 'Local encontrado',
    secondaryText,
    displayName: buildSecondaryText([primaryText, secondaryText]),
    source: 'photon',
    importance: properties.type === 'house' ? 0.95 : properties.type === 'street' ? 0.85 : 0.75,
  };
}

function mapNominatimResult(item, source = 'nominatim') {
  const address = item.address || {};
  const primaryText =
    address.road ||
    address.neighbourhood ||
    address.suburb ||
    address.city ||
    address.town ||
    address.village ||
    item.name ||
    item.display_name;

  const secondaryText = buildSecondaryText([
    address.house_number,
    address.suburb || address.neighbourhood,
    address.city || address.town || address.state,
    address.country_code ? address.country_code.toUpperCase() : '',
  ]);

  return {
    id: `${source}-${item.place_id}`,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    primaryText: primaryText || 'Local encontrado',
    secondaryText,
    displayName: item.display_name || buildSecondaryText([primaryText, secondaryText]),
    source,
    importance: Number(item.importance || 0.6),
  };
}

async function fetchPhotonResults(query, userCoords) {
  const params = {
    q: query,
    limit: MIN_RESULTS,
  };

  if (userCoords) {
    params.lat = userCoords.latitude;
    params.lon = userCoords.longitude;
  }

  const response = await fetch(`https://photon.komoot.io/api/?${buildQueryString(params)}`);
  if (!response.ok) {
    throw new Error(`Photon search failed: ${response.status}`);
  }

  const data = await response.json();
  return (data.features || [])
    .map(mapPhotonResult)
    .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
}

function buildSearchAreaParams(userCoords) {
  if (!userCoords) {
    return {};
  }

  const lonDelta = 0.45;
  const latDelta = 0.3;

  return {
    viewbox: [
      userCoords.longitude - lonDelta,
      userCoords.latitude + latDelta,
      userCoords.longitude + lonDelta,
      userCoords.latitude - latDelta,
    ].join(','),
  };
}

async function fetchNominatimResults(query, userCoords) {
  const params = {
    format: 'jsonv2',
    addressdetails: 1,
    dedupe: 1,
    limit: MIN_RESULTS,
    'accept-language': 'pt-BR',
    q: query,
    ...buildSearchAreaParams(userCoords),
  };

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${buildQueryString(params)}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.map((item) => mapNominatimResult(item)).filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
}

async function fetchNominatimStructuredResults(query, userCoords) {
  const queryParts = getQueryParts(query);
  if (!queryParts.street || !queryParts.houseNumber) {
    return [];
  }

  const params = {
    format: 'jsonv2',
    addressdetails: 1,
    dedupe: 1,
    limit: MIN_RESULTS,
    'accept-language': 'pt-BR',
    street: `${queryParts.houseNumber} ${queryParts.street}`,
    city: queryParts.cityHint,
    ...buildSearchAreaParams(userCoords),
  };

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${buildQueryString(params)}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim structured search failed: ${response.status}`);
  }

  const data = await response.json();
  return data
    .map((item) => mapNominatimResult(item, 'nominatim-structured'))
    .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
}

async function fetchNativeResults(query) {
  const nativeResults = await Location.geocodeAsync(query);
  const uniqueResults = nativeResults.slice(0, NATIVE_RESULT_LIMIT);

  const enrichedResults = await Promise.all(
    uniqueResults.map(async (result, index) => {
      const reverse = await Location.reverseGeocodeAsync({
        latitude: result.latitude,
        longitude: result.longitude,
      });
      const details = reverse[0] || {};
      const primaryText =
        details.street ||
        details.name ||
        details.city ||
        details.region ||
        details.country ||
        'Endereço encontrado';
      const secondaryText = buildSecondaryText([
        details.streetNumber,
        details.district,
        details.city || details.subregion || details.region,
        details.isoCountryCode,
      ]);

      return {
        id: `native-${index}-${result.latitude}-${result.longitude}`,
        latitude: result.latitude,
        longitude: result.longitude,
        primaryText,
        secondaryText,
        displayName: buildSecondaryText([primaryText, secondaryText]),
        source: 'native',
        importance: 0.98,
      };
    })
  );

  return enrichedResults.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
}

function dedupeResults(results) {
  const seen = new Map();

  results.forEach((result) => {
    const key = `${normalizeText(result.displayName)}-${result.latitude.toFixed(4)}-${result.longitude.toFixed(4)}`;
    if (!seen.has(key) || seen.get(key).source === 'photon') {
      seen.set(key, result);
    }
  });

  return [...seen.values()];
}

function rankResults(results, query, userCoords) {
  const queryParts = getQueryParts(query);
  const normalizedStreet = normalizeText(queryParts.street);
  const normalizedHouseNumber = normalizeText(queryParts.houseNumber);
  const normalizedCityHint = normalizeText(queryParts.cityHint);

  return results
    .map((result) => {
      const textScore = Math.max(
        similarityScore(query, result.primaryText),
        similarityScore(query, result.displayName),
        similarityScore(query, result.secondaryText)
      );
      const normalizedDisplay = normalizeText(result.displayName);
      const normalizedSecondary = normalizeText(result.secondaryText);
      const numberBonus =
        normalizedHouseNumber && normalizedDisplay.includes(normalizedHouseNumber)
          ? 0.16
          : normalizedHouseNumber
            ? -0.08
            : 0;
      const streetBonus =
        normalizedStreet &&
        (normalizedDisplay.includes(normalizedStreet) || normalizedSecondary.includes(normalizedStreet))
          ? 0.1
          : 0;
      const cityBonus =
        normalizedCityHint &&
        (normalizedDisplay.includes(normalizedCityHint) || normalizedSecondary.includes(normalizedCityHint))
          ? 0.06
          : 0;

      const distanceKm = userCoords
        ? getDistanceKm(userCoords, { latitude: result.latitude, longitude: result.longitude })
        : null;

      const proximityScore =
        distanceKm == null
          ? 0.4
          : Math.max(0, 1 - Math.min(distanceKm, 50) / 50);

      const sourceBonus = result.source === 'native' ? 0.08 : result.source === 'nominatim-structured' ? 0.06 : 0;
      const finalScore =
        textScore * 0.58 +
        proximityScore * 0.18 +
        Math.min(result.importance, 1) * 0.08 +
        numberBonus +
        streetBonus +
        cityBonus +
        sourceBonus;

      return {
        ...result,
        distanceKm,
        distanceLabel: formatDistanceLabel(distanceKm),
        finalScore,
      };
    })
    .sort((left, right) => right.finalScore - left.finalScore)
    .slice(0, MIN_RESULTS);
}

export async function searchAddresses(query, userCoords, options = {}) {
  const { includeFallback = false } = options;
  const trimmedQuery = query.trim();
  const cacheKey = `${trimmedQuery}::${includeFallback ? 'full' : 'lite'}::${userCoords?.latitude ?? ''}::${userCoords?.longitude ?? ''}`;
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 60_000) {
    return cached.results;
  }

  const photonResults = await fetchPhotonResults(trimmedQuery, userCoords);
  let allResults = [...photonResults];
  const shouldUseDeepSearch = includeFallback || hasHouseNumber(trimmedQuery);

  if (shouldUseDeepSearch) {
    const [nominatimResults, structuredResults, nativeResults] = await Promise.all([
      fetchNominatimResults(trimmedQuery, userCoords).catch(() => []),
      fetchNominatimStructuredResults(trimmedQuery, userCoords).catch(() => []),
      fetchNativeResults(trimmedQuery).catch(() => []),
    ]);

    allResults = [...allResults, ...nominatimResults, ...structuredResults, ...nativeResults];
  }

  const rankedResults = rankResults(dedupeResults(allResults), trimmedQuery, userCoords);
  resultCache.set(cacheKey, { results: rankedResults, timestamp: Date.now() });
  return rankedResults;
}
