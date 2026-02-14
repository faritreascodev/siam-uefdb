import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Request,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentType } from '@prisma/client';
import * as fs from 'fs';

@Controller('applications/:applicationId/documents')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  // Subir documento
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  uploadDocument(
    @Param('applicationId') applicationId: string,
    @Body('documentType') documentType: DocumentType,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.uploadsService.uploadDocument(
      applicationId,
      req.user.id,
      documentType,
      file,
    );
  }

  // Listar documentos de una solicitud
  @Get()
  getDocuments(@Param('applicationId') applicationId: string) {
    return this.uploadsService.getDocuments(applicationId);
  }

  // Eliminar documento
  @Delete(':documentId')
  deleteDocument(
    @Param('documentId') documentId: string,
    @Request() req: any,
  ) {
    return this.uploadsService.deleteDocument(documentId, req.user.id);
  }

  // Descargar/ver documento
  @Get(':documentId/download')
  async downloadDocument(
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const documents = await this.uploadsService.getDocuments('');
    // Buscar el documento por ID
    const document = await this.uploadsService['prisma'].applicationDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    const filePath = this.uploadsService.getFilePath(document.fileUrl);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado en el servidor');
    }

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
