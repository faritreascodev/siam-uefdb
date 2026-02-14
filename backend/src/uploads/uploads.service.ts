import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  // Directorio base para uploads
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'applications');

  constructor(private prisma: PrismaService) {
    // Crear directorio de uploads si no existe
    this.ensureUploadsDir();
  }

  private ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  // Tipos MIME permitidos
  private readonly allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  // Tamaño máximo (5MB)
  private readonly maxFileSize = 5 * 1024 * 1024;

  // Validar archivo
  validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Formato no permitido. Use: ${this.allowedMimeTypes.join(', ')}`
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `El archivo excede el tamaño máximo de ${this.maxFileSize / (1024 * 1024)}MB`
      );
    }
  }

  // Subir documento
  async uploadDocument(
    applicationId: string,
    userId: string,
    documentType: DocumentType,
    file: Express.Multer.File,
  ) {
    // Verificar que la solicitud existe y pertenece al usuario
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (application.userId !== userId) {
      throw new BadRequestException('No tienes permiso para subir archivos a esta solicitud');
    }

    // Solo permitir uploads en estado DRAFT o REQUIRES_CORRECTION
    if (!['DRAFT', 'REQUIRES_CORRECTION'].includes(application.status)) {
      throw new BadRequestException('Solo se pueden subir documentos a solicitudes en borrador');
    }

    // Validar archivo
    this.validateFile(file);

    // Crear directorio para esta solicitud
    const appDir = path.join(this.uploadsDir, applicationId);
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    // Generar nombre de archivo único
    const ext = path.extname(file.originalname);
    const fileName = `${documentType}_${Date.now()}${ext}`;
    const filePath = path.join(appDir, fileName);

    // Guardar archivo
    fs.writeFileSync(filePath, file.buffer);

    // Eliminar documento anterior del mismo tipo si existe
    await this.prisma.applicationDocument.deleteMany({
      where: {
        applicationId,
        documentType,
      },
    });

    // Crear registro en BD
    const document = await this.prisma.applicationDocument.create({
      data: {
        applicationId,
        documentType,
        fileName: file.originalname,
        fileUrl: `/uploads/applications/${applicationId}/${fileName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    return document;
  }

  // Obtener documentos de una solicitud
  async getDocuments(applicationId: string) {
    return this.prisma.applicationDocument.findMany({
      where: { applicationId },
    });
  }

  // Eliminar documento
  async deleteDocument(documentId: string, userId: string) {
    const document = await this.prisma.applicationDocument.findUnique({
      where: { id: documentId },
      include: { application: true },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    if (document.application.userId !== userId) {
      throw new BadRequestException('No tienes permiso para eliminar este documento');
    }

    // Eliminar archivo físico
    const filePath = path.join(process.cwd(), document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar registro de BD
    await this.prisma.applicationDocument.delete({
      where: { id: documentId },
    });

    return { message: 'Documento eliminado correctamente' };
  }

  // Obtener ruta de archivo para descarga
  getFilePath(fileUrl: string): string {
    return path.join(process.cwd(), fileUrl);
  }
}
