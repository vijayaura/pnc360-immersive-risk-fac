// ─────────────────────────────────────────────────────────────────────────────
// ProposalFormDesign — Constants
// fieldsLibrary, fieldTypes, FRONTEND_ID_REGEX
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
    Type,
    FileText,
    Hash,
    ChevronDown,
    Calendar,
    Clock,
    CalendarDays,
    CheckSquare,
    Upload,
    List,
    MapPin,
    Circle,
    Calculator,
    User,
    Mail,
    Phone,
    Building2,
    MapPin as MapPinIcon,
    CreditCard,
    Briefcase,
} from 'lucide-react';
import type { Field } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import type { FieldType } from './types';

// ── Frontend-generated ID regex ───────────────────────────────────────────────

export const FRONTEND_ID_REGEX = /^(page-|section|field|subfield)?\d{10,}$/;

// ── Field Types palette ───────────────────────────────────────────────────────

export interface FieldTypeDefinition {
    value: FieldType;
    label: string;
    icon: React.ReactNode;
    canBeRating?: boolean;
}

export const fieldTypes: FieldTypeDefinition[] = [
    {
        value: 'text',
        label: 'Text',
        icon: React.createElement(Type, { className: 'w-4 h-4' }),
        canBeRating: false,
    },
    {
        value: 'textarea',
        label: 'Textarea',
        icon: React.createElement(FileText, { className: 'w-4 h-4' }),
        canBeRating: false,
    },
    {
        value: 'number',
        label: 'Number',
        icon: React.createElement(Hash, { className: 'w-4 h-4' }),
        canBeRating: true,
    },
    {
        value: 'dropdown',
        label: 'Dropdown',
        icon: React.createElement(ChevronDown, { className: 'w-4 h-4' }),
        canBeRating: true,
    },
    {
        value: 'date',
        label: 'Date',
        icon: React.createElement(Calendar, { className: 'w-4 h-4' }),
        canBeRating: true,
    },
    {
        value: 'time',
        label: 'Time',
        icon: React.createElement(Clock, { className: 'w-4 h-4' }),
        canBeRating: true,
    },
    {
        value: 'datePeriod',
        label: 'Date Period',
        icon: React.createElement(CalendarDays, { className: 'w-4 h-4' }),
        canBeRating: true,
    },
    {
        value: 'policyPeriod',
        label: 'Policy Period',
        icon: React.createElement(CalendarDays, { className: 'w-4 h-4' }),
        canBeRating: true,
    },
    {
        value: 'checkbox',
        label: 'Checkbox',
        icon: React.createElement(CheckSquare, { className: 'w-4 h-4' }),
        canBeRating: true,
    },
    {
        value: 'consent',
        label: 'Consent',
        icon: React.createElement(CheckSquare, { className: 'w-4 h-4' }),
        canBeRating: false,
    },
    {
        value: 'file',
        label: 'File Upload',
        icon: React.createElement(Upload, { className: 'w-4 h-4' }),
        canBeRating: false,
    },
    {
        value: 'multiselect',
        label: 'Multi-Select',
        icon: React.createElement(List, { className: 'w-4 h-4' }),
        canBeRating: true,
    },
    {
        value: 'multiselectDropdown',
        label: 'Multi-Select Dropdown',
        icon: React.createElement(List, { className: 'w-4 h-4' }),
        canBeRating: true,
    },
    {
        value: 'location',
        label: 'Location Coordinates',
        icon: React.createElement(MapPin, { className: 'w-4 h-4' }),
        canBeRating: false,
    },
    {
        value: 'combination',
        label: 'Combination Fields',
        icon: React.createElement(List, { className: 'w-4 h-4' }),
        canBeRating: true,
    },
    {
        value: 'chooseButton',
        label: 'Choose Button (Radio)',
        icon: React.createElement(Circle, { className: 'w-4 h-4' }),
        canBeRating: false,
    },
];

// ── Fields Library ────────────────────────────────────────────────────────────

export interface LibraryFieldDef {
    id: string;
    label: string;
    icon: React.ReactNode;
    field: Partial<Field>;
}

export const fieldsLibrary: LibraryFieldDef[] = [
    {
        id: 'fullName',
        label: 'Full Name',
        icon: React.createElement(User, { className: 'w-4 h-4' }),
        field: {
            type: 'text',
            label: 'Full Name',
            name: 'fullName',
            placeholder: 'Enter full name',
            required: true,
            validations: [
                { type: 'minLength', value: 2, message: 'Name must be at least 2 characters' },
                { type: 'maxLength', value: 100, message: 'Name must not exceed 100 characters' },
            ],
        },
    },
    {
        id: 'email',
        label: 'Email ID',
        icon: React.createElement(Mail, { className: 'w-4 h-4' }),
        field: {
            type: 'text',
            label: 'Email ID',
            name: 'email',
            placeholder: 'Enter email address',
            required: true,
            validations: [
                {
                    type: 'pattern',
                    value: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                    message: 'Please enter a valid email address',
                },
            ],
        },
    },
    {
        id: 'phoneNumber',
        label: 'Phone Number',
        icon: React.createElement(Phone, { className: 'w-4 h-4' }),
        field: {
            type: 'text',
            label: 'Phone Number',
            name: 'phoneNumber',
            placeholder: 'Enter phone number',
            required: true,
            validations: [
                {
                    type: 'pattern',
                    value: '^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$',
                    message: 'Please enter a valid phone number',
                },
            ],
        },
    },
    {
        id: 'companyName',
        label: 'Company Name',
        icon: React.createElement(Building2, { className: 'w-4 h-4' }),
        field: {
            type: 'text',
            label: 'Company Name',
            name: 'companyName',
            placeholder: 'Enter company name',
            required: false,
            validations: [
                { type: 'maxLength', value: 200, message: 'Company name must not exceed 200 characters' },
            ],
        },
    },
    {
        id: 'address',
        label: 'Address',
        icon: React.createElement(MapPinIcon, { className: 'w-4 h-4' }),
        field: {
            type: 'text',
            label: 'Address',
            name: 'address',
            placeholder: 'Enter address',
            required: false,
            validations: [
                { type: 'maxLength', value: 500, message: 'Address must not exceed 500 characters' },
            ],
        },
    },
    {
        id: 'dateOfBirth',
        label: 'Date of Birth',
        icon: React.createElement(Calendar, { className: 'w-4 h-4' }),
        field: {
            type: 'date',
            label: 'Date of Birth',
            name: 'dateOfBirth',
            required: false,
            validations: [
                { type: 'maxDate', value: 'today', message: 'Date of birth cannot be in the future' },
            ],
        },
    },
    {
        id: 'nationalId',
        label: 'National ID / Passport',
        icon: React.createElement(CreditCard, { className: 'w-4 h-4' }),
        field: {
            type: 'text',
            label: 'National ID / Passport',
            name: 'nationalId',
            placeholder: 'Enter national ID or passport number',
            required: false,
            validations: [
                { type: 'maxLength', value: 50, message: 'ID number must not exceed 50 characters' },
            ],
        },
    },
    {
        id: 'occupation',
        label: 'Occupation',
        icon: React.createElement(Briefcase, { className: 'w-4 h-4' }),
        field: {
            type: 'text',
            label: 'Occupation',
            name: 'occupation',
            placeholder: 'Enter occupation',
            required: false,
            validations: [
                { type: 'maxLength', value: 100, message: 'Occupation must not exceed 100 characters' },
            ],
        },
    },
];

// ── Helper ────────────────────────────────────────────────────────────────────

/** Returns false for field types that cannot be rating parameters */
export const canBeRatingParameter = (fieldType: FieldType): boolean => {
    const nonRatingTypes: FieldType[] = ['text', 'file', 'location', 'time', 'chooseButton'];
    return !nonRatingTypes.includes(fieldType);
};

/** Calculator icon node for the sidebar (re-exported for use in FieldsSidebar) */
export const CalculatorIcon = React.createElement(Calculator, { className: 'w-3 h-3 text-primary' });
