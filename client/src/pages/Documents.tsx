import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Project, type Document } from "@shared/schema";
import { Plus, Search, Upload, FileText, File, Image, FileVideo, Download } from "lucide-react";

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents"],
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsDialogOpen(false);
      toast({
        title: "Documento subido",
        description: "El documento se ha subido exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo subir el documento.",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      category: "general",
      projectId: "",
      file: null as File | null,
    },
  });

  const onSubmit = (data: any) => {
    if (!data.file) {
      toast({
        title: "Error",
        description: "Debe seleccionar un archivo.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('name', data.name || data.file.name);
    formData.append('category', data.category);
    if (data.projectId) {
      formData.append('projectId', data.projectId);
    }

    uploadDocumentMutation.mutate(formData);
  };

  const filteredDocuments = documents?.filter((doc: Document) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return FileVideo;
    if (mimeType?.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProjectName = (projectId: string) => {
    const project = projects?.find((p: Project) => p.id === projectId);
    return project?.name || "Sin proyecto";
  };

  if (documentsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Documentos</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600">Gestión de archivos y documentos del proyecto</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Subir Nuevo Documento</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Documento</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del documento..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="planos">Planos</SelectItem>
                            <SelectItem value="permisos">Permisos</SelectItem>
                            <SelectItem value="contratos">Contratos</SelectItem>
                            <SelectItem value="financiero">Financiero</SelectItem>
                            <SelectItem value="legal">Legal</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proyecto (Opcional)</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar proyecto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sin proyecto específico</SelectItem>
                            {projects?.map((project: Project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Archivo</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            field.onChange(file);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={uploadDocumentMutation.isPending}>
                    {uploadDocumentMutation.isPending ? "Subiendo..." : "Subir"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="planos">Planos</SelectItem>
            <SelectItem value="permisos">Permisos</SelectItem>
            <SelectItem value="contratos">Contratos</SelectItem>
            <SelectItem value="financiero">Financiero</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Grid */}
      {filteredDocuments?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay documentos
            </h3>
            <p className="text-gray-600">
              {searchTerm || categoryFilter !== "all" ? "No se encontraron documentos con los filtros aplicados." : "Comienza subiendo tu primer documento."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments?.map((document: Document) => {
            const FileIcon = getFileIcon(document.mimeType || '');
            return (
              <Card key={document.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">{document.name}</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">
                        {document.category?.charAt(0).toUpperCase() + document.category?.slice(1)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {document.projectId && (
                    <div className="text-sm">
                      <span className="text-gray-600">Proyecto: </span>
                      <span className="font-medium">{getProjectName(document.projectId)}</span>
                    </div>
                  )}
                  
                  <div className="text-sm">
                    <span className="text-gray-600">Archivo: </span>
                    <span className="font-medium">{document.fileName}</span>
                  </div>
                  
                  {document.fileSize && (
                    <div className="text-sm">
                      <span className="text-gray-600">Tamaño: </span>
                      <span className="font-medium">{formatFileSize(document.fileSize)}</span>
                    </div>
                  )}
                  
                  <div className="text-sm">
                    <span className="text-gray-600">Subido: </span>
                    <span className="font-medium">
                      {new Date(document.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="pt-2">
                    <Button size="sm" variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
