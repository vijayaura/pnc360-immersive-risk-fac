import React from 'react';
import { Button } from '@/components/ui/button';
import { Type, Image, Table, Minus, Signature, Stamp } from 'lucide-react';
import { DocumentElement } from '../types';

interface DocumentElementsSidebarProps {
  onAddElement: (type: DocumentElement['type']) => void;
  selectedSection: 'header' | 'body' | 'footer' | 'preview';
}

export const DocumentElementsSidebar = ({
  onAddElement,
  selectedSection,
}: DocumentElementsSidebarProps) => {
  return (
    <div className="w-80 border-r bg-muted/20 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold mb-3">Add Elements</h3>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => onAddElement('heading')}
        >
          <Type className="w-4 h-4 mr-2" />
          Heading
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => onAddElement('paragraph')}
        >
          <Type className="w-4 h-4 mr-2" />
          Paragraph
        </Button>
        {selectedSection === 'footer' && (
          <>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onAddElement('signature')}
            >
              <Signature className="w-4 h-4 mr-2" />
              Signature
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onAddElement('stamp')}
            >
              <Stamp className="w-4 h-4 mr-2" />
              Stamp
            </Button>
          </>
        )}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => onAddElement('logo')}
        >
          <Image className="w-4 h-4 mr-2" />
          Logo
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => onAddElement('text')}
        >
          <Type className="w-4 h-4 mr-2" />
          Text Box
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => onAddElement('keyValue')}
        >
          <Type className="w-4 h-4 mr-2" />
          Key-Value Pair
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => onAddElement('divider')}
        >
          <Minus className="w-4 h-4 mr-2" />
          Line Divider
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => onAddElement('table')}
        >
          <Table className="w-4 h-4 mr-2" />
          Table
        </Button>
      </div>
    </div>
  );
};
