import React from 'react';
import type { Field, Page, SubField } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { OpenStreetMapDialog } from '@/components/shared/OpenStreetMapDialog';
import { GoogleMapDialog } from '@/components/shared/GoogleMapDialog';

interface MapDialogWrapperProps {
    activeFieldId: string;
    pages: Page[];
    formData: Record<string, unknown>;
    isOpen: boolean;
    onClose: () => void;
    onLocationSelect: (coordinates: string, address: string) => void;
}

export const MapDialogWrapper: React.FC<MapDialogWrapperProps> = ({
    activeFieldId,
    pages,
    formData,
    isOpen,
    onClose,
    onLocationSelect,
}) => {
    const resolveMapProvider = (provider?: string, apiUrl?: string): 'default' | 'google' => {
        const normalizedProvider = String(provider || '').trim().toLowerCase();
        if (normalizedProvider === 'google' || normalizedProvider === 'default') {
            return normalizedProvider;
        }

        const normalizedApiUrl = String(apiUrl || '').trim().toLowerCase();
        if (normalizedApiUrl.includes('maps.googleapis.com')) {
            return 'google';
        }

        return 'google';
    };

    let mapProvider = 'google';
    let apiKey = '';
    let apiUrl = 'https://maps.googleapis.com/maps/api/js';

    // Extract parts if it's a composite ID (from Combination field)
    // Format: fieldId__row_N__col_subFieldName or COMBINATION:fieldId:rowIndex:subFieldName
    const isCompositeLegacy = activeFieldId.includes('__row_') && activeFieldId.includes('__col_');
    const isCombinationFormat = activeFieldId.startsWith('COMBINATION:');
    const isComposite = isCompositeLegacy || isCombinationFormat;

    let realFieldId = activeFieldId;
    let rowIndex = -1;
    let subFieldName = '';

    if (isCompositeLegacy) {
        const parts = activeFieldId.split('__');
        realFieldId = parts[0];
        rowIndex = parseInt(parts[1].split('_')[1]);
        subFieldName = parts[2].split('_')[1];
    } else if (isCombinationFormat) {
        const parts = activeFieldId.split(':');
        realFieldId = parts[1];
        rowIndex = parseInt(parts[2], 10);
        subFieldName = parts[3];
    }

    // Find the field
    let foundField: Field | null = null;
    outerLoop: for (const page of pages) {
        if (!page.sections) continue;
        for (const section of page.sections) {
            const field = section.fields.find((f) => f.id === realFieldId);
            if (field) {
                foundField = field;
                if (isComposite && field.subFields) {
                    const subField = field.subFields.find(
                        (sf: SubField) => sf.name === subFieldName || sf.id === subFieldName,
                    );
                    if (subField) {
                        apiUrl = (subField.mapApiUrl as string)
                            || (subField.metadata?.mapApiUrl as string)
                            || 'https://maps.googleapis.com/maps/api/js';
                        mapProvider = resolveMapProvider(
                            subField.mapProvider as string,
                            apiUrl,
                        );
                        apiUrl = apiUrl
                            || (mapProvider === 'google'
                                ? 'https://maps.googleapis.com/maps/api/js'
                                : 'https://nominatim.openstreetmap.org');
                    } else {
                        apiUrl = (field.metadata?.mapApiUrl as string)
                            || (field.mapApiUrl as string)
                            || 'https://maps.googleapis.com/maps/api/js';
                        mapProvider = resolveMapProvider(
                            (field.metadata?.mapProvider as string) || (field.mapProvider as string),
                            apiUrl,
                        );
                        apiUrl = apiUrl
                            || (mapProvider === 'google'
                                ? 'https://maps.googleapis.com/maps/api/js'
                                : 'https://nominatim.openstreetmap.org');
                    }
                } else {
                    apiUrl = (field.metadata?.mapApiUrl as string)
                        || (field.mapApiUrl as string)
                        || 'https://maps.googleapis.com/maps/api/js';
                    mapProvider = resolveMapProvider(
                        (field.metadata?.mapProvider as string) || (field.mapProvider as string),
                        apiUrl,
                    );
                    apiUrl = apiUrl
                        || (mapProvider === 'google'
                            ? 'https://maps.googleapis.com/maps/api/js'
                            : 'https://nominatim.openstreetmap.org');
                }
                break outerLoop;
            }
        }
    }

    // Get current value
    const fieldName = foundField?.name || '';
    let currentValue: string | undefined;

    if (isComposite && fieldName) {
        const rows = formData[fieldName];
        if (Array.isArray(rows) && rows[rowIndex]) {
            currentValue = rows[rowIndex][subFieldName] as string | undefined;
        }
    } else {
        currentValue = formData[fieldName] as string | undefined;
    }

    // Extract coordinates/address if possible from the current string value
    // Expected format: "Address | Lat, Lng"
    let initialAddress = currentValue || '';
    let initialCoordinates: string | undefined;

    if (currentValue && currentValue.includes('|')) {
        const parts = currentValue.split('|');
        initialAddress = parts[0].trim();
        if (parts.length > 1) {
            initialCoordinates = parts[1].trim();
        }
    } else if (!currentValue) {
        initialAddress = '';
    }

    if (mapProvider === 'google') {
        return (
            <GoogleMapDialog
                isOpen={isOpen}
                onClose={onClose}
                onLocationSelect={onLocationSelect}
                currentAddress={initialAddress}
                currentCoordinates={initialCoordinates}
                apiKey={apiKey}
                apiUrl={apiUrl}
            />
        );
    }

    return (
        <OpenStreetMapDialog
            isOpen={isOpen}
            onClose={onClose}
            onLocationSelect={onLocationSelect}
            currentAddress={initialAddress}
            currentCoordinates={initialCoordinates}
            apiUrl={apiUrl}
        />
    );
};
