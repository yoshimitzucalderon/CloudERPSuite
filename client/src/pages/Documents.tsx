import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Share2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileImage,
  FileSpreadsheet,
  File,
  Plus,
  MoreHorizontal,
  History,
  Users,
  Lock,
  Unlock,
  Star,
  Archive,
  Tag,
  Calendar,
  Settings,
  Zap,
  Brain
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Documents() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
    project: 'all'
  });

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/documents', filters],
  });

  // Fetch document templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/document-templates'],
  });

  // Fetch projects for filtering
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setShowUploadDialog(false);
    },
  });

  // Start approval workflow mutation
  const startApprovalMutation = useMutation({
    mutationFn: async ({ documentId, workflow }: any) => {
      return await apiRequest(`/api/documents/${documentId}/approval`, {
        method: 'POST',
        body: JSON.stringify(workflow),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setShowApprovalDialog(false);
    },
  });

  if (documentsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return <FileImage className="h-5 w-5" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprobado': return 'default';
      case 'revision': return 'secondary';
      case 'rechazado': return 'destructive';
      case 'borrador': return 'outline';
      case 'archivado': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprobado': return <CheckCircle className="h-3 w-3" />;
      case 'revision': return <Clock className="h-3 w-3" />;
      case 'rechazado': return <XCircle className="h-3 w-3" />;
      case 'borrador': return <Edit className="h-3 w-3" />;
      case 'archivado': return <Archive className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión Documental</h1>
          <p className="text-gray-600">OCR automático, versionado y flujos de aprobación</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Subir Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Subir Nuevo Documento</DialogTitle>
              </DialogHeader>
              <DocumentUploadForm 
                onSubmit={(data) => {
                  const formData = new FormData();
                  Object.entries(data).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                      if (key === 'tags' && Array.isArray(value)) {
                        formData.append(key, JSON.stringify(value));
                      } else {
                        formData.append(key, value.toString());
                      }
                    }
                  });
                  uploadMutation.mutate(formData);
                }}
                isLoading={uploadMutation.isPending}
                projects={projects || []}
              />
            </DialogContent>
          </Dialog>
          
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar documentos por nombre, contenido OCR o descripción..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select 
                value={filters.category} 
                onValueChange={(value) => setFilters({ ...filters, category: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="contrato">Contratos</SelectItem>
                  <SelectItem value="plano">Planos</SelectItem>
                  <SelectItem value="permiso">Permisos</SelectItem>
                  <SelectItem value="presupuesto">Presupuestos</SelectItem>
                  <SelectItem value="factura">Facturas</SelectItem>
                  <SelectItem value="certificado">Certificados</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="revision">En Revisión</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Más Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="library" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="library">Biblioteca</TabsTrigger>
          <TabsTrigger value="approvals">Aprobaciones</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Document Library */}
        <TabsContent value="library" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(documents) && documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer" 
                    onClick={() => setSelectedDocument(doc)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getFileIcon(doc.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{doc.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          v{doc.version} • {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(doc.status)} className="text-xs">
                      {getStatusIcon(doc.status)}
                      <span className="ml-1">{doc.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {doc.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {doc.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{doc.category}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* OCR Status */}
                    {doc.ocrStatus && (
                      <div className="flex items-center space-x-2">
                        <Brain className="h-3 w-3 text-purple-500" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>OCR: {doc.ocrStatus}</span>
                            {doc.ocrConfidence && (
                              <span>{Math.round(doc.ocrConfidence * 100)}%</span>
                            )}
                          </div>
                          {doc.ocrStatus === 'processing' && (
                            <Progress value={65} className="h-1 mt-1" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.slice(0, 3).map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            +{doc.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        <Download className="h-3 w-3 mr-1" />
                        Descargar
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!Array.isArray(documents) || documents.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No hay documentos</h3>
                <p className="text-muted-foreground mb-4">
                  Sube tu primer documento para comenzar
                </p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Documento
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Document Approvals */}
        <TabsContent value="approvals" className="space-y-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documentos Pendientes de Aprobación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock approval items */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="font-medium text-sm">Contrato de Compraventa - Lote 15</h4>
                        <p className="text-xs text-muted-foreground">
                          Requiere aprobación legal • Vence en 2 días
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Revisar</Button>
                      <Button size="sm">Aprobar</Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileImage className="h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium text-sm">Planos Arquitectónicos - Torre B</h4>
                        <p className="text-xs text-muted-foreground">
                          Requiere aprobación técnica • Vence en 5 días
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Revisar</Button>
                      <Button size="sm">Aprobar</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Document Templates */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(templates) && templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      {Array.isArray(template.fields) ? template.fields.length : 0} campos configurables
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Usar Plantilla
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!Array.isArray(templates) || templates.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No hay plantillas configuradas</h3>
                <p className="text-muted-foreground mb-4">
                  Crea plantillas para agilizar la creación de documentos
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Plantilla
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Document Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Documentos</p>
                    <p className="text-2xl font-bold">1,248</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">En Aprobación</p>
                    <p className="text-2xl font-bold">23</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">OCR Procesados</p>
                    <p className="text-2xl font-bold">956</p>
                  </div>
                  <Brain className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Almacenamiento</p>
                    <p className="text-2xl font-bold">2.4 GB</p>
                  </div>
                  <Archive className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onStartApproval={(workflow) => {
            startApprovalMutation.mutate({
              documentId: selectedDocument.id,
              workflow
            });
          }}
        />
      )}
    </main>
  );
}

// Component for document upload form
function DocumentUploadForm({ onSubmit, isLoading, projects }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'contrato',
    projectId: 'none',
    tags: [],
    file: null as File | null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Archivo</Label>
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setFormData({ ...formData, file, name: formData.name || file.name });
            }
          }}
          required
        />
      </div>
      
      <div>
        <Label>Nombre del Documento</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nombre descriptivo del documento"
          required
        />
      </div>
      
      <div>
        <Label>Descripción</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción opcional del documento"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Categoría</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contrato">Contrato</SelectItem>
              <SelectItem value="plano">Plano</SelectItem>
              <SelectItem value="permiso">Permiso</SelectItem>
              <SelectItem value="presupuesto">Presupuesto</SelectItem>
              <SelectItem value="factura">Factura</SelectItem>
              <SelectItem value="certificado">Certificado</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Proyecto</Label>
          <Select
            value={formData.projectId}
            onValueChange={(value) => setFormData({ ...formData, projectId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin proyecto</SelectItem>
              {Array.isArray(projects) && projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !formData.file}>
          {isLoading ? 'Subiendo...' : 'Subir Documento'}
        </Button>
      </div>
    </form>
  );
}

// Component for document detail modal
function DocumentDetailModal({ document, onClose, onStartApproval }: any) {
  return (
    <Dialog open={!!document} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getFileIcon(document.mimeType)}
            <span>{document.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Document metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Versión:</span> {document.version}
            </div>
            <div>
              <span className="font-medium">Tamaño:</span> {formatFileSize(document.fileSize)}
            </div>
            <div>
              <span className="font-medium">Estado:</span>
              <Badge variant={getStatusColor(document.status)} className="ml-2">
                {document.status}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Creado:</span> {new Date(document.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* OCR Content */}
          {document.extractedText && (
            <div>
              <h3 className="font-medium mb-2 flex items-center">
                <Brain className="h-4 w-4 mr-2 text-purple-500" />
                Contenido OCR (Confianza: {Math.round((document.ocrConfidence || 0) * 100)}%)
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm max-h-40 overflow-y-auto">
                {document.extractedText}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
            <Button variant="outline">
              <History className="h-4 w-4 mr-2" />
              Ver Versiones
            </Button>
            <Button onClick={() => onStartApproval({ name: 'Aprobación Estándar' })}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Iniciar Aprobación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('image')) return <FileImage className="h-4 w-4" />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'aprobado': return 'default';
    case 'revision': return 'secondary';
    case 'rechazado': return 'destructive';
    case 'borrador': return 'outline';
    case 'archivado': return 'secondary';
    default: return 'outline';
  }
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}