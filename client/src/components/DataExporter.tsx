import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Database,
  Calendar,
  Filter,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  dateRange: DateRange | undefined;
  dataTypes: string[];
  includeCharts: boolean;
  includeMetadata: boolean;
}

interface DataExporterProps {
  userRole: 'admin' | 'contractor' | 'salesperson';
  userId?: number;
  contextData?: any;
}

const DataExporter: React.FC<DataExporterProps> = ({ userRole, userId, contextData }) => {
  const { toast } = useToast();
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: undefined,
    dataTypes: [],
    includeCharts: false,
    includeMetadata: true
  });

  const getAvailableDataTypes = () => {
    switch (userRole) {
      case 'admin':
        return [
          { id: 'analytics', label: 'Analytics Overview', icon: '📊' },
          { id: 'users', label: 'User Data', icon: '👥' },
          { id: 'contractors', label: 'Contractor Information', icon: '🏗️' },
          { id: 'salespersons', label: 'Sales Representatives', icon: '💼' },
          { id: 'bidRequests', label: 'Bid Requests', icon: '📝' },
          { id: 'projects', label: 'Project Data', icon: '🏠' },
          { id: 'revenue', label: 'Revenue Reports', icon: '💰' },
          { id: 'performance', label: 'Performance Metrics', icon: '📈' }
        ];
      
      case 'contractor':
        return [
          { id: 'profile', label: 'Company Profile', icon: '🏢' },
          { id: 'bidRequests', label: 'My Bid Requests', icon: '📝' },
          { id: 'projects', label: 'My Projects', icon: '🏠' },
          { id: 'analytics', label: 'Performance Analytics', icon: '📊' },
          { id: 'documents', label: 'Documents', icon: '📄' },
          { id: 'timeline', label: 'Project Timelines', icon: '⏱️' }
        ];
      
      case 'salesperson':
        return [
          { id: 'profile', label: 'My Profile', icon: '👤' },
          { id: 'leads', label: 'My Leads', icon: '🎯' },
          { id: 'analytics', label: 'Performance Data', icon: '📊' },
          { id: 'visits', label: 'QR Code Visits', icon: '📱' },
          { id: 'conversions', label: 'Conversion Data', icon: '💫' },
          { id: 'commissions', label: 'Commission Reports', icon: '💰' }
        ];
      
      default:
        return [];
    }
  };

  const exportMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      const endpoint = userRole === 'admin' 
        ? '/api/admin/export'
        : userRole === 'contractor'
        ? `/api/contractors/${userId}/export`
        : `/api/salespersons/${userId}/export`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...options,
          dateRange: options.dateRange ? {
            from: options.dateRange.from?.toISOString(),
            to: options.dateRange.to?.toISOString()
          } : null
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return response.blob();
    },
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${userRole}-export-${timestamp}.${variables.format}`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Your data has been exported as ${filename}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: "Unable to export data. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDataTypeToggle = (dataTypeId: string) => {
    setExportOptions(prev => ({
      ...prev,
      dataTypes: prev.dataTypes.includes(dataTypeId)
        ? prev.dataTypes.filter(id => id !== dataTypeId)
        : [...prev.dataTypes, dataTypeId]
    }));
  };

  const handleExport = () => {
    if (exportOptions.dataTypes.length === 0) {
      toast({
        title: "No Data Selected",
        description: "Please select at least one data type to export.",
        variant: "destructive"
      });
      return;
    }

    exportMutation.mutate(exportOptions);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'json':
        return <Database className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const dataTypes = getAvailableDataTypes();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Format */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Export Format</label>
          <Select
            value={exportOptions.format}
            onValueChange={(value: 'csv' | 'xlsx' | 'pdf' | 'json') => 
              setExportOptions(prev => ({ ...prev, format: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Comma Separated)
                </div>
              </SelectItem>
              <SelectItem value="xlsx">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (.xlsx)
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF Report
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  JSON Data
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range (Optional)
          </label>
          <DatePickerWithRange
            date={exportOptions.dateRange}
            onDateChange={(dateRange) => 
              setExportOptions(prev => ({ ...prev, dateRange }))
            }
          />
          <p className="text-xs text-gray-500">
            Leave empty to export all available data
          </p>
        </div>

        {/* Data Types Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Data to Export
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dataTypes.map((dataType) => (
              <div key={dataType.id} className="flex items-center space-x-3">
                <Checkbox
                  id={dataType.id}
                  checked={exportOptions.dataTypes.includes(dataType.id)}
                  onCheckedChange={() => handleDataTypeToggle(dataType.id)}
                />
                <label
                  htmlFor={dataType.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                >
                  <span>{dataType.icon}</span>
                  {dataType.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Additional Options</label>
          
          <div className="flex items-center space-x-3">
            <Checkbox
              id="includeCharts"
              checked={exportOptions.includeCharts}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, includeCharts: checked as boolean }))
              }
              disabled={exportOptions.format === 'csv' || exportOptions.format === 'json'}
            />
            <label
              htmlFor="includeCharts"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Include Charts & Visualizations
              {(exportOptions.format === 'csv' || exportOptions.format === 'json') && (
                <Badge variant="outline" className="ml-2 text-xs">
                  PDF/Excel only
                </Badge>
              )}
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="includeMetadata"
              checked={exportOptions.includeMetadata}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, includeMetadata: checked as boolean }))
              }
            />
            <label
              htmlFor="includeMetadata"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Include Metadata & Timestamps
            </label>
          </div>
        </div>

        {/* Selected Data Summary */}
        {exportOptions.dataTypes.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Selected Data Types:</label>
            <div className="flex flex-wrap gap-2">
              {exportOptions.dataTypes.map((dataTypeId) => {
                const dataType = dataTypes.find(dt => dt.id === dataTypeId);
                return dataType ? (
                  <Badge key={dataTypeId} variant="secondary" className="flex items-center gap-1">
                    <span>{dataType.icon}</span>
                    {dataType.label}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleExport}
            disabled={exportMutation.isPending || exportOptions.dataTypes.length === 0}
            className="flex-1"
          >
            {exportMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Exporting...
              </>
            ) : (
              <>
                {getFormatIcon(exportOptions.format)}
                <span className="ml-2">Export {exportOptions.format.toUpperCase()}</span>
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setExportOptions({
              format: 'csv',
              dateRange: undefined,
              dataTypes: [],
              includeCharts: false,
              includeMetadata: true
            })}
            disabled={exportMutation.isPending}
          >
            Reset
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• CSV: Best for spreadsheet analysis and data processing</p>
          <p>• Excel: Formatted tables with multiple sheets</p>
          <p>• PDF: Professional reports with charts and formatting</p>
          <p>• JSON: Raw data for developers and integrations</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExporter;