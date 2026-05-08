import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, X } from 'lucide-react';
import { DocumentElement, RatingParameter } from '../../types';

interface DocumentSectionEditorProps {
  sectionName: string;
  elements: DocumentElement[];
  ratingParameters: RatingParameter[];
  onEditElement: (element: DocumentElement) => void;
  onDeleteElement: (elementId: string) => void;
  onResizeStart: (
    e: React.MouseEvent,
    elementId: string,
    currentWidth: number,
    side: 'left' | 'right',
  ) => void;
  onAddElementDirectly: () => void;
}

export const DocumentSectionEditor = ({
  sectionName,
  elements,
  ratingParameters,
  onEditElement,
  onDeleteElement,
  onResizeStart,
  onAddElementDirectly,
}: DocumentSectionEditorProps) => {
  return (
    <div className="flex-1 p-6 overflow-auto bg-muted/20">
      <div
        className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
        style={{ minHeight: '800px' }}
      >
        {/* Document-like Editor */}
        <div
          className="p-10 space-y-4"
          contentEditable={false}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {elements.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
              <div className="text-center">
                <p className="mb-2 font-medium">No content in {sectionName} section</p>
                <p className="text-xs">Click on fields or add elements to start designing</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-2">
              {elements.map((element) => {
                const param =
                  element.type === 'field' && element.fieldId
                    ? ratingParameters.find((p) => p.id === element.fieldId)
                    : null;
                const columnSpan = element.columnSpan || 12;

                return (
                  <div
                    key={element.id}
                    className={`group relative border border-transparent hover:border-primary/50 rounded-lg p-3 transition-all`}
                    style={{
                      gridColumn: `span ${columnSpan}`,
                      minHeight: element.style?.height || 'auto',
                      backgroundColor: element.backgroundColor || 'transparent',
                      color: element.textColor || undefined,
                    }}
                    onClick={(e) => {
                      // Don't open dialog if clicking on resize handles or buttons
                      if ((e.target as HTMLElement).closest('.resize-handle, .action-button')) {
                        return;
                      }
                      onEditElement(element);
                    }}
                  >
                    {/* Left Resize Handle */}
                    <div
                      className="resize-handle absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-12 cursor-ew-resize bg-primary/40 hover:bg-primary/60 rounded border-2 border-primary/70 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center shadow-lg"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onResizeStart(e, element.id, element.style?.width || 300, 'left');
                      }}
                      style={{ cursor: 'ew-resize' }}
                    >
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-4 bg-white rounded"></div>
                        <div className="w-0.5 h-4 bg-white rounded"></div>
                      </div>
                    </div>
                    {/* Right Resize Handle */}
                    <div
                      className="resize-handle absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-12 cursor-ew-resize bg-primary/40 hover:bg-primary/60 rounded border-2 border-primary/70 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center shadow-lg"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onResizeStart(e, element.id, element.style?.width || 300, 'right');
                      }}
                      style={{ cursor: 'ew-resize' }}
                    >
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-4 bg-white rounded"></div>
                        <div className="w-0.5 h-4 bg-white rounded"></div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity z-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditElement(element);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteElement(element.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    {element.type === 'heading' && (
                      <h2
                        className="text-xl font-bold mb-2"
                        style={{
                          fontSize: element.style?.fontSize || 20,
                          textAlign: element.style?.alignment || 'left',
                          fontWeight: element.isBold ? 'bold' : 'normal',
                          fontStyle: element.isItalic ? 'italic' : 'normal',
                          textDecoration: element.isUnderline ? 'underline' : 'none',
                          color: element.textColor || undefined,
                        }}
                      >
                        {element.content || 'Heading'}
                      </h2>
                    )}

                    {element.type === 'paragraph' && (
                      <p
                        className="text-sm leading-relaxed"
                        style={{
                          fontSize: element.style?.fontSize || 14,
                          textAlign: element.style?.alignment || 'left',
                          fontWeight: element.isBold ? 'bold' : 'normal',
                          fontStyle: element.isItalic ? 'italic' : 'normal',
                          textDecoration: element.isUnderline ? 'underline' : 'none',
                          color: element.textColor || undefined,
                        }}
                      >
                        {element.htmlContent || element.content || 'Paragraph text'}
                      </p>
                    )}

                    {element.type === 'field' && param && (
                      <div className="inline-block px-2 py-1 bg-primary/10 border border-primary/30 rounded font-mono text-sm">
                        {`{{${param.name}}}`}
                      </div>
                    )}

                    {element.type === 'logo' && (
                      <div className="h-16 w-32 bg-muted border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center overflow-hidden">
                        {element.logoUrl || element.content ? (
                          <img
                            src={element.logoUrl || element.content}
                            alt="Logo"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">LOGO</span>
                        )}
                      </div>
                    )}

                    {element.type === 'table' && element.tableData && (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-primary/10">
                            <tr>
                              {element.tableData.headers.map((header, idx) => (
                                <th key={idx} className="text-left p-3 font-semibold">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {element.tableData.rows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="border-b">
                                {row.map((cell, cellIdx) => (
                                  <td key={cellIdx} className="p-3">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {element.type === 'divider' && (
                      <div
                        className="w-full"
                        style={{
                          borderTop: `2px ${
                            element.dividerStyle || 'solid'
                          } ${element.textColor || '#e5e7eb'}`,
                          margin: '8px 0',
                        }}
                      />
                    )}
                    {element.type === 'shape' && (
                      <div
                        style={{
                          width: '100%',
                          height: element.style?.height || 100,
                          backgroundColor: element.backgroundColor || '#e5e7eb',
                          border: `2px solid ${element.textColor || '#000000'}`,
                          borderRadius: element.shapeType === 'circle' ? '50%' : '4px',
                        }}
                      />
                    )}
                    {element.type === 'image' && (
                      <div className="border rounded-lg overflow-hidden">
                        {element.imageUrl || element.content ? (
                          <img
                            src={element.imageUrl || element.content}
                            alt="Image"
                            className="max-w-full h-auto"
                          />
                        ) : (
                          <div className="h-32 w-full bg-muted border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">IMAGE</span>
                          </div>
                        )}
                      </div>
                    )}
                    {element.type === 'signature' && (
                      <div
                        className="border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center"
                        style={{
                          width: '100%',
                          height: element.style?.height || 80,
                          backgroundColor: element.backgroundColor || 'transparent',
                        }}
                      >
                        <span className="text-sm text-muted-foreground">
                          {element.content || 'Signature Line'}
                        </span>
                      </div>
                    )}
                    {element.type === 'stamp' && (
                      <div
                        className="border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center"
                        style={{
                          width: '100%',
                          height: element.style?.height || 80,
                          backgroundColor: element.backgroundColor || 'transparent',
                        }}
                      >
                        <span className="text-sm text-muted-foreground">
                          {element.content || 'Stamp'}
                        </span>
                      </div>
                    )}
                    {element.type === 'text' && (
                      <div
                        className="text-sm"
                        style={{
                          fontSize: element.style?.fontSize || 14,
                          textAlign: element.style?.alignment || 'left',
                          fontWeight: element.isBold ? 'bold' : 'normal',
                          fontStyle: element.isItalic ? 'italic' : 'normal',
                          textDecoration: element.isUnderline ? 'underline' : 'none',
                          color: element.textColor || undefined,
                        }}
                      >
                        {element.content || 'Text content'}
                      </div>
                    )}
                    {element.type === 'keyValue' &&
                      (() => {
                        const valueParam = element.valueFieldId
                          ? ratingParameters.find((p) => p.id === element.valueFieldId)
                          : null;
                        const isHorizontal = element.layout === 'horizontal';

                        return (
                          <div
                            className={`flex ${
                              isHorizontal ? 'flex-row items-center gap-3' : 'flex-col gap-1'
                            }`}
                          >
                            <span
                              className="font-semibold text-sm"
                              style={{
                                fontSize: element.style?.fontSize || 14,
                                fontWeight: element.isBold ? 'bold' : 'normal',
                                fontStyle: element.isItalic ? 'italic' : 'normal',
                                textDecoration: element.isUnderline ? 'underline' : 'none',
                                color: element.textColor || undefined,
                              }}
                            >
                              {element.keyText || 'Label'}:
                            </span>
                            <span
                              className="text-sm font-mono bg-primary/10 border border-primary/30 rounded px-2 py-1"
                              style={{
                                fontSize: element.style?.fontSize || 14,
                                color: element.textColor || undefined,
                              }}
                            >
                              {valueParam ? `{{${valueParam.name}}}` : '{{field}}'}
                            </span>
                          </div>
                        );
                      })()}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add new element button */}
          <Button variant="outline" className="w-full border-dashed" onClick={onAddElementDirectly}>
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>
    </div>
  );
};
