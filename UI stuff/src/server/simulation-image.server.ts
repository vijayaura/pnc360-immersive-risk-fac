export function buildDamagePrompt(
  propertyName: string,
  propertyType: string,
  floors: number,
  scenario: string,
  severity: number, // 0-1
  params: { windSpeed?: number; floodLevel?: number; recoveryWeeks?: number }
): string {
  const severityLabel = severity > 0.7 ? "severe catastrophic" : severity > 0.4 ? "moderate" : "minor";

  if (scenario === "fire") {
    const affectedFloors = Math.ceil(floors * severity * 0.3);
    return `Photorealistic aerial view of ${propertyName}, a ${floors}-floor ${propertyType} building in Dubai UAE, experiencing a ${severityLabel} fire. ${affectedFloors} floors show flames and thick black smoke billowing out of broken windows. Fire trucks and emergency vehicles at the base. Wind speed ${params.windSpeed || 15}km/h pushing smoke. Dramatic lighting, emergency scene. Professional photography style, 4K detail.`;
  }

  if (scenario === "flood") {
    const waterLevel = params.floodLevel || 2;
    return `Photorealistic view of ${propertyName}, a ${floors}-floor ${propertyType} building in Dubai UAE, surrounded by ${severityLabel} flooding. Water level at ${waterLevel} meters submerging ground floor and parking areas. Cars partially submerged. Muddy brown floodwater. Rescue boats visible. Overcast sky with rain. Professional photography style, 4K detail.`;
  }

  if (scenario === "earthquake") {
    return `Photorealistic view of ${propertyName}, a ${floors}-floor ${propertyType} building in Dubai UAE, after a ${severityLabel} earthquake. Visible structural cracks on facade, some fallen debris, broken windows. Dust clouds. Emergency crews on scene. Damaged road surface with cracks. Professional photography style, 4K detail.`;
  }

  if (scenario === "cyclone") {
    return `Photorealistic aerial view of ${propertyName}, a ${floors}-floor ${propertyType} building in Dubai UAE, during a ${severityLabel} tropical cyclone. Extreme wind damage, torn roof panels, flying debris, heavy rain, bent palm trees, flooding in surrounding streets. Dark storm clouds. Professional photography style, 4K detail.`;
  }

  // Business interruption
  return `Photorealistic view of ${propertyName}, a ${floors}-floor ${propertyType} building in Dubai UAE, completely shut down and abandoned. Yellow caution tape across entrances. "CLOSED" signs. Empty parking lot. Dark windows. Construction barriers around the perimeter. Desolate atmosphere. Professional photography style, 4K detail.`;
}
