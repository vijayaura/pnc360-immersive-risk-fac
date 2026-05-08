import {
  DocumentElement,
  DocumentTemplate,
  ElementType,
} from "../types";
import { BackendDocumentTemplate } from '@/features/product-config/document-builder/api/document-configurator';

export type Block = {
  id: string;
  type: ElementType;
  data?: DocumentElement;
  styles?: Record<string, unknown>;
};

export function blockToElement(b: Block): DocumentElement {
  return {
    ...b.data,
    id: b.id,
    type: b.type as ElementType,
    style: b.styles || (b.data as any)?.style || {},
  } as DocumentElement;
}

export function elementToBlock(el: DocumentElement): Block {
  return {
    id: el.id,
    type: el.type,
    data: el,
    styles: el.style || {},
  };
}

export function mapBackendTemplate(
  tpl: BackendDocumentTemplate
): DocumentTemplate {
  return {
    id: tpl.id,
    type: tpl.documentType,
    name: tpl.name,
    description: tpl.description,
    header: (tpl.header || []).map(blockToElement),
    body: (tpl.body || []).map(blockToElement),
    footer: (tpl.footer || []).map(blockToElement),
    createdAt: tpl.createdAt,
    updatedAt: tpl.updatedAt,
  };
}

