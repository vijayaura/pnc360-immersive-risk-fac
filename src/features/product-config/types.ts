export interface RatingParameter {
	id: string;
	name: string;
	label: string;
	type: "text" | "number" | "dropdown" | "date" | "checkbox" | "multiselect";
}

export type SectionSelectionType = "preview" | "header" | "body" | "footer";

export type ElementType =
	| "field"
	| "logo"
	| "text"
	| "table"
	| "title"
	| "paragraph"
	| "heading"
	| "keyValue"
	| "divider"
	| "spacer"
	| "shape"
	| "image"
	| "signature"
	| "stamp";

export interface DocumentElement {
	id: string;
	type: ElementType;
	content?: string; // For text, logo URL, title text, etc.
	fieldId?: string; // For rating parameter fields
	title?: string; // For title with field
	htmlContent?: string; // For rich text content with fields
	keyText?: string; // For key-value pairs
	valueFieldId?: string; // For key-value pairs
	layout?: "horizontal" | "vertical"; // For key-value pairs: left-right or top-bottom
	logoUrl?: string; // For logo elements
	backgroundColor?: string; // Background color
	textColor?: string; // Text color
	isBold?: boolean; // Bold text
	isItalic?: boolean; // Italic text
	isUnderline?: boolean; // Underline text
	dividerStyle?: "solid" | "dashed" | "dotted"; // For divider elements
	tableData?: { headers: string[]; rows: string[][] }; // For table elements
	shapeType?: "rectangle" | "circle" | "line" | "arrow"; // For shape elements
	imageUrl?: string; // For image elements
	position?: { x: number; y: number }; // For absolute positioning
	columnSpan?: number; // For grid layout - how many columns this element spans
	rowSpan?: number; // For grid layout - how many rows this element spans
	style?: {
		fontSize?: number;
		fontWeight?: string;
		color?: string;
		alignment?: "left" | "center" | "right";
		width?: number;
		height?: number;
	};
}

export interface DocumentTemplate {
	id: string;
	type?: "quote" | "policy" | "endorsement";
	name: string;
	description?: string;
	header: DocumentElement[];
	body: DocumentElement[];
	footer: DocumentElement[];
	createdAt: string;
	updatedAt: string;
}
