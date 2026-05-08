import React, { useState, useEffect } from "react";
import type {
	DocumentTemplate,
	DocumentElement,
	RatingParameter,
	ElementType,
} from "../types";

interface DocumentPreviewProps {
	template: DocumentTemplate;
	parameters: RatingParameter[];
	values?: Record<string, string | number | boolean>;
	hiddenTypes?: ElementType[];
}

export const DocumentPreview = ({
	template,
	parameters,
	values,
	hiddenTypes,
}: DocumentPreviewProps) => {
	const [previewData, setPreviewData] = useState<Record<string, string>>({});

	useEffect(() => {
		const next: Record<string, string> = {};
		if (values) {
			for (const key of Object.keys(values)) {
				const v = values[key];
				next[key] = v === undefined || v === null ? "" : String(v);
			}
		}
		parameters.forEach((param) => {
			if (!(param.name in next)) {
				next[param.name] = "";
			}
		});
		setPreviewData(next);
	}, [parameters, values]);

	const replacePlaceholders = (text: string) => {
		if (!text) return "";
		return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
			// Check if key exists in previewData
			if (previewData[key]) {
				return previewData[key];
			}
			return match;
		});
	};

	const renderElement = (element: DocumentElement) => {
		if (hiddenTypes && hiddenTypes.includes(element.type)) {
			return null;
		}
		const columnSpan = element.columnSpan || 12;

		return (
			<div
				key={element.id}
				className="relative p-1"
				style={{
					gridColumn: `span ${columnSpan}`,
					minHeight: element.style?.height || "auto",
					backgroundColor: element.backgroundColor || "transparent",
					color: element.textColor || undefined,
				}}
			>
				{element.type === "heading" && (
					<h2
						style={{
							fontSize: element.style?.fontSize || 20,
							textAlign: element.style?.alignment || "left",
							fontWeight: element.isBold ? "bold" : "normal",
							fontStyle: element.isItalic ? "italic" : "normal",
							textDecoration: element.isUnderline ? "underline" : "none",
							color: element.textColor || undefined,
						}}
					>
						{replacePlaceholders(element.content || "")}
					</h2>
				)}

				{element.type === "paragraph" && (
					<p
						className="whitespace-pre-wrap"
						style={{
							fontSize: element.style?.fontSize || 14,
							textAlign: element.style?.alignment || "left",
							fontWeight: element.isBold ? "bold" : "normal",
							fontStyle: element.isItalic ? "italic" : "normal",
							textDecoration: element.isUnderline ? "underline" : "none",
							color: element.textColor || undefined,
						}}
					>
						{replacePlaceholders(element.content || element.htmlContent || "")}
					</p>
				)}

				{element.type === "text" && (
					<div
						className="whitespace-pre-wrap"
						style={{
							fontSize: element.style?.fontSize || 14,
							textAlign: element.style?.alignment || "left",
							fontWeight: element.isBold ? "bold" : "normal",
							fontStyle: element.isItalic ? "italic" : "normal",
							textDecoration: element.isUnderline ? "underline" : "none",
							color: element.textColor || undefined,
						}}
					>
						{replacePlaceholders(element.content || "")}
					</div>
				)}

				{element.type === "field" && element.fieldId && (
					<span className="font-medium">
						{(() => {
							const param = parameters.find((p) => p.id === element.fieldId);
							return param ? previewData[param.name] || `[${param.label}]` : "";
						})()}
					</span>
				)}

				{element.type === "keyValue" &&
					(() => {
						const valueParam = element.valueFieldId
							? parameters.find((p) => p.id === element.valueFieldId)
							: null;
						const isHorizontal = element.layout === "horizontal";
						const value = valueParam
							? previewData[valueParam.name] || `[${valueParam.label}]`
							: "";

						return (
							<div
								className={`flex ${
									isHorizontal
										? "flex-row items-center gap-2"
										: "flex-col gap-1"
								}`}
							>
								<span
									className="font-semibold"
									style={{
										fontSize: element.style?.fontSize || 14,
										fontWeight: element.isBold ? "bold" : "normal",
										fontStyle: element.isItalic ? "italic" : "normal",
										textDecoration: element.isUnderline ? "underline" : "none",
										color: element.textColor || undefined,
									}}
								>
									{element.keyText || "Label"}:
								</span>
								<span style={{ fontSize: element.style?.fontSize || 14 }}>
									{value}
								</span>
							</div>
						);
					})()}

				{element.type === "logo" && (
					<div
						className="flex"
						style={{
							justifyContent: (() => {
								const pos =
									(previewData["logoPosition"] as string) ||
									(element.style?.alignment as string) ||
									"left";
								return pos === "center"
									? "center"
									: pos === "right"
									? "flex-end"
									: "flex-start";
							})(),
						}}
					>
						{element.logoUrl || element.content ? (
							<img
								src={replacePlaceholders(
									String(element.logoUrl || element.content || "")
								)}
								alt="Logo"
								style={{
									width: element.style?.width || 150,
									height: element.style?.height || "auto",
									objectFit: "contain",
								}}
							/>
						) : (
							<div
								className="bg-muted flex items-center justify-center text-xs text-muted-foreground border border-dashed"
								style={{
									width: element.style?.width || 150,
									height: element.style?.height || 80,
								}}
							>
								LOGO
							</div>
						)}
					</div>
				)}

				{element.type === "image" && (
					<div
						className="flex"
						style={{
							justifyContent:
								element.style?.alignment === "center"
									? "center"
									: element.style?.alignment === "right"
									? "flex-end"
									: "flex-start",
						}}
					>
						{element.imageUrl || element.content ? (
							<img
								src={replacePlaceholders(
									String(element.imageUrl || element.content || "")
								)}
								alt="Image"
								style={{
									maxWidth: "100%",
									height: "auto",
									...element.style,
								}}
							/>
						) : (
							<div className="bg-muted flex items-center justify-center text-xs text-muted-foreground border border-dashed p-4 w-full h-32">
								IMAGE
							</div>
						)}
					</div>
				)}

				{element.type === "divider" && (
					<div
						className="w-full"
						style={{
							borderTop: `2px ${element.dividerStyle || "solid"} ${
								element.textColor || "#e5e7eb"
							}`,
							margin: "8px 0",
						}}
					/>
				)}

				{element.type === "shape" && (
					<div
						style={{
							width: "100%",
							height: element.style?.height || 100,
							backgroundColor: element.backgroundColor || "#e5e7eb",
							border: `2px solid ${element.textColor || "#000000"}`,
							borderRadius: element.shapeType === "circle" ? "50%" : "4px",
						}}
					/>
				)}

				{element.type === "signature" && (
					<div
						className="flex flex-col items-start gap-2"
						style={{
							width: element.style?.width || 300,
							minHeight: element.style?.height || "auto",
						}}
					>
						{(() => {
							const align =
								(element.style?.alignment as string | undefined) || "left";
							return (
								<span
									className="text-sm font-medium"
									style={{
										textAlign:
											align === "center"
												? "center"
												: align === "right"
												? "right"
												: "left",
										width: "100%",
									}}
								>
									{previewData["signatoryTitle"] ||
										replacePlaceholders(element.content || "Title")}
								</span>
							);
						})()}
						{previewData["signatureImageUrl"] ? (
							<img
								src={previewData["signatureImageUrl"]}
								alt="Signature"
								style={{
									maxWidth: "100%",
									width: element.style?.width || "100%",
									maxHeight:
										typeof element.style?.height === "number"
											? Math.max(40, (element.style?.height as number) - 30)
											: 80,
									height: "auto",
									objectFit: "contain",
								}}
							/>
						) : (
							<div className="border-b border-black w-full" />
						)}
						<span className="text-sm">
							{previewData["authorizedSignatory"] || "Authorized Signatory"}
						</span>
					</div>
				)}
				{element.type === "stamp" && (
					<div
						className="flex flex-col items-center gap-2"
						style={{
							width: element.style?.width || 120,
							minHeight: element.style?.height || 80,
							backgroundColor: element.backgroundColor || "transparent",
						}}
					>
						{previewData["stampImageUrl"] ? (
							<img
								src={previewData["stampImageUrl"]}
								alt="Stamp"
								style={{
									maxWidth: "100%",
									width: element.style?.width || 120,
									maxHeight:
										typeof element.style?.height === "number"
											? Math.max(40, (element.style?.height as number) - 30)
											: 80,
									height: "auto",
									objectFit: "contain",
								}}
							/>
						) : (
							<div
								className="border-2 border-dashed border-muted-foreground/40 rounded flex items-center justify-center"
								style={{
									width: "100%",
									height: element.style?.height || 80,
								}}
							>
								<span className="text-sm text-muted-foreground">
									{replacePlaceholders(element.content || "Stamp")}
								</span>
							</div>
						)}
						<span className="text-sm text-muted-foreground">
							{previewData["stampLabel"] ||
								replacePlaceholders(element.content || "Stamp")}
						</span>
					</div>
				)}

				{element.type === "table" && element.tableData && (
					<div className="w-full overflow-hidden border rounded-lg">
						<table className="w-full text-sm">
							<thead className="bg-muted/50">
								<tr>
									{element.tableData.headers.map((header, idx) => (
										<th
											key={idx}
											className="p-3 text-left font-semibold border-b"
										>
											{replacePlaceholders(header)}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{element.tableData.rows.map((row, rowIdx) => (
									<tr key={rowIdx} className="border-b last:border-0">
										{row.map((cell, cellIdx) => (
											<td key={cellIdx} className="p-3">
												{replacePlaceholders(cell)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="flex h-full">
			{/* Preview Area */}
			<div className="flex-1 bg-muted/20 p-8 overflow-y-auto">
				<div className="max-w-[210mm] mx-auto bg-white shadow-xl min-h-[297mm] p-[20mm] flex flex-col">
					{/* Header */}
					{(() => {
						const headerBg =
							(typeof values?.headerBgColor === "string" &&
								values?.headerBgColor) ||
							undefined;
						const headerText =
							headerBg && typeof values?.headerTextColor === "string"
								? (values?.headerTextColor as string)
								: undefined;
						return (
							<div
								className="mb-8 grid grid-cols-12 gap-4"
								style={{
									backgroundColor: headerBg,
									color: headerText,
								}}
							>
								{template.header.map(renderElement)}
							</div>
						);
					})()}

					{/* Body */}
					<div className="flex-1 grid grid-cols-12 gap-4 content-start">
						{template.body.map(renderElement)}
					</div>

					{/* Footer */}
					{(() => {
						const footerBg =
							(typeof values?.footerBgColor === "string" &&
								values?.footerBgColor) ||
							undefined;
						const footerText =
							footerBg && typeof values?.footerTextColor === "string"
								? (values?.footerTextColor as string)
								: undefined;
						return (
							<div
								className="mt-8 pt-8 border-t grid grid-cols-12 gap-4"
								style={{
									backgroundColor: footerBg,
									color: footerText,
								}}
							>
								{template.footer.map(renderElement)}
							</div>
						);
					})()}
				</div>
			</div>
		</div>
	);
};
