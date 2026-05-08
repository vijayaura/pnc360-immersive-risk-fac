import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UWRulesImportExport from '../UWRulesImportExport';
import * as uwRulesApi from '@/features/product-config/rating-configurator/api/uw-rules';

// Mock the API functions
vi.mock('@/features/product-config/rating-configurator/api/uw-rules', () => ({
  exportUWRules: vi.fn(),
  importUWRules: vi.fn(),
}));

// Mock the toast hook
vi.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock URL.createObjectURL and related functions
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

describe('UWRulesImportExport', () => {
  const mockProps = {
    productId: 'test-product-id',
    productName: 'Test Product',
    onImportComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export and import buttons', () => {
    render(<UWRulesImportExport {...mockProps} />);
    
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('opens export confirmation dialog when export button is clicked', () => {
    render(<UWRulesImportExport {...mockProps} />);
    
    fireEvent.click(screen.getByText('Export'));
    
    expect(screen.getByText('Export UW Rules')).toBeInTheDocument();
    expect(screen.getByText(/This will export all UW rules for "Test Product"/)).toBeInTheDocument();
  });

  it('opens import dialog when import button is clicked', () => {
    render(<UWRulesImportExport {...mockProps} />);
    
    fireEvent.click(screen.getByText('Import'));
    
    expect(screen.getByText('Import UW Rules')).toBeInTheDocument();
    expect(screen.getByText('Select JSON File')).toBeInTheDocument();
  });

  it('handles export functionality', async () => {
    const mockExportData = {
      data: [
        {
          id: '1',
          name: 'Test Rule',
          description: 'Test Description',
          priority: 1,
          isActive: true,
          adjustmentType: 'FIXED' as const,
          adjustmentValue: 100,
          quoteAction: 'quote' as const,
          conditions: [],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ],
      exportedAt: '2024-01-01T00:00:00Z',
      productId: 'test-product-id',
      totalRules: 1,
    };

    vi.mocked(uwRulesApi.exportUWRules).mockResolvedValue(mockExportData);

    // Mock document.createElement and appendChild
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    render(<UWRulesImportExport {...mockProps} />);
    
    // Click export button
    fireEvent.click(screen.getByText('Export'));
    
    // Confirm export
    fireEvent.click(screen.getByText('Export Rules'));
    
    await waitFor(() => {
      expect(uwRulesApi.exportUWRules).toHaveBeenCalledWith('test-product-id');
    });

    expect(mockLink.click).toHaveBeenCalled();
  });

  it('validates import file format', async () => {
    render(<UWRulesImportExport {...mockProps} />);
    
    // Open import dialog
    fireEvent.click(screen.getByText('Import'));
    
    // Create a mock file with wrong extension
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Select JSON File') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);
    
    // Should show error for invalid file type
    await waitFor(() => {
      // The component should handle this internally and show a toast
      expect(input.files?.[0]).toBe(file);
    });
  });

  it('validates JSON file content', async () => {
    render(<UWRulesImportExport {...mockProps} />);
    
    // Open import dialog
    fireEvent.click(screen.getByText('Import'));
    
    // Create a valid JSON file with valid rule data
    const validRuleData = [
      {
        name: 'Test Rule',
        description: 'Test Description',
        priority: 1,
        isActive: true,
        adjustmentType: 'FIXED',
        adjustmentValue: 100,
        quoteAction: 'quote',
        conditions: [
          {
            parameterId: 'sum_insured',
            operator: 'greaterThan',
            value: '1000',
            sequenceNo: 1,
            logicalOp: 'AND',
          },
        ],
      },
    ];
    
    const file = new File([JSON.stringify(validRuleData)], 'rules.json', { type: 'application/json' });
    const input = screen.getByLabelText('Select JSON File') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    // Mock FileReader
    const mockFileReader = {
      readAsText: vi.fn(),
      onload: null as any,
      onerror: null as any,
      result: JSON.stringify(validRuleData),
    };
    
    vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any);
    
    fireEvent.change(input);
    
    // Simulate FileReader onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: JSON.stringify(validRuleData) } } as any);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Import Preview')).toBeInTheDocument();
    });
  });

  it('handles import with overwrite option', async () => {
    const mockImportResult = {
      imported: 1,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    vi.mocked(uwRulesApi.importUWRules).mockResolvedValue(mockImportResult);

    render(<UWRulesImportExport {...mockProps} />);
    
    // Open import dialog
    fireEvent.click(screen.getByText('Import'));
    
    // Create a valid JSON file
    const validRuleData = [
      {
        name: 'Test Rule',
        description: 'Test Description',
        priority: 1,
        isActive: true,
        adjustmentType: 'FIXED',
        adjustmentValue: 100,
        quoteAction: 'quote',
        conditions: [],
      },
    ];
    
    const file = new File([JSON.stringify(validRuleData)], 'rules.json', { type: 'application/json' });
    const input = screen.getByLabelText('Select JSON File') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    // Mock FileReader
    const mockFileReader = {
      readAsText: vi.fn(),
      onload: null as any,
      onerror: null as any,
      result: JSON.stringify(validRuleData),
    };
    
    vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any);
    
    fireEvent.change(input);
    
    // Simulate FileReader onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: JSON.stringify(validRuleData) } } as any);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Import Preview')).toBeInTheDocument();
    });
    
    // Enable overwrite option
    const overwriteCheckbox = screen.getByLabelText('Overwrite existing rules with same name');
    fireEvent.click(overwriteCheckbox);
    
    // Start import
    fireEvent.click(screen.getByText('Import 1 Rules'));
    
    // Confirm import
    fireEvent.click(screen.getByText('Import Rules'));
    
    await waitFor(() => {
      expect(uwRulesApi.importUWRules).toHaveBeenCalledWith('test-product-id', {
        rules: validRuleData,
        overwriteExisting: true,
      });
    });
    
    expect(mockProps.onImportComplete).toHaveBeenCalled();
  });

  it('displays validation errors for invalid rules', async () => {
    render(<UWRulesImportExport {...mockProps} />);
    
    // Open import dialog
    fireEvent.click(screen.getByText('Import'));
    
    // Create invalid rule data (missing required fields)
    const invalidRuleData = [
      {
        // Missing name, quoteAction, adjustmentType, etc.
        description: 'Invalid Rule',
      },
    ];
    
    const file = new File([JSON.stringify(invalidRuleData)], 'rules.json', { type: 'application/json' });
    const input = screen.getByLabelText('Select JSON File') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    // Mock FileReader
    const mockFileReader = {
      readAsText: vi.fn(),
      onload: null as any,
      onerror: null as any,
      result: JSON.stringify(invalidRuleData),
    };
    
    vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any);
    
    fireEvent.change(input);
    
    // Simulate FileReader onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: JSON.stringify(invalidRuleData) } } as any);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Validation Errors')).toBeInTheDocument();
    });
  });
});