import React from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from "@/components/ui/select";
import { Plus, Save, X } from "lucide-react";
import { TplExtension } from '@/features/product-config/cew/api/cew-config';
import { FormattedNumberInput } from "@/components/ui";
import { useToast } from '@/shared/hooks/use-toast';

export type CEWsConfigurationProps = {
	tplError: string | null;
	isLoadingTpl: boolean;
	productCurrency: string;
	tplLimit: string;
	setTplLimit: (val: string) => void;
	tplExtensions: TplExtension[];
	setTplExtensions: (val: TplExtension[]) => void;
	isSavingTpl: boolean;
	saveTplExtensions: () => void;
};

const CEWsConfiguration: React.FC<CEWsConfigurationProps> = ({
	tplError,
	isLoadingTpl,
	productCurrency,
	tplLimit,
	setTplLimit,
	tplExtensions,
	setTplExtensions,
	isSavingTpl,
	saveTplExtensions,
}) => {
	const { toast } = useToast();

	const renderExtensions: TplExtension[] =
		Array.isArray(tplExtensions) && tplExtensions.length > 0
			? tplExtensions
			: [
				{
					id: Date.now(),
					title: "",
					description: "",
					tplLimitValue: "",
					pricingType: "percentage",
					loadingDiscount: 0,
				},
			];

	return (
		<>
			{/* {!tplLimit && !tplExtensions?.length && !isLoadingTpl && (
				<div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 mb-4">
					<p className="font-medium">Yet to configure this section</p>
					<p className="text-sm mt-1">
						Configure TPL limit and extensions below.
					</p>
				</div>
			)} */}
			{isLoadingTpl && (
				<div className="space-y-4">
					<div className="p-4 border rounded-md">
						<div className="w-56 h-5 bg-gray-200 rounded animate-pulse mb-3" />
						<div className="h-10 bg-gray-200 rounded animate-pulse" />
					</div>
					<div className="p-4 border rounded-md">
						<div className="w-56 h-5 bg-gray-200 rounded animate-pulse mb-3" />
						<div className="h-24 bg-gray-200 rounded animate-pulse" />
					</div>
				</div>
			)}

			{!isLoadingTpl && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>TPL limit & Extensions</CardTitle>
								<CardDescription>
									Configure Third Party Liability limit and related extensions
								</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<Button
									onClick={() => {
										const newExtension: TplExtension = {
											id: Date.now(),
											title: "",
											description: "",
											tplLimitValue: "",
											pricingType: "percentage",
											loadingDiscount: 0,
										};
										setTplExtensions([...(tplExtensions || []), newExtension]);
									}}
									size="sm"
								>
									<Plus className="w-4 h-4 mr-2" />
									Add Extension
								</Button>
								<Button
									size="sm"
									disabled={isSavingTpl}
									onClick={() => {
										const currentExtensions = tplExtensions || [];
										if (currentExtensions.length === 0) {
											saveTplExtensions();
											return;
										}
										const extensions = renderExtensions || [];
										const hasEmptyTitle = extensions.some((ext) => !(ext.title?.trim()));
										const hasEmptyDescription = extensions.some(
											(ext) => !(ext.description?.trim())
										);
										if (hasEmptyTitle) {
											toast({
												title: "Validation failed",
												description: "Title is mandatory for all TPL Limit Extensions.",
												variant: "destructive",
											});
										}
										if (hasEmptyDescription) {
											toast({
												title: "Validation failed",
												description: "Description is mandatory for all TPL Limit Extensions.",
												variant: "destructive",
											});
										}
										if (hasEmptyTitle || hasEmptyDescription) return;
										saveTplExtensions();
									}}
								>
									<Save className="w-4 h-4 mr-2" />
									{isSavingTpl ? "Saving…" : "Save Extensions"}
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="tpl-limit">
									Default TPL Limit ({productCurrency})
								</Label>
								<FormattedNumberInput
									id="tpl-limit"
									value={!isNaN(Number(tplLimit)) ? Number(tplLimit) : 0}
									onChange={(number) => setTplLimit(number.toString())}
									placeholder="Enter TPL limit amount"
									type="number"
								/>
							</div>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-medium">TPL Limit Extensions</h4>
							</div>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Title</TableHead>
										<TableHead>Description</TableHead>
										<TableHead>TPL Limit Value ({productCurrency})</TableHead>
										<TableHead>Pricing Type</TableHead>
										<TableHead>Loading/Discount</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{renderExtensions.map((extension) => (
										<TableRow key={extension.id}>
											<TableCell>
												<Input
													value={extension.title}
													onChange={(e) => {
														setTplExtensions(
															renderExtensions.map((ext) =>
																ext.id === extension.id
																	? { ...ext, title: e.target.value }
																	: ext
															)
														);
													}}
													placeholder="Enter title"
													className="w-full"
												/>
											</TableCell>
											<TableCell>
												<Input
													value={extension.description}
													onChange={(e) => {
														setTplExtensions(
															renderExtensions.map((ext) =>
																ext.id === extension.id
																	? { ...ext, description: e.target.value }
																	: ext
															)
														);
													}}
													placeholder="Enter description"
													className="w-full"
												/>
											</TableCell>
											<TableCell>
												<FormattedNumberInput
													value={!isNaN(Number(extension.tplLimitValue)) ? Number(extension.tplLimitValue) : 0}
													onChange={(number) => {
														setTplExtensions(
															renderExtensions.map((ext) =>
																ext.id === extension.id
																	? { ...ext, tplLimitValue: number.toString() }
																	: ext
															)
														);
													}}
													placeholder="Enter limit value"
													className="w-full"
												/>
											</TableCell>
											<TableCell>
												<Select
													value={extension.pricingType}
													onValueChange={(value: "percentage" | "fixed") => {
														setTplExtensions(
															renderExtensions.map((ext) =>
																ext.id === extension.id
																	? {
																			...ext,
																			pricingType: value,
																			loadingDiscount:
																				value === "percentage"
																					? Math.min(
																							100,
																							Math.max(0, Number(ext.loadingDiscount) || 0),
																						)
																					: ext.loadingDiscount,
																		}
																	: ext
															)
														);
													}}
												>
													<SelectTrigger className="w-full">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="percentage">
															Percentage
														</SelectItem>
														<SelectItem value="fixed">Fixed Amount</SelectItem>
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<FormattedNumberInput
														value={!isNaN(Number(extension.loadingDiscount)) ? Number(extension.loadingDiscount) : 0}
														onChange={(number) => {
															setTplExtensions(
																renderExtensions.map((ext) =>
																	ext.id === extension.id
																		? {
																			...ext,
																			loadingDiscount: number,
																		}
																		: ext
																)
															);
														}}
														placeholder="0"
														className="w-32"
														min={extension.pricingType === "percentage" ? 0 : undefined}
														max={extension.pricingType === "percentage" ? 100 : undefined}
														allowDecimals={extension.pricingType === "percentage"}
														maxDecimals={extension.pricingType === "percentage" ? 2 : undefined}
														minFractionDigits={extension.pricingType === "percentage" ? 0 : undefined}
													/>
													<span className="text-sm text-muted-foreground">
														{extension.pricingType === "percentage"
															? "%"
															: productCurrency}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														const updatedExtensions = (
															tplExtensions || []
														).filter((ext) => ext.id !== extension.id);
														setTplExtensions(updatedExtensions);
													}}
													disabled={tplExtensions?.length === 0}
													className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
												>
													<X className="w-4 h-4" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			)}
		</>
	);
};

export default CEWsConfiguration;

