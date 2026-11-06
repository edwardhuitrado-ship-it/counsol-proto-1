import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Download,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Product, SolarCategory } from '../types/inventory';
import { SkuBadge } from './SkuBadge';

interface ExcelSkuImportModalProps {
  existingProducts: Product[];
  onImportProducts: (
    newProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]
  ) => Promise<void>;
  onClose: () => void;
}

interface ParsedSkuRow {
  sku: string;
  name: string;
  category: SolarCategory;
  description: string;
  specifications: string;
  wattage?: number;
  voltage?: number;
  stockQuantity: number;
  reorderPoint: number;
  unitCost: number;
  unitPrice: number;
  vendorName: string;
  warehouseLocation: string;
  status: 'valid' | 'duplicate_sku' | 'missing_fields';
  validationMessage: string;
}

export const ExcelSkuImportModal: React.FC<ExcelSkuImportModalProps> = ({
  existingProducts,
  onImportProducts,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedSkuRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'valid' | 'issues'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse Excel / CSV File
  const handleProcessFile = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    setImportSuccessMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

      const existingSkuSet = new Set(existingProducts.map((p) => p.sku.trim().toUpperCase()));

      const rows: ParsedSkuRow[] = rawJson.map((row) => {
        // Tolerant field extraction
        const sku = String(
          row['SKU'] || row['sku'] || row['Part Number'] || row['Sku'] || ''
        ).trim().toUpperCase();

        const name = String(
          row['Name'] || row['Product Name'] || row['Description'] || row['name'] || ''
        ).trim();

        const rawCat = String(row['Category'] || row['category'] || 'Panels & Modules').trim();
        let category: SolarCategory = 'Panels & Modules';
        if (rawCat.toLowerCase().includes('inverter')) category = 'Inverters';
        else if (rawCat.toLowerCase().includes('battery') || rawCat.toLowerCase().includes('storage')) category = 'Battery Storage';
        else if (rawCat.toLowerCase().includes('rack') || rawCat.toLowerCase().includes('mount')) category = 'Racking & Mounting';
        else if (rawCat.toLowerCase().includes('charge') || rawCat.toLowerCase().includes('mppt')) category = 'Charge Controllers';
        else if (rawCat.toLowerCase().includes('cable') || rawCat.toLowerCase().includes('wire')) category = 'Cables & Wiring';
        else if (rawCat.toLowerCase().includes('bos') || rawCat.toLowerCase().includes('combiner') || rawCat.toLowerCase().includes('box')) category = 'Electrical BOS';
        else if (rawCat.toLowerCase().includes('monitor') || rawCat.toLowerCase().includes('iot')) category = 'Monitoring & IoT';

        const stock = parseInt(row['Stock'] || row['Stock Quantity'] || row['stockQuantity'] || row['Qty'] || '0', 10) || 0;
        const reorder = parseInt(row['Reorder Point'] || row['reorderPoint'] || row['Min'] || '10', 10) || 10;
        const cost = parseFloat(row['Unit Cost'] || row['unitCost'] || row['Cost'] || '0') || 0;
        const price = parseFloat(row['Unit Price'] || row['unitPrice'] || row['Price'] || '0') || cost * 1.35;
        const vendor = String(row['Vendor'] || row['Vendor Name'] || row['vendorName'] || 'SunVolt Dynamics Inc.').trim();
        const location = String(row['Location'] || row['Warehouse Location'] || row['warehouseLocation'] || 'Central Depot - Zone A').trim();
        const specs = String(row['Specifications'] || row['specifications'] || row['Specs'] || 'Commercial Solar Grade').trim();
        const desc = String(row['Description'] || row['description'] || name).trim();
        const watts = parseFloat(row['Wattage'] || row['wattage'] || row['Watts'] || '0') || undefined;
        const volts = parseFloat(row['Voltage'] || row['voltage'] || row['Volts'] || '0') || undefined;

        // Validation
        let status: ParsedSkuRow['status'] = 'valid';
        let validationMessage = 'Ready for import';

        if (!sku || !name) {
          status = 'missing_fields';
          validationMessage = 'Missing mandatory SKU or Product Name';
        } else if (existingSkuSet.has(sku)) {
          status = 'duplicate_sku';
          validationMessage = 'SKU already exists in central catalog (will update)';
        }

        return {
          sku,
          name,
          category,
          description: desc,
          specifications: specs,
          wattage: watts,
          voltage: volts,
          stockQuantity: stock,
          reorderPoint: reorder,
          unitCost: cost,
          unitPrice: price,
          vendorName: vendor,
          warehouseLocation: location,
          status,
          validationMessage,
        };
      });

      setParsedRows(rows);
    } catch (err: any) {
      console.error('Error parsing excel file:', err);
      alert('Failed to read Excel file. Please ensure it is a valid .xlsx, .xls, or .csv document.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  // Generate Sample Excel Template for the User
  const handleDownloadSampleTemplate = () => {
    const templateData = [
      {
        SKU: 'CS-MOD-580-BIF',
        Name: 'Heliomax Pro 580W Bifacial Dual-Glass Solar Module',
        Category: 'Panels & Modules',
        Wattage: 580,
        Voltage: 51.2,
        'Stock Quantity': 240,
        'Reorder Point': 60,
        'Unit Cost': 124.5,
        'Unit Price': 175.0,
        'Vendor Name': 'SunVolt Dynamics Inc.',
        'Warehouse Location': 'Bay A - Rack 04 - Pallet 01',
        Specifications: '580W STC, 51.2V Voc, 14.1A Isc, 22.1% Efficiency, MC4-EVO2',
        Description: 'High-efficiency bifacial module with 30-year linear performance warranty.',
      },
      {
        SKU: 'CS-INV-20K-STR',
        Name: 'FroniusGrid 20kW Commercial 3-Phase String Inverter',
        Category: 'Inverters',
        Wattage: 20000,
        Voltage: 480,
        'Stock Quantity': 18,
        'Reorder Point': 8,
        'Unit Cost': 2850.0,
        'Unit Price': 3790.0,
        'Vendor Name': 'HelioPower Technologies',
        'Warehouse Location': 'Bay B - Shelf 04 - Unit 06',
        Specifications: '20kW 480V 3-Phase, 98.8% CEC Efficiency, Dual MPPT 200V-1000V',
        Description: 'Commercial grid-tied string inverter with built-in AFCI and rapid shutdown.',
      },
      {
        SKU: 'CS-BAT-20K-HV',
        Name: 'AeroVolt 20kWh High-Voltage Commercial Battery Cabinet',
        Category: 'Battery Storage',
        Wattage: 20000,
        Voltage: 400,
        'Stock Quantity': 12,
        'Reorder Point': 5,
        'Unit Cost': 5400.0,
        'Unit Price': 7250.0,
        'Vendor Name': 'HelioPower Technologies',
        'Warehouse Location': 'Bay C - Heavy Storage Yard 02',
        Specifications: '20.48kWh Nominal, 400V High Voltage DC, 8000 Cycles @ 80% DoD',
        Description: 'Commercial LiFePO4 battery rack for peak shaving and microgrid backup.',
      },
      {
        SKU: 'CS-RCK-TILE-01',
        Name: 'DuraMount Penetration-Free Tile Roof Flashing Kit (Box of 24)',
        Category: 'Racking & Mounting',
        'Stock Quantity': 150,
        'Reorder Point': 40,
        'Unit Cost': 185.0,
        'Unit Price': 260.0,
        'Vendor Name': 'DuraMount Structural Systems',
        'Warehouse Location': 'Bay D - Aisle 02 - Bin 14',
        Specifications: 'Anodized 6005-T5 Aluminum, 175mph Wind Rating, UL 2703 Certified',
        Description: 'Universal waterproof tile roof attachment flashing with integrated grounding.',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Solar_SKUs_Template');
    XLSX.writeFile(wb, 'counSOL_America_SKU_Import_Template.xlsx');
  };

  // Perform bulk import
  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.status !== 'missing_fields');
    if (validRows.length === 0) {
      alert('No valid rows found to import.');
      return;
    }

    setIsProcessing(true);
    try {
      const formattedProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = validRows.map(
        (r) => ({
          sku: r.sku,
          name: r.name,
          category: r.category,
          description: r.description,
          specifications: r.specifications,
          wattage: r.wattage,
          voltage: r.voltage,
          stockQuantity: r.stockQuantity,
          allocatedQuantity: 0,
          reorderPoint: r.reorderPoint,
          unitCost: r.unitCost,
          unitPrice: r.unitPrice,
          vendorId: 'vendor-sunvolt',
          vendorName: r.vendorName,
          warehouseLocation: r.warehouseLocation,
          status:
            r.stockQuantity === 0
              ? 'out_of_stock'
              : r.stockQuantity <= r.reorderPoint
              ? 'low_stock'
              : 'in_stock',
          warrantyYears: 25,
          certification: 'UL Certified, Safe Harbor Aligned',
        })
      );

      await onImportProducts(formattedProducts);
      setImportSuccessMessage(
        `Successfully imported ${formattedProducts.length} solar hardware SKUs into CounSOL central inventory!`
      );
    } catch (err: any) {
      console.error('Import error:', err);
      alert('Import failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const duplicateCount = parsedRows.filter((r) => r.status === 'duplicate_sku').length;
  const errorCount = parsedRows.filter((r) => r.status === 'missing_fields').length;

  const displayedRows = parsedRows.filter((r) => {
    if (activeFilter === 'valid') return r.status === 'valid';
    if (activeFilter === 'issues') return r.status !== 'valid';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Import Solar Hardware SKUs from Excel / CSV
              </h2>
              <p className="text-xs text-slate-400">
                Bulk upload equipment catalogs, quantities, wholesale costs, and specifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition"
              title="Download pre-formatted Excel template"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel Template (.xlsx)
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Drag & Drop Panel */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">
                  Drag and drop your Excel (.xlsx, .xls) or CSV spreadsheet here
                </p>
                <p className="text-xs text-slate-400">
                  Supports standardized column headers: SKU, Name, Category, Stock, Unit Cost, Unit Price, Specs
                </p>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Select File from Computer
                </button>
                {fileName && (
                  <span className="text-xs font-mono bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-emerald-400">
                    Loaded: {fileName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {importSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-sm flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>{importSuccessMessage}</span>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
              >
                Done
              </button>
            </div>
          )}

          {/* Preview & Validation Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">Parsed Rows: {parsedRows.length}</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} New Valid
                  </span>
                  {duplicateCount > 0 && (
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {duplicateCount} Existing SKU (Update)
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-rose-400 font-medium flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> {errorCount} Invalid
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-2.5 py-1 rounded ${
                      activeFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({parsedRows.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('valid')}
                    className={`px-2.5 py-1 rounded ${
                      activeFilter === 'valid'
                        ? 'bg-emerald-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Valid Only ({validCount})
                  </button>
                  <button
                    onClick={() => setActiveFilter('issues')}
                    className={`px-2.5 py-1 rounded ${
                      activeFilter === 'issues'
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Issues / Duplicates ({duplicateCount + errorCount})
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Validation</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Wholesale ($)</th>
                        <th className="py-2.5 px-3 text-right">Retail ($)</th>
                        <th className="py-2.5 px-3">Warehouse Bin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {displayedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-800/40 transition ${
                            row.status === 'missing_fields'
                              ? 'bg-rose-500/5'
                              : row.status === 'duplicate_sku'
                              ? 'bg-amber-500/5'
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            {row.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            )}
                            {row.status === 'duplicate_sku' && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <AlertTriangle className="w-3 h-3" /> Update SKU
                              </span>
                            )}
                            {row.status === 'missing_fields' && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <XCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-amber-400">
                            {row.sku || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-sans max-w-xs truncate text-slate-200">
                            {row.name || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-400">
                            {row.category}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-white">
                            {row.stockQuantity}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-400">
                            ${row.unitCost.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-cyan-400">
                            ${row.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-400 truncate max-w-[120px]">
                            {row.warehouseLocation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {parsedRows.length > 0 ? (
              <span>
                Ready to import <strong className="text-white">{validCount + duplicateCount}</strong>{' '}
                hardware items into central inventory.
              </span>
            ) : (
              <span>Upload an Excel spreadsheet to begin preview and validation.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={isProcessing || parsedRows.length === 0 || validCount + duplicateCount === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              {isProcessing
                ? 'Importing...'
                : `Commit & Import (${validCount + duplicateCount} SKUs)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
