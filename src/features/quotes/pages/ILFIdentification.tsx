/**
 * ILF Identification Page
 * Allows brokers to search and identify ILF (Industry Loss Factor) data
 * Features: Excel import, sequential dropdowns, evaluation display
 */

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from '@/shared/hooks/use-toast';
import { Upload, FileSpreadsheet, Search, Download, Check, ChevronsUpDown } from "lucide-react";
import * as XLSX from 'xlsx';
import { Badge } from "@/components/ui/badge";
import { cn } from '@/shared/utils/lib-utils';

interface ILFData {
  industryTypeKey: number;
  name: string;
  amBestIndustryType: string;
  finalEvaluationPublic: string;
  finalEvaluationProduct: string;
  evaluationEnvironmentalLiabGradual: string;
  evaluationEnvironmentalLiabSudden: string;
}

const ILF_STORAGE_KEY = 'ilf_identification_data';

export default function ILFIdentification() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ilfData, setIlfData] = useState<ILFData[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [selectedAmBestType, setSelectedAmBestType] = useState<string>("");
  const [filteredData, setFilteredData] = useState<ILFData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nameSearchOpen, setNameSearchOpen] = useState(false);
  const [nameSearchValue, setNameSearchValue] = useState("");

  // Load data from localStorage on mount
  useEffect(() => {
    const storedData = localStorage.getItem(ILF_STORAGE_KEY);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setIlfData(parsed);
      } catch (error) {
        console.error('Failed to load ILF data from storage:', error);
      }
    }
  }, []);

  // Get unique names for dropdown (filter out empty strings)
  const uniqueNames = Array.from(new Set(ilfData.map(item => item.name).filter(name => name && name.trim() !== ""))).sort();
  
  // Filter names based on search
  const filteredNames = nameSearchValue
    ? uniqueNames.filter(name => 
        name.toLowerCase().includes(nameSearchValue.toLowerCase())
      )
    : uniqueNames;

  // Get AM Best Industry Types filtered by selected name (filter out empty strings)
  const amBestTypesForName = selectedName
    ? Array.from(new Set(
        ilfData
          .filter(item => item.name === selectedName)
          .map(item => item.amBestIndustryType)
          .filter(type => type && type.trim() !== "") // Filter out empty strings
      )).sort()
    : [];

  // Filter data when both selections are made
  useEffect(() => {
    if (selectedName && selectedAmBestType && ilfData.length > 0) {
      const found = ilfData.find(
        item => 
          String(item.name).trim() === String(selectedName).trim() && 
          String(item.amBestIndustryType).trim() === String(selectedAmBestType).trim()
      );
      if (found) {
        console.log('✅ Found matching data:', found);
        setFilteredData(found);
      } else {
        console.log('❌ No match found for:', { 
          selectedName, 
          selectedAmBestType, 
          totalRecords: ilfData.length,
          sampleNames: ilfData.slice(0, 3).map(d => d.name),
          sampleAmBest: ilfData.slice(0, 3).map(d => d.amBestIndustryType)
        });
        setFilteredData(null);
      }
    } else {
      setFilteredData(null);
    }
  }, [selectedName, selectedAmBestType, ilfData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          // Parse with headers - XLSX will automatically map column headers
          const jsonDataWithHeaders = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as any[];
          
          let parsedData: ILFData[] = [];
          
          if (jsonDataWithHeaders.length > 0) {
            // Get the first row to understand column mapping
            const firstRow = jsonDataWithHeaders[0];
            const keys = Object.keys(firstRow);
            
            // Find column indices/keys for each field
            const findColumnKey = (possibleNames: string[]): string | null => {
              for (const name of possibleNames) {
                const nameLower = name.toLowerCase().trim();
                
                // First try exact match (case-insensitive, ignoring extra spaces)
                let found = keys.find(k => {
                  const kLower = k.toLowerCase().trim();
                  // Normalize spaces and compare
                  const kNormalized = kLower.replace(/\s+/g, ' ').trim();
                  const nameNormalized = nameLower.replace(/\s+/g, ' ').trim();
                  return kNormalized === nameNormalized;
                });
                if (found) {
                  console.log(`✅ Exact match found for "${name}": "${found}"`);
                  return found;
                }
                
                // Then try normalized match (remove special chars, normalize spaces)
                found = keys.find(k => {
                  const kLower = k.toLowerCase().trim();
                  const kNormalized = kLower.replace(/[().+]/g, ' ').replace(/\s+/g, ' ').trim();
                  const nameNormalized = nameLower.replace(/[().+]/g, ' ').replace(/\s+/g, ' ').trim();
                  
                  if (kNormalized === nameNormalized) {
                    return true;
                  }
                  
                  // For multi-word names, check if all significant words are present
                  if (nameNormalized.includes(' ')) {
                    const nameWords = nameNormalized.split(/\s+/).filter(w => w.length > 2); // Filter out short words like "liab"
                    if (nameWords.length > 0) {
                      const allWordsMatch = nameWords.every(word => kNormalized.includes(word));
                      if (allWordsMatch) {
                        // Also check that we're not matching a substring incorrectly
                        // For "Final Evaluation Public", make sure "Final" and "Public" are both present
                        const keyWords = kNormalized.split(/\s+/).filter(w => w.length > 2);
                        const hasKeyWords = nameWords.filter(nw => keyWords.includes(nw)).length >= Math.min(2, nameWords.length);
                        return allWordsMatch && hasKeyWords;
                      }
                    }
                  }
                  return false;
                });
                if (found) {
                  console.log(`✅ Normalized match found for "${name}": "${found}"`);
                  return found;
                }
              }
              console.log(`❌ No match found for: ${possibleNames.join(', ')}`);
              return null;
            };
            
            // Log available keys for debugging
            console.log('Available column keys:', keys);
            
            const industryKeyCol = findColumnKey(['INDUSTRY_TYPE_KEY', 'Industry Type Key', 'Industry Type']);
            const nameCol = findColumnKey(['NAME', 'Name']);
            const amBestCol = findColumnKey(['AM Best Industry Type (manual matching)', 'AM Best Industry Type', 'AM Best']);
            // More specific search terms for Public - must include "Final Evaluation" and "Public"
            const publicCol = findColumnKey([
              'Final Evaluation Public',
              'Final Evaluation Public',
              'Evaluation Public'
            ]);
            // More specific search terms for Product - must include "Final Evaluation" and "Product"
            const productCol = findColumnKey([
              'Final Evaluation Product',
              'Final Evaluation Product',
              'Evaluation Product'
            ]);
            // More specific for Gradual Pollution
            const gradualCol = findColumnKey([
              'Evaluation Environmental Liab. (Gradual Pollution)',
              'Gradual Pollution',
              'Environmental Liab. (Gradual Pollution)',
              'Gradual'
            ]);
            // More specific for sudden+accidental
            const suddenCol = findColumnKey([
              'Evaluation Environmental Liab. (sudden+accidental)',
              'sudden+accidental',
              'Environmental Liab. (sudden+accidental)',
              'sudden accidental',
              'sudden'
            ]);
            
            // Log found columns for debugging
            console.log('Found columns:', {
              industryKeyCol,
              nameCol,
              amBestCol,
              publicCol,
              productCol,
              gradualCol,
              suddenCol
            });
            
            // Parse each row
            parsedData = jsonDataWithHeaders
              .map((row: any, index: number) => {
                const industryKey = industryKeyCol ? (Number(row[industryKeyCol]) || 0) : 0;
                const name = nameCol ? String(row[nameCol] || "").trim() : "";
                const amBest = amBestCol ? String(row[amBestCol] || "").trim() : "";
                const publicEval = publicCol ? String(row[publicCol] || "").trim() : "";
                const productEval = productCol ? String(row[productCol] || "").trim() : "";
                const gradualEval = gradualCol ? String(row[gradualCol] || "").trim() : "";
                const suddenEval = suddenCol ? String(row[suddenCol] || "").trim() : "";
                
                // Log first row for debugging
                if (index === 0) {
                  console.log('First row data:', {
                    row,
                    industryKey,
                    name,
                    amBest,
                    publicEval,
                    productEval,
                    gradualEval,
                    suddenEval
                  });
                }
                
                // Only include rows with valid data
                if (name && industryKey > 0) {
                  return {
                    industryTypeKey: industryKey,
                    name: name,
                    amBestIndustryType: amBest,
                    finalEvaluationPublic: publicEval,
                    finalEvaluationProduct: productEval,
                    evaluationEnvironmentalLiabGradual: gradualEval,
                    evaluationEnvironmentalLiabSudden: suddenEval,
                  };
                }
                return null;
              })
              .filter((item): item is ILFData => item !== null);
          }
          
          // If no data found with headers, try array-based parsing as fallback
          if (parsedData.length === 0) {
            console.log('⚠️ No data found with header-based parsing, trying array-based fallback...');
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
            if (jsonData.length > 1) {
              // Find header row (usually first row)
              const headerRow = jsonData[0] || [];
              console.log('Header row:', headerRow);
              
              const getColumnIndex = (possibleNames: string[]): number => {
                for (const name of possibleNames) {
                  const nameLower = name.toLowerCase();
                  const index = headerRow.findIndex((h: any) => {
                    const hStr = String(h || "").toLowerCase().trim();
                    return hStr === nameLower || hStr.includes(nameLower) || nameLower.includes(hStr);
                  });
                  if (index >= 0) {
                    console.log(`✅ Found column index ${index} for "${name}": "${headerRow[index]}"`);
                    return index;
                  }
                }
                console.log(`❌ No column index found for: ${possibleNames.join(', ')}`);
                return -1;
              };
              
              const industryKeyIdx = getColumnIndex(['INDUSTRY_TYPE_KEY', 'Industry Type Key']);
              const nameIdx = getColumnIndex(['NAME', 'Name']);
              const amBestIdx = getColumnIndex(['AM Best Industry Type (manual matching)', 'AM Best Industry Type', 'AM Best']);
              const publicIdx = getColumnIndex(['Final Evaluation Public', 'Evaluation Public', 'Public']);
              const productIdx = getColumnIndex(['Final Evaluation Product', 'Evaluation Product', 'Product']);
              const gradualIdx = getColumnIndex(['Evaluation Environmental Liab. (Gradual Pollution)', 'Gradual Pollution', 'Gradual']);
              const suddenIdx = getColumnIndex(['Evaluation Environmental Liab. (sudden+accidental)', 'sudden+accidental', 'sudden', 'accidental']);
              
              console.log('Column indices:', {
                industryKeyIdx,
                nameIdx,
                amBestIdx,
                publicIdx,
                productIdx,
                gradualIdx,
                suddenIdx
              });
              
              // Parse data rows (skip header)
              for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (row && nameIdx >= 0 && industryKeyIdx >= 0) {
                  const industryKey = Number(row[industryKeyIdx]) || 0;
                  const name = String(row[nameIdx] || "").trim();
                  
                  if (name && industryKey > 0) {
                    const parsedRow = {
                      industryTypeKey: industryKey,
                      name: name,
                      amBestIndustryType: amBestIdx >= 0 ? String(row[amBestIdx] || "").trim() : "",
                      finalEvaluationPublic: publicIdx >= 0 ? String(row[publicIdx] || "").trim() : "",
                      finalEvaluationProduct: productIdx >= 0 ? String(row[productIdx] || "").trim() : "",
                      evaluationEnvironmentalLiabGradual: gradualIdx >= 0 ? String(row[gradualIdx] || "").trim() : "",
                      evaluationEnvironmentalLiabSudden: suddenIdx >= 0 ? String(row[suddenIdx] || "").trim() : "",
                    };
                    
                    // Log first parsed row for debugging
                    if (i === 1) {
                      console.log('First parsed row:', parsedRow);
                    }
                    
                    parsedData.push(parsedRow);
                  }
                }
              }
            }
          }
          
          // Warn if some columns were not found
          if (parsedData.length > 0) {
            const firstRow = parsedData[0];
            const missingFields: string[] = [];
            if (!firstRow.finalEvaluationPublic) missingFields.push('Final Evaluation Public');
            if (!firstRow.finalEvaluationProduct) missingFields.push('Final Evaluation Product');
            if (!firstRow.evaluationEnvironmentalLiabGradual) missingFields.push('Gradual Pollution');
            if (!firstRow.evaluationEnvironmentalLiabSudden) missingFields.push('sudden+accidental');
            
            if (missingFields.length > 0) {
              console.warn('⚠️ Some evaluation fields are missing:', missingFields);
              console.log('Sample row data:', firstRow);
            }
          }

          // Store in localStorage
          localStorage.setItem(ILF_STORAGE_KEY, JSON.stringify(parsedData));
          setIlfData(parsedData);
          
          // Reset selections
          setSelectedName("");
          setSelectedAmBestType("");
          setFilteredData(null);

          toast({
            title: "Excel Imported Successfully",
            description: `Imported ${parsedData.length} records from ${file.name}`,
          });
        } catch (error: any) {
          console.error('Error parsing Excel:', error);
          toast({
            title: "Import Failed",
            description: error.message || "Failed to parse the Excel file. Please check the format.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        toast({
          title: "File Read Error",
          description: "Failed to read the file. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      };

      reader.readAsBinaryString(file);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload the file.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const getEvaluationBadgeVariant = (evaluation: string): "default" | "destructive" | "secondary" | "outline" => {
    const lower = evaluation.toLowerCase();
    if (lower.includes("very high")) return "destructive";
    if (lower.includes("high")) return "destructive";
    if (lower.includes("medium")) return "default";
    if (lower.includes("low")) return "secondary";
    if (lower.includes("very low")) return "outline";
    return "default";
  };

  const exportData = () => {
    if (ilfData.length === 0) {
      toast({
        title: "No Data",
        description: "No data to export. Please import an Excel file first.",
        variant: "destructive",
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(ilfData.map(item => ({
      "INDUSTRY_TYPE_KEY": item.industryTypeKey,
      "NAME": item.name,
      "AM Best Industry Type (manual matching)": item.amBestIndustryType,
      "Final Evaluation Public": item.finalEvaluationPublic,
      "Final Evaluation Product": item.finalEvaluationProduct,
      "Evaluation Environmental Liab. (Gradual Pollution)": item.evaluationEnvironmentalLiabGradual,
      "Evaluation Environmental Liab. (sudden+accidental)": item.evaluationEnvironmentalLiabSudden,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ILF Data");
    XLSX.writeFile(workbook, "ilf_identification_data.xlsx");
    
    toast({
      title: "Data Exported",
      description: "ILF data has been exported to Excel file.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ILF Identification</h1>
          <p className="text-muted-foreground mt-1">Search and identify Industry Loss Factor data</p>
        </div>
        {ilfData.length > 0 && (
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        )}
      </div>

      {/* Excel Import Section */}
      <Card>
        <CardHeader>
          <CardTitle>Excel Import</CardTitle>
          <CardDescription>
            Import ILF data from Excel file. The file should contain columns: INDUSTRY_TYPE_KEY, NAME, AM Best Industry Type, Final Evaluation Public, Final Evaluation Product, and Environmental Liability evaluations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {isLoading ? "Importing..." : "Import Excel File"}
            </Button>
            {ilfData.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {ilfData.length} records loaded
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step A - Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Step A — Search Section</CardTitle>
          <CardDescription>Select Name and AM Best Industry Type to view evaluation data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Popover open={nameSearchOpen} onOpenChange={setNameSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={nameSearchOpen}
                    className="w-full justify-between"
                    disabled={ilfData.length === 0}
                  >
                    {selectedName || "Select Name..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search name..." 
                      value={nameSearchValue}
                      onValueChange={setNameSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty>No name found.</CommandEmpty>
                      <CommandGroup>
                        {filteredNames.filter(name => name && name.trim() !== "").map((name) => (
                          <CommandItem
                            key={name}
                            value={name}
                            onSelect={() => {
                              setSelectedName(name === selectedName ? "" : name);
                              setSelectedAmBestType(""); // Reset AM Best Type when Name changes
                              setNameSearchOpen(false);
                              setNameSearchValue("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedName === name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amBestType">AM Best Industry Type</Label>
              <Select
                value={selectedAmBestType}
                onValueChange={setSelectedAmBestType}
                disabled={!selectedName || amBestTypesForName.length === 0}
              >
                <SelectTrigger id="amBestType">
                  <SelectValue placeholder={selectedName ? "Select AM Best Industry Type" : "Select Name first"} />
                </SelectTrigger>
                <SelectContent>
                  {amBestTypesForName
                    .filter(type => type && type.trim() !== "") // Filter out empty strings
                    .map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Results */}
      {filteredData && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Results</CardTitle>
            <CardDescription>
              Industry Type Key: {filteredData.industryTypeKey} | Name: {filteredData.name} | AM Best Industry Type: {filteredData.amBestIndustryType}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-green-50 dark:bg-green-950/20">Final Evaluation Public</TableHead>
                  <TableHead className="bg-green-50 dark:bg-green-950/20">Final Evaluation Product</TableHead>
                  <TableHead className="bg-gray-50 dark:bg-gray-950/20">Evaluation Environmental Liab. (Gradual Pollution)</TableHead>
                  <TableHead className="bg-gray-50 dark:bg-gray-950/20">Evaluation Environmental Liab. (sudden+accidental)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="bg-green-50 dark:bg-green-950/20">
                    {filteredData.finalEvaluationPublic && filteredData.finalEvaluationPublic.trim() ? (
                      <Badge variant={getEvaluationBadgeVariant(filteredData.finalEvaluationPublic)}>
                        {filteredData.finalEvaluationPublic}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="bg-green-50 dark:bg-green-950/20">
                    {filteredData.finalEvaluationProduct && filteredData.finalEvaluationProduct.trim() ? (
                      <Badge variant={getEvaluationBadgeVariant(filteredData.finalEvaluationProduct)}>
                        {filteredData.finalEvaluationProduct}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="bg-gray-50 dark:bg-gray-950/20">
                    {filteredData.evaluationEnvironmentalLiabGradual && filteredData.evaluationEnvironmentalLiabGradual.trim() ? (
                      <Badge variant={getEvaluationBadgeVariant(filteredData.evaluationEnvironmentalLiabGradual)}>
                        {filteredData.evaluationEnvironmentalLiabGradual}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="bg-gray-50 dark:bg-gray-950/20">
                    {filteredData.evaluationEnvironmentalLiabSudden && filteredData.evaluationEnvironmentalLiabSudden.trim() ? (
                      <Badge variant={getEvaluationBadgeVariant(filteredData.evaluationEnvironmentalLiabSudden)}>
                        {filteredData.evaluationEnvironmentalLiabSudden}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Show message if no data found */}
      {selectedName && selectedAmBestType && !filteredData && ilfData.length > 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No matching data found for the selected Name and AM Best Industry Type combination.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please check your selections or re-import the Excel file.
            </p>
          </CardContent>
        </Card>
      )}

      {ilfData.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No ILF Data Loaded</p>
            <p className="text-sm text-muted-foreground mb-4">
              Please import an Excel file to get started.
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Import Excel File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

