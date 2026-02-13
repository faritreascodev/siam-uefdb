'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { ApplicationDocument, DocumentType, DOCUMENT_LABELS } from '@/types/application';
import { uploadDocument, deleteDocument } from '@/lib/api-applications';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  Image, 
  Trash2, 
  Check, 
  AlertCircle,
  Loader2,
  Eye 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentsFormProps {
  applicationId: string;
  documents: ApplicationDocument[];
}

const REQUIRED_DOCUMENTS: { type: DocumentType; accept: string }[] = [
  { type: 'STUDENT_ID', accept: '.pdf,.jpg,.jpeg,.png' },
  { type: 'REPRESENTATIVE_ID', accept: '.pdf,.jpg,.jpeg,.png' },
  { type: 'STUDENT_PHOTO', accept: '.jpg,.jpeg,.png' },
  { type: 'GRADE_CERTIFICATE', accept: '.pdf,.jpg,.jpeg,.png' },
  { type: 'UTILITY_BILL', accept: '.pdf,.jpg,.jpeg,.png' },
];

export function DocumentsForm({ applicationId, documents: initialDocuments }: DocumentsFormProps) {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<ApplicationDocument[]>(initialDocuments);
  const [uploading, setUploading] = useState<DocumentType | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // @ts-ignore
  const token = session?.accessToken || session?.user?.accessToken;

  const getDocumentByType = (type: DocumentType) => 
    documents.find(doc => doc.documentType === type);

  const handleFileSelect = async (type: DocumentType, file: File) => {
    if (!token) return;

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo excede el tamaño máximo de 5MB');
      return;
    }

    // Validar tipo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Use PDF, JPG o PNG');
      return;
    }

    // Validación específica para Foto (NO PDF)
    if (type === 'STUDENT_PHOTO' && file.type === 'application/pdf') {
      toast.error('La foto debe ser una imagen (JPG o PNG), no PDF.');
      return;
    }

    setUploading(type);
    try {
      const newDoc = await uploadDocument(token, applicationId, type, file);
      setDocuments(prev => {
        // Reemplazar si ya existe uno del mismo tipo
        const filtered = prev.filter(d => d.documentType !== type);
        return [...filtered, newDoc];
      });
      toast.success('Documento subido correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir documento');
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (documentId: string, type: DocumentType) => {
    if (!token) return;

    setDeleting(documentId);
    try {
      await deleteDocument(token, applicationId, documentId);
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      toast.success('Documento eliminado');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar documento');
    } finally {
      setDeleting(null);
    }
  };

  const completedCount = REQUIRED_DOCUMENTS.filter(
    req => documents.some(doc => doc.documentType === req.type)
  ).length;

  const progress = (completedCount / REQUIRED_DOCUMENTS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Barra de progreso */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progreso de documentos</span>
          <span className="text-muted-foreground">
            {completedCount} de {REQUIRED_DOCUMENTS.length} completados
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Lista de documentos */}
      <div className="space-y-4">
        {REQUIRED_DOCUMENTS.map(({ type, accept }) => {
          const existingDoc = getDocumentByType(type);
          const isUploading = uploading === type;

          return (
            <Card 
              key={type}
              className={cn(
                "transition-colors",
                existingDoc && "border-green-200 bg-green-50/50"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Icono o Preview */}
                    {type === 'STUDENT_PHOTO' && existingDoc ? (
                      <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-green-200 relative bg-gray-100 shrink-0">
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         <img 
                           src={`${process.env.NEXT_PUBLIC_API_URL}${existingDoc.fileUrl}`} 
                           alt="Foto del estudiante"
                           className="h-full w-full object-cover"
                         />
                      </div>
                    ) : (
                      existingDoc ? (
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <Check className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <AlertCircle className="h-5 w-5 text-gray-400" />
                        </div>
                      )
                    )}
                    
                    <div>
                      <p className="font-medium">{DOCUMENT_LABELS[type]}</p>
                      {existingDoc ? (
                        <p className="text-sm text-muted-foreground line-clamp-1 break-all">
                          {existingDoc.fileName} ({formatFileSize(existingDoc.fileSize)})
                        </p>
                      ) : (
                        <div className="flex flex-col">
                           <p className="text-sm text-orange-600">Pendiente</p>
                           {type === 'STUDENT_PHOTO' && (
                             <p className="text-xs text-muted-foreground">Formato JPG/PNG, fondo blanco, rostro despejado.</p>
                           )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {existingDoc && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(
                            `${process.env.NEXT_PUBLIC_API_URL}${existingDoc.fileUrl}`,
                            '_blank'
                          )}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(existingDoc.id, type)}
                          disabled={deleting === existingDoc.id}
                        >
                          {deleting === existingDoc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </>
                    )}

                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[type] = el; }}
                      accept={accept}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelect(type, file);
                          e.target.value = '';
                        }
                      }}
                    />

                    <Button
                      variant={existingDoc ? "outline" : "default"}
                      size="sm"
                      onClick={() => fileInputRefs.current[type]?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {existingDoc ? 'Reemplazar' : 'Subir'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Todos los documentos son obligatorios para enviar la solicitud. 
          Formatos aceptados: PDF, JPG, PNG. Tamaño máximo: 5MB por archivo.
        </p>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
