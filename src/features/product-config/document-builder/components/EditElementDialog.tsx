import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bold, Italic, Underline, Plus, X } from 'lucide-react';
import { RatingParameter, DocumentElement } from '../types';
import {
  getMacros,
  Macro,
} from '@/features/product-config/document-builder/api/document-configurator';

interface EditElementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  element: DocumentElement | null;
  onUpdateElement: (element: DocumentElement) => void;
  onSave: () => void;
  ratingParameters: RatingParameter[];
  productId?: string | null;
  currency?: string | null;
}

export const EditElementDialog: React.FC<EditElementDialogProps> = ({
  open,
  onOpenChange,
  element,
  onUpdateElement,
  onSave,
  ratingParameters,
  productId,
  currency,
}) => {
  const [macros, setMacros] = React.useState<Macro[]>([]);
  useEffect(() => {
    const fetchMacros = async () => {
      if (!productId) return;
      try {
        const data = await getMacros(productId);
        setMacros(data || []);
      } catch (e) {
        setMacros([]);
      }
    };
    fetchMacros();
  }, [productId]);

  if (!element) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Element</DialogTitle>
          <DialogDescription>Configure the element properties.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {element.type === 'title' && (
            <>
              <div className="space-y-2">
                <Label>Title Text</Label>
                <Input
                  value={element.title || ''}
                  onChange={(e) =>
                    onUpdateElement({
                      ...element,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g., Project Type: {{field}}"
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{{ field }}'} to insert a field value
                </p>
              </div>
              <div className="space-y-2">
                <Label>Select Field</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={element.fieldId || ''}
                  onChange={(e) => {
                    const fieldId = e.target.value;
                    const param = ratingParameters.find((p) => p.id === fieldId);
                    onUpdateElement({
                      ...element,
                      fieldId: fieldId || undefined,
                      title:
                        element.title?.replace(
                          /\{\{field\}\}/g,
                          param ? `{{${param.name}}}` : '{{field}}',
                        ) || (param ? `Title: {{${param.name}}}` : 'Title: {{field}}'),
                    });
                  }}
                >
                  <option value="">Select a field</option>
                  {ratingParameters.map((param) => (
                    <option key={param.id} value={param.id}>
                      {param.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          {element.type === 'heading' && (
            <div className="space-y-2">
              <Label>Heading Text</Label>
              <Input
                value={element.content || ''}
                onChange={(e) =>
                  onUpdateElement({
                    ...element,
                    content: e.target.value,
                  })
                }
                placeholder="Enter heading text"
              />
              <p className="text-xs text-muted-foreground">
                You can use {'{{fieldName}}'} to insert field values
              </p>
            </div>
          )}
          {element.type === 'paragraph' && (
            <div className="space-y-2">
              <Label>Paragraph Text</Label>
              <Textarea
                value={element.content || ''}
                onChange={(e) =>
                  onUpdateElement({
                    ...element,
                    content: e.target.value,
                  })
                }
                rows={6}
                placeholder="Enter paragraph text. Use {{fieldName}} to insert field values."
              />
              <p className="text-xs text-muted-foreground">
                You can use {'{{fieldName}}'} to insert field values
              </p>
            </div>
          )}
          {element.type === 'text' && (
            <div className="space-y-2">
              <Label>Text Content</Label>
              <Textarea
                value={element.content || ''}
                onChange={(e) =>
                  onUpdateElement({
                    ...element,
                    content: e.target.value,
                  })
                }
                rows={4}
              />
            </div>
          )}
          {element.type === 'logo' && (
            <div className="space-y-4">
              {/* <div className="space-y-2">
								<Label>Upload Logo</Label>
								<div className="flex items-center gap-2">
									<Input
										type="file"
										accept="image/jpeg,image/jpg,image/png,image/webp"
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) {
												const reader = new FileReader();
												reader.onloadend = () => {
													onUpdateElement({
														...element,
														logoUrl: reader.result as string,
														content: reader.result as string,
													});
												};
												reader.readAsDataURL(file);
											}
										}}
										className="flex-1"
									/>
								</div>
							</div> */}
              {/* <div className="space-y-2">
								<Label>Or Enter Logo URL</Label>
								<Input
									value={element.content || element.logoUrl || ""}
									onChange={(e) =>
										onUpdateElement({
											...element,
											content: e.target.value,
											logoUrl: e.target.value,
										})
									}
									placeholder="https://example.com/logo.png"
								/>
							</div> */}
              {(element.logoUrl || element.content) && (
                <div className="border rounded-lg p-4 flex items-center justify-center bg-muted/20">
                  <img
                    src={element.logoUrl || element.content}
                    alt="Logo preview"
                    className="max-h-32 max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          )}
          {element.type === 'divider' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Divider Style</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={element.dividerStyle || 'solid'}
                  onChange={(e) =>
                    onUpdateElement({
                      ...element,
                      dividerStyle: e.target.value as 'solid' | 'dashed' | 'dotted',
                    })
                  }
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Divider Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={element.textColor || '#e5e7eb'}
                    onChange={(e) =>
                      onUpdateElement({
                        ...element,
                        textColor: e.target.value,
                      })
                    }
                    className="w-16 h-10"
                  />
                  <Input
                    value={element.textColor || '#e5e7eb'}
                    onChange={(e) =>
                      onUpdateElement({
                        ...element,
                        textColor: e.target.value,
                      })
                    }
                    placeholder="#e5e7eb"
                  />
                </div>
              </div>
            </div>
          )}
          {element.type === 'image' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          onUpdateElement({
                            ...element,
                            imageUrl: reader.result as string,
                            content: reader.result as string,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Or Enter Image URL</Label>
                <Input
                  value={element.content || element.imageUrl || ''}
                  onChange={(e) =>
                    onUpdateElement({
                      ...element,
                      content: e.target.value,
                      imageUrl: e.target.value,
                    })
                  }
                  placeholder="https://example.com/image.png"
                />
              </div>
              {(element.imageUrl || element.content) && (
                <div className="border rounded-lg p-4 flex items-center justify-center bg-muted/20">
                  <img
                    src={element.imageUrl || element.content}
                    alt="Image preview"
                    className="max-h-64 max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          )}
          {element.type === 'shape' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Shape Type</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={element.shapeType || 'rectangle'}
                  onChange={(e) =>
                    onUpdateElement({
                      ...element,
                      shapeType: e.target.value as 'rectangle' | 'circle' | 'line' | 'arrow',
                    })
                  }
                >
                  <option value="rectangle">Rectangle</option>
                  <option value="circle">Circle</option>
                  <option value="line">Line</option>
                  <option value="arrow">Arrow</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Shape Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={element.backgroundColor || '#e5e7eb'}
                    onChange={(e) =>
                      onUpdateElement({
                        ...element,
                        backgroundColor: e.target.value,
                      })
                    }
                    className="w-16 h-10"
                  />
                  <Input
                    value={element.backgroundColor || '#e5e7eb'}
                    onChange={(e) =>
                      onUpdateElement({
                        ...element,
                        backgroundColor: e.target.value,
                      })
                    }
                    placeholder="#e5e7eb"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Border Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={element.textColor || '#000000'}
                    onChange={(e) =>
                      onUpdateElement({
                        ...element,
                        textColor: e.target.value,
                      })
                    }
                    className="w-16 h-10"
                  />
                  <Input
                    value={element.textColor || '#000000'}
                    onChange={(e) =>
                      onUpdateElement({
                        ...element,
                        textColor: e.target.value,
                      })
                    }
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          )}
          {element.type === 'signature' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Signature Label</Label>
                <Input
                  value={element.content || 'Signature'}
                  onChange={(e) =>
                    onUpdateElement({
                      ...element,
                      content: e.target.value,
                    })
                  }
                  placeholder="Authorized Signatory"
                />
              </div>
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={element.backgroundColor || '#ffffff'}
                    onChange={(e) =>
                      onUpdateElement({
                        ...element,
                        backgroundColor: e.target.value,
                      })
                    }
                    className="w-16 h-10"
                  />
                  <Input
                    value={element.backgroundColor || '#ffffff'}
                    onChange={(e) =>
                      onUpdateElement({
                        ...element,
                        backgroundColor: e.target.value,
                      })
                    }
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
          )}
          {element.type === 'stamp' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Stamp Label</Label>
                <Input
                  value={element.content || 'Stamp'}
                  onChange={(e) =>
                    onUpdateElement({
                      ...element,
                      content: e.target.value,
                    })
                  }
                  placeholder="Company Stamp"
                />
              </div>
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={element.backgroundColor || '#ffffff'}
                    onChange={(e) =>
                      onUpdateElement({
                        ...element,
                        backgroundColor: e.target.value,
                      })
                    }
                    className="w-16 h-10"
                  />
                  <Input
                    value={element.backgroundColor || '#ffffff'}
                    onChange={(e) =>
                      onUpdateElement({
                        ...element,
                        backgroundColor: e.target.value,
                      })
                    }
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
          )}
          {element.type === 'table' && element.tableData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Table Headers</Label>
                <div className="space-y-2">
                  {element.tableData.headers.map((header, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={header}
                        onChange={(e) => {
                          const newHeaders = [...element.tableData!.headers];
                          newHeaders[idx] = e.target.value;
                          onUpdateElement({
                            ...element,
                            tableData: {
                              ...element.tableData!,
                              headers: newHeaders,
                            },
                          });
                        }}
                        placeholder={`Header ${idx + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newHeaders = element.tableData!.headers.filter((_, i) => i !== idx);
                          const newRows = element.tableData!.rows.map((row) =>
                            row.filter((_, i) => i !== idx),
                          );
                          onUpdateElement({
                            ...element,
                            tableData: {
                              headers: newHeaders,
                              rows: newRows,
                            },
                          });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onUpdateElement({
                        ...element,
                        tableData: {
                          ...element.tableData!,
                          headers: [...element.tableData!.headers, ''],
                          rows: element.tableData!.rows.map((row) => [...row, '']),
                        },
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Column
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Table Rows</Label>
                <div className="space-y-2">
                  {element.tableData.rows.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex gap-2">
                      {row.map((cell, cellIdx) => (
                        <Input
                          key={cellIdx}
                          value={cell}
                          onChange={(e) => {
                            const newRows = [...element.tableData!.rows];
                            newRows[rowIdx] = [...row];
                            newRows[rowIdx][cellIdx] = e.target.value;
                            onUpdateElement({
                              ...element,
                              tableData: {
                                ...element.tableData!,
                                rows: newRows,
                              },
                            });
                          }}
                          placeholder={`Cell ${rowIdx + 1}-${cellIdx + 1}`}
                          className="flex-1"
                        />
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newRows = element.tableData!.rows.filter((_, i) => i !== rowIdx);
                          onUpdateElement({
                            ...element,
                            tableData: {
                              ...element.tableData!,
                              rows: newRows,
                            },
                          });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newRow = new Array(element.tableData!.headers.length).fill('');
                      onUpdateElement({
                        ...element,
                        tableData: {
                          ...element.tableData!,
                          rows: [...element.tableData!.rows, newRow],
                        },
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Row
                  </Button>
                </div>
              </div>
            </div>
          )}
          {element.type === 'field' && (
            <div className="space-y-2">
              <Label>Selected Field</Label>
              <Input
                value={
                  element.fieldId
                    ? ratingParameters.find((p) => p.id === element.fieldId)?.label || ''
                    : ''
                }
                disabled
              />
            </div>
          )}
          {element.type === 'keyValue' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Key/Label Text</Label>
                <Input
                  value={element.keyText || ''}
                  onChange={(e) =>
                    onUpdateElement({
                      ...element,
                      keyText: e.target.value,
                    })
                  }
                  placeholder="e.g., Project Type"
                />
              </div>
              <div className="space-y-2">
                <Label>Select Value Field</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={element.valueFieldId || ''}
                  onChange={(e) =>
                    onUpdateElement({
                      ...element,
                      valueFieldId: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">Select a field</option>
                  {ratingParameters.map((param) => (
                    <option key={param.id} value={param.id}>
                      {param.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Layout</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={element.layout || 'horizontal'}
                  onChange={(e) =>
                    onUpdateElement({
                      ...element,
                      layout: e.target.value as 'horizontal' | 'vertical',
                    })
                  }
                >
                  <option value="horizontal">Left-Right (Key: Value)</option>
                  <option value="vertical">Top-Bottom (Key above Value)</option>
                </select>
              </div>
            </div>
          )}
          {/* Text Formatting Controls */}
          {(element.type === 'heading' ||
            element.type === 'paragraph' ||
            element.type === 'text' ||
            element.type === 'keyValue') && (
            <div className="space-y-4 border-t pt-4">
              <Label className="text-sm font-semibold">Text Formatting</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant={element.isBold ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    onUpdateElement({
                      ...element,
                      isBold: !element.isBold,
                    })
                  }
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant={element.isItalic ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    onUpdateElement({
                      ...element,
                      isItalic: !element.isItalic,
                    })
                  }
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant={element.isUnderline ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    onUpdateElement({
                      ...element,
                      isUnderline: !element.isUnderline,
                    })
                  }
                >
                  <Underline className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Text Color:</Label>
                  <Input
                    type="color"
                    value={element.textColor || '#000000'}
                    onChange={(e) =>
                      onUpdateElement({
                        ...element,
                        textColor: e.target.value,
                      })
                    }
                    className="w-12 h-8"
                  />
                  <Input
                    value={element.textColor || '#000000'}
                    onChange={(e) =>
                      onUpdateElement({
                        ...element,
                        textColor: e.target.value,
                      })
                    }
                    placeholder="#000000"
                    className="w-24 h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
          {/* Background Color */}
          {(element.type === 'heading' ||
            element.type === 'paragraph' ||
            element.type === 'text' ||
            element.type === 'keyValue' ||
            element.type === 'table') && (
            <div className="space-y-2 border-t pt-4">
              <Label>Background Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={element.backgroundColor || '#ffffff'}
                  onChange={(e) =>
                    onUpdateElement({
                      ...element,
                      backgroundColor: e.target.value,
                    })
                  }
                  className="w-16 h-10"
                />
                <Input
                  value={element.backgroundColor || '#ffffff'}
                  onChange={(e) =>
                    onUpdateElement({
                      ...element,
                      backgroundColor: e.target.value,
                    })
                  }
                  placeholder="#ffffff"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onUpdateElement({
                      ...element,
                      backgroundColor: undefined,
                    })
                  }
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
          {(element.type === 'heading' ||
            element.type === 'paragraph' ||
            element.type === 'text') && (
            <div className="space-y-2 border-t pt-4">
              <Label>Select Field to Insert</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const macro = macros.find((m) => m.name === e.target.value);
                    if (macro && element.content !== undefined) {
                      const currentContent = element.content || '';
                      const newContent = currentContent + `{{${macro.name}}}`;
                      onUpdateElement({
                        ...element,
                        content: newContent,
                      });
                      e.target.value = ''; // Reset selection
                    }
                  }
                }}
              >
                <option value="">Insert field at end of text</option>
                {macros.map((m) => {
                  const isStatic = m.type === 'STATIC';
                  const optionLabel =
                    isStatic && m.amountType === 'currency' && currency
                      ? `${m.label} (${currency}) ({{${m.name}}})`
                      : isStatic && m.amountType === 'percentage'
                        ? `${m.label} (%) ({{${m.name}}})`
                        : `${m.label} ({{${m.name}}})`;
                  return (
                    <option key={m.name} value={m.name}>
                      {optionLabel}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-muted-foreground">
                Select a field to insert {'{{fieldName}}'} in the text
              </p>
            </div>
          )}
          <div
            className={`grid grid-cols-2 gap-4 ${element.type !== 'logo' ? 'border-t pt-4' : ''}`}
          >
            <div className="space-y-2">
              <Label>Font Size</Label>
              <Input
                type="number"
                value={element.style?.fontSize || 14}
                onChange={(e) =>
                  onUpdateElement({
                    ...element,
                    style: {
                      ...element.style,
                      fontSize: parseInt(e.target.value) || 14,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Alignment</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={element.style?.alignment || 'left'}
                onChange={(e) =>
                  onUpdateElement({
                    ...element,
                    style: {
                      ...element.style,
                      alignment: e.target.value as 'left' | 'center' | 'right',
                    },
                  })
                }
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width (px) - Leave empty for auto</Label>
              <Input
                type="number"
                value={element.style?.width || ''}
                onChange={(e) =>
                  onUpdateElement({
                    ...element,
                    style: {
                      ...element.style,
                      width: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })
                }
                placeholder="Auto"
              />
            </div>
            <div className="space-y-2">
              <Label>Height (px) - Leave empty for auto</Label>
              <Input
                type="number"
                value={element.style?.height || ''}
                onChange={(e) =>
                  onUpdateElement({
                    ...element,
                    style: {
                      ...element.style,
                      height: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })
                }
                placeholder="Auto"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
