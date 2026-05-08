export interface WaterBodyResponse {
  version: number;
  generator: string;
  elements: Array<{
    type: string;
    id: number;
    tags: {
      natural?: string;
      waterway?: string;
      name?: string;
    };
    geometry?: Array<{
      lat: number;
      lon: number;
    }>;
  }>;
}

export interface WaterBodyCheckResult {
  isNearWaterBody: boolean;
  waterBodies: Array<{
    name?: string;
    type: string;
    distance?: number;
  }>;
}

/**
 * Check if a location is near a water body within 100 meters using Overpass API
 * @param latitude - The latitude of the location
 * @param longitude - The longitude of the location
 * @returns Promise<WaterBodyCheckResult> - Result indicating if water body is nearby
 */
export const checkWaterBodyProximity = async (
  latitude: number,
  longitude: number
): Promise<WaterBodyCheckResult> => {
  try {
    // Construct the Overpass QL query
    const query = `[out:json];
(
  way(around:100,${latitude},${longitude})["natural"="water"];
  way(around:100,${latitude},${longitude})["waterway"];
  relation(around:100,${latitude},${longitude})["natural"="water"];
);
out geom;`;

    // Make the request to Overpass API
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data: WaterBodyResponse = await response.json();

    // Check if any water bodies were found
    const isNearWaterBody = data.elements.length > 0;

    // Extract water body information
    const waterBodies = data.elements.map(element => ({
      name: element.tags.name || 'Unnamed water body',
      type: element.tags.natural || element.tags.waterway || 'water',
      distance: 0, // Overpass doesn't provide exact distance, but we know it's within 100m
    }));

    return {
      isNearWaterBody,
      waterBodies,
    };
  } catch (error) {
    console.error('Error checking water body proximity:', error);
    
    // Return a safe default in case of error
    return {
      isNearWaterBody: false,
      waterBodies: [],
    };
  }
};
