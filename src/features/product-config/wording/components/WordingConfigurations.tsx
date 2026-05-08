import React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Upload, FileText, X, Eye, Edit } from "lucide-react";
import type { PolicyWording } from '@/features/insurers/api/insurers';

type Props = {
	policyWordingsError: string | null;
	isLoadingPolicyWordings: boolean;
	openUploadDialog: () => void;
	policyWordings: Array<PolicyWording & { id?: string }>;
	openEditDialog: (w: PolicyWording & { id?: string }) => void;
	isWordingUploadDialogOpen: boolean;
	setIsWordingUploadDialogOpen: (open: boolean) => void;
	editingWording: (PolicyWording & { id?: string }) | null;
	wordingUploadTitle: string;
	setWordingUploadTitle: (v: string) => void;
	handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	wordingUploadFile: File | null;
	wordingUploadActive: boolean;
	setWordingUploadActive: (v: boolean) => void;
	handleSavePolicyWording: () => Promise<void> | void;
	isUploadingWording: boolean;
	isUploadingFile: boolean;
	handleToggleWordingActive: (
		wording: PolicyWording & { id?: string },
		isActive: boolean
	) => Promise<void>;
	onDeleteWording: (w: PolicyWording & { id?: string }) => void | Promise<void>;
	onViewWording: (w: PolicyWording & { id?: string }) => void | Promise<void>;
};

export default function WordingConfigurations(props: Props) {
	const {
		policyWordingsError,
		isLoadingPolicyWordings,
		openUploadDialog,
		policyWordings,
		openEditDialog,
		isWordingUploadDialogOpen,
		setIsWordingUploadDialogOpen,
		editingWording,
		wordingUploadTitle,
		setWordingUploadTitle,
		handleFileUpload,
		wordingUploadFile,
		wordingUploadActive,
		setWordingUploadActive,
		handleSavePolicyWording,
		isUploadingWording,
		isUploadingFile,
		handleToggleWordingActive,
		onDeleteWording,
		onViewWording,
	} = props;

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-semibold text-foreground">
						Policy Wording Documents
					</h2>
					<p className="text-muted-foreground">
						Upload and manage policy wording documents
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						onClick={openUploadDialog}
						className="gap-2"
					>
						<Upload className="w-4 h-4" />
						Add Document
					</Button>
				</div>
			</div>

			{!policyWordings?.length && !isLoadingPolicyWordings && (
				<div className="rounded-md border border-primary/20 bg-primary/5 text-primary px-4 py-3 mb-4">
					<p className="font-medium">Yet to configure this section</p>
					<p className="text-sm mt-1">
						Upload policy wording documents using the button above.
					</p>
				</div>
			)}

			{/* Uploaded Policy Wordings Section */}
			<div className="space-y-4">
				<h3 className="text-lg font-medium text-foreground">
					Uploaded Policy Wordings
				</h3>

				{isLoadingPolicyWordings ? (
					<div className="space-y-4">
						{[1, 2].map((i) => (
							<div key={i} className="p-6 border rounded-lg">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
										<div className="space-y-2">
											<div className="w-48 h-5 bg-gray-200 rounded animate-pulse" />
											<div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
										</div>
									</div>
									<div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="space-y-4">
						{policyWordings.map((wording, index) => (
							<div key={index} className="p-6 border rounded-lg bg-card">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
											<FileText className="w-5 h-5 text-primary" />
										</div>
										<div>
											<h4 className="font-medium text-foreground">
												{wording.label}
											</h4>
											<p className="text-sm text-muted-foreground">
												{wording.is_active ? "Active" : "Inactive"}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-4">
										<div className="flex items-center gap-2">
											<span className="text-sm text-muted-foreground">
												{wording.is_active ? "Active" : "Inactive"}
											</span>
											<Switch
												checked={wording.is_active}
												onCheckedChange={(checked) => {
													handleToggleWordingActive(wording, checked);
												}}
											/>
										</div>
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												className="gap-1"
												onClick={() => onViewWording(wording)}
											>
												<Eye className="w-4 h-4" />
												View
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => openEditDialog(wording)}
												className="gap-1"
											>
												<Edit className="w-4 h-4" />
												Edit
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
												onClick={() => onDeleteWording(wording)}
											>
												Delete
											</Button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Upload/Edit Wording Dialog */}
			<Dialog
				open={isWordingUploadDialogOpen}
				onOpenChange={setIsWordingUploadDialogOpen}
			>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold">
							{editingWording ? "Edit Policy Wording" : "Upload Policy Wording"}
						</DialogTitle>
						<DialogDescription>
							{editingWording
								? "Update the policy wording document details."
								: "Upload a new policy wording document for customers to download."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6 py-4">
						{/* Document Title */}
						<div className="space-y-2">
							<Label htmlFor="wording-title" className="text-sm font-medium">
								Document Title *
							</Label>
							<Input
								id="wording-title"
								value={wordingUploadTitle}
								onChange={(e) => setWordingUploadTitle(e.target.value)}
								placeholder="e.g., Professional Liability Policy Wording v2.1"
								className="h-10"
							/>
						</div>

						{/* File Upload */}
						<div className="space-y-3">
							<Label className="text-sm font-medium">Document File *</Label>

							{/* File Input Area */}
							<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
								<div className="space-y-4">
									<div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
										<Upload className="w-6 h-6 text-primary" />
									</div>

									<div className="space-y-2">
										<p className="text-sm text-gray-600">
											{isUploadingFile
												? "Uploading file..."
												: wordingUploadFile
													? "File uploaded successfully"
													: "Choose a PDF file to upload"}
										</p>
										<Button
											type="button"
											variant="outline"
											onClick={() =>
												document.getElementById("wording-file")?.click()
											}
											disabled={isUploadingFile}
											className="gap-2"
										>
											{isUploadingFile ? (
												<>
													<span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
													Uploading...
												</>
											) : (
												<>
													<Upload className="w-4 h-4" />
													Choose File
												</>
											)}
										</Button>
									</div>

									<Input
										id="wording-file"
										type="file"
										accept="application/pdf"
										onChange={handleFileUpload}
										className="hidden"
									/>

									<p className="text-xs text-gray-500">
										PDF files only, max 10MB
									</p>
								</div>
							</div>

							{/* Selected File Display */}
							{wordingUploadFile && (
								<div
									className={`flex items-center gap-3 p-3 rounded-lg border ${isUploadingFile
										? "bg-blue-50 border-blue-200"
										: (wordingUploadFile as File & { uploadedUrl?: string })
											.uploadedUrl
											? "bg-green-50 border-green-200"
											: "bg-yellow-50 border-yellow-200"
										}`}
								>
									{isUploadingFile ? (
										<span className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0"></span>
									) : (
										<FileText
											className={`w-5 h-5 flex-shrink-0 ${(wordingUploadFile as File & { uploadedUrl?: string })
												.uploadedUrl
												? "text-green-600"
												: "text-yellow-600"
												}`}
										/>
									)}
									<div className="flex-1 min-w-0">
										<p
											className={`text-sm font-medium truncate ${isUploadingFile
												? "text-blue-800"
												: (
													wordingUploadFile as File & {
														uploadedUrl?: string;
													}
												).uploadedUrl
													? "text-green-800"
													: "text-yellow-800"
												}`}
										>
											{wordingUploadFile.name}
										</p>
										<p
											className={`text-xs ${isUploadingFile
												? "text-blue-600"
												: (
													wordingUploadFile as File & {
														uploadedUrl?: string;
													}
												).uploadedUrl
													? "text-green-600"
													: "text-yellow-600"
												}`}
										>
											{isUploadingFile
												? "Uploading..."
												: `${(((wordingUploadFile as any).fileSize || wordingUploadFile.size || 0) / 1024).toFixed(1)} KB${(
													wordingUploadFile as File & {
														uploadedUrl?: string;
													}
												).uploadedUrl
													? " • Uploaded"
													: " • Ready to upload"
												}`}
										</p>
									</div>
									{!isUploadingFile && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												handleFileUpload({
													target: { files: null },
												} as unknown as React.ChangeEvent<HTMLInputElement>);
												// Clear the file input
												const fileInput = document.getElementById(
													"wording-file"
												) as HTMLInputElement;
												if (fileInput) fileInput.value = "";
											}}
											className={`flex-shrink-0 ${(wordingUploadFile as File & { uploadedUrl?: string })
												.uploadedUrl
												? "text-green-600 hover:text-green-800"
												: "text-yellow-600 hover:text-yellow-800"
												}`}
										>
											<X className="w-4 h-4" />
										</Button>
									)}
								</div>
							)}
						</div>

						{/* Active Status */}
						<div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
							<Checkbox
								id="wording-active"
								checked={wordingUploadActive}
								onCheckedChange={setWordingUploadActive}
							/>
							<div className="space-y-1">
								<Label
									htmlFor="wording-active"
									className="text-sm font-medium cursor-pointer"
								>
									Active Document
								</Label>
								<p className="text-xs text-gray-600">
									When active, this document will be available for customers to
									download
								</p>
							</div>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={() => setIsWordingUploadDialogOpen(false)}
							disabled={isUploadingWording}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSavePolicyWording}
							disabled={
								!wordingUploadTitle ||
								(!editingWording && !wordingUploadFile) ||
								isUploadingWording ||
								isUploadingFile
							}
							className="min-w-[120px]"
						>
							{isUploadingWording ? (
								<span className="inline-flex items-center gap-2">
									<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
									Saving…
								</span>
							) : isUploadingFile ? (
								<span className="inline-flex items-center gap-2">
									<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
									Uploading File…
								</span>
							) : editingWording ? (
								"Update Wording"
							) : (
								"Save Wording"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}


