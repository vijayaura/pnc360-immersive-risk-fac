import type {
  Product,
  ProductSection,
  ProductCover,
  ProductType,
} from '@/features/product-config/api/products';

export type UiProductTypeLabel = 'Single Cover' | 'Multi Cover';

export type ProductStructureMode = 'single' | 'multi';

export interface UiProductStructureCover {
  id: string;
  title: string;
  createdAt: string;
  ratingStructureDone?: boolean;
  reinsuranceSetupDone?: boolean;
  riskCategorisationId?: string;
  riskCategoryId?: string;
}

export interface UiProductStructureSection {
  id: string;
  title: string;
  createdBy: string;
  createdAt: string;
  covers: UiProductStructureCover[];
}

/** Single-cover UX still persists as Multi Cover with one section and one cover (explicit cover entity). */
export const uiModeToBackendProductType = (_mode: ProductStructureMode): ProductType => 'Multi Cover';

export const backendProductTypeToMode = (
  productType?: ProductType | string | null,
): ProductStructureMode => {
  if (
    productType === 'MULTI_COVER' ||
    productType === 'Multi Cover' ||
    productType === 'MULTI COVER'
  ) {
    return 'multi';
  }
  return 'single';
};

export const backendProductTypeToLabel = (
  productType?: ProductType | string | null,
): UiProductTypeLabel =>
  backendProductTypeToMode(productType) === 'multi' ? 'Multi Cover' : 'Single Cover';

export const createDefaultSingleCoverStructure = (): UiProductStructureSection[] => {
  const ts = Date.now();
  return [
    {
      id: `section-${ts}`,
      title: 'New Section',
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
      covers: [
        {
          id: `cover-${ts}`,
          title: 'New Cover',
          createdAt: new Date().toISOString(),
          ratingStructureDone: false,
          reinsuranceSetupDone: false,
        },
      ],
    },
  ];
};

/** True when UI has a structure to persist (both single- and multi-cover layouts use section payloads). */
export const shouldPersistSectionsFromUi = (
  mode: ProductStructureMode,
  sections: UiProductStructureSection[],
): boolean =>
  (mode === 'multi' || mode === 'single') && sections.length > 0;

/** One section + one cover → Single Cover tab; anything else → Multi Cover tab. */
export const inferStructureModeFromSections = (
  sections: UiProductStructureSection[],
): ProductStructureMode =>
  sections.length === 1 && (sections[0]?.covers?.length ?? 0) === 1 ? 'single' : 'multi';

export const buildSectionsPayloadFromUi = (
  mode: ProductStructureMode,
  sections: UiProductStructureSection[],
): ProductSection[] | undefined => {
  if (!shouldPersistSectionsFromUi(mode, sections)) return undefined;

  return sections.map<ProductSection>((s, index) => ({
    id: s.id.startsWith('section-') ? undefined : s.id,
    name: s.title,
    order: index + 1,
    covers: s.covers.map<ProductCover>((c, coverIndex) => ({
      id: c.id.startsWith('cover-') ? undefined : c.id,
      name: c.title,
      code:
        c.title.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '') ||
        'COVER',
      order: coverIndex + 1,
      riskCategorisationId: c.riskCategorisationId,
      riskCategoryId: c.riskCategoryId,
    })),
  }));
};

export const mapProductToUiStructure = (
  product: Product,
  options?: { coverIdsWithFormula?: Set<string> },
): {
  mode: ProductStructureMode;
  sections: UiProductStructureSection[];
} => {
  const mode = backendProductTypeToMode(product.productType);
  const coverIdsWithFormula = options?.coverIdsWithFormula ?? new Set<string>();

  const sections: UiProductStructureSection[] = (product.sections ?? []).map((s) => ({
    id: s.id ?? `section-${Date.now()}`,
    title: s.name,
    createdBy: '',
    createdAt: new Date().toISOString(),
    covers: [...(s.covers ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((c) => ({
      id: c.id ?? `cover-${Date.now()}`,
      title: c.name,
      createdAt: c.createdAt ?? new Date().toISOString(),
      ratingStructureDone: c.id ? coverIdsWithFormula.has(c.id) : false,
      reinsuranceSetupDone: false,
      riskCategorisationId: c.riskCategorisationId,
      riskCategoryId: c.riskCategoryId,
    })),
  }));

  return { mode, sections };
};

