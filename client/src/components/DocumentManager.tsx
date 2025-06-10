import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Image, 
  Video, 
  Search, 
  Trash2, 
  Eye,
  Download,
  Tag,
  Calendar,
  User
} from "lucide-react";
import { format } from "date-fns";

interface Document {
  id: number;
  fileName: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: number;
  category: string;
  relatedId?: number;
  relatedType?: string;
  description?: string;
  tags: string[];
  createdAt: string;
}

interface DocumentManagerProps {
  category?: string;
  relatedId?: number;
  relatedType?: string;
  showUpload?: boolean;
}

export default function DocumentManager({ 
  category = "general", 
  relatedId, 
  relatedType,
  showUpload = true 
}: DocumentManagerProps) {
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['/api/documents', selectedCategory, relatedId, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (relatedId) params.append('relatedId', relatedId.toString());
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/documents?${params}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to upload documents');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setUploadFiles([]);
      setUploadDescription("");
      setUploadTags("");
      toast({
        title: "Upload Successful",
        description: "Documents have been uploaded successfully"
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload documents",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return apiRequest('DELETE', `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document Deleted",
        description: "Document has been deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (uploadFiles.length === 0) return;

    const formData = new FormData();
    uploadFiles.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('category', selectedCategory);
    if (relatedId) formData.append('relatedId', relatedId.toString());
    if (relatedType) formData.append('relatedType', relatedType);
    if (uploadDescription) formData.append('description', uploadDescription);
    if (uploadTags) formData.append('tags', uploadTags);

    uploadMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'image') return <Image className="h-4 w-4" />;
    if (fileType === 'video') return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const documents = documentsData?.documents || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Document Manager</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="portfolio">Portfolio</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="profile">Profile</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          {showUpload && <TabsTrigger value="upload">Upload</TabsTrigger>}
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((document: Document) => (
                <Card key={document.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getFileIcon(document.fileType)}
                        <CardTitle className="text-sm truncate">{document.originalName}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewingDocument(document)}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(document.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(document.fileSize)}</span>
                      <Badge variant="outline" className="text-xs">
                        {document.category}
                      </Badge>
                    </div>
                    
                    {document.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {document.description}
                      </p>
                    )}
                    
                    {document.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {document.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Tag className="h-2 w-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {document.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{document.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents found</p>
            </div>
          )}
        </TabsContent>

        {showUpload && (
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select Files</Label>
                  <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">Click to upload files</p>
                      <p className="text-xs text-muted-foreground">Supports images and videos up to 50MB</p>
                    </label>
                  </div>
                </div>

                {uploadFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Files</Label>
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.type.startsWith('image/') ? 'image' : 'video')}
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Describe these documents..."
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (Optional)</Label>
                  <Input
                    id="tags"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    placeholder="Add tags separated by commas..."
                  />
                </div>

                <Button 
                  onClick={handleUpload}
                  disabled={uploadFiles.length === 0 || uploadMutation.isPending}
                  className="w-full"
                >
                  {uploadMutation.isPending ? "Uploading..." : `Upload ${uploadFiles.length} File(s)`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{viewingDocument.originalName}</h3>
                <Button
                  variant="ghost"
                  onClick={() => setViewingDocument(null)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                {viewingDocument.fileType === 'image' ? (
                  <img 
                    src={viewingDocument.fileUrl} 
                    alt={viewingDocument.originalName}
                    className="max-w-full h-auto rounded"
                  />
                ) : (
                  <video 
                    src={viewingDocument.fileUrl}
                    controls
                    className="max-w-full h-auto rounded"
                  />
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>File Size:</strong> {formatFileSize(viewingDocument.fileSize)}
                  </div>
                  <div>
                    <strong>Category:</strong> {viewingDocument.category}
                  </div>
                  <div>
                    <strong>Uploaded:</strong> {format(new Date(viewingDocument.createdAt), 'PPp')}
                  </div>
                  <div>
                    <strong>Type:</strong> {viewingDocument.mimeType}
                  </div>
                </div>
                
                {viewingDocument.description && (
                  <div>
                    <strong>Description:</strong>
                    <p className="mt-1 text-muted-foreground">{viewingDocument.description}</p>
                  </div>
                )}
                
                {viewingDocument.tags.length > 0 && (
                  <div>
                    <strong>Tags:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {viewingDocument.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}