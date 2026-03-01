import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Browser } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser;

  async onModuleInit() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async generateApplicationPdf(application: any): Promise<Buffer> {
    const page = await this.browser.newPage();

    const htmlContent = this.getHtmlTemplate(application);
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await page.close();
    return Buffer.from(pdfBuffer);
  }

  private getHtmlTemplate(app: any): string {
    // Helpers de traducción
    const shiftLabel = (s: string) => s === 'MORNING' ? 'Matutina' : s === 'AFTERNOON' ? 'Vespertina' : s || '-';
    const genderLabel = (g: string) => g === 'M' ? 'Masculino' : g === 'F' ? 'Femenino' : g || '-';
    const specialtyLabel = (s: string) => s === 'CIENCIAS' ? 'BGU Ciencias' : s === 'TECNICO_INFORMATICA' ? 'BGU Técnico Informática' : s || 'N/A';
    const statusLabel = (s: string) => ({
      DRAFT: 'Borrador', SUBMITTED: 'Enviada', UNDER_REVIEW: 'En Revisión', APPROVED: 'Aprobada',
      REJECTED: 'Rechazada', REQUIRES_CORRECTION: 'Requiere Corrección', MATRICULATED: 'Matriculada',
      CURSILLO_SCHEDULED: 'Cursillo Programado', CURSILLO_APPROVED: 'Cursillo Aprobado',
      PAYMENT_UPLOADED: 'Pago Cargado', PAYMENT_VALIDATED: 'Pago Validado',
    })[s] || s;
    const gradeLevelLabel = (g: string) => ({
      'inicial_1': 'Inicial 1', 'inicial_2': 'Inicial 2',
      '1ro_basico': '1ro Básico', '2do_basico': '2do Básico', '3ro_basico': '3ro Básico',
      '4to_basico': '4to Básico', '5to_basico': '5to Básico', '6to_basico': '6to Básico',
      '7mo_basico': '7mo Básico', '8vo_basico': '8vo Básico', '9no_basico': '9no Básico',
      '10mo_basico': '10mo Básico', '1ro_bachillerato': '1ro Bachillerato',
      '2do_bachillerato': '2do Bachillerato', '3ro_bachillerato': '3ro Bachillerato',
    })[g] || g || '-';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          .header h1 { color: #2563eb; margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .section { margin-bottom: 20px; }
          .section-title { background-color: #f3f4f6; padding: 5px 10px; font-weight: bold; border-left: 4px solid #2563eb; margin-bottom: 10px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .field { margin-bottom: 5px; }
          .label { font-weight: bold; color: #555; display: block; font-size: 11px; }
          .value { display: block; border-bottom: 1px solid #eee; padding-bottom: 2px; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
          .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
          .status-APPROVED { background-color: #dcfce7; color: #166534; }
          .status-SUBMITTED { background-color: #dbeafe; color: #1e40af; }
          .status-REJECTED { background-color: #fee2e2; color: #991b1b; }
          .tag { background: #eee; padding: 2px 5px; border-radius: 3px; font-size: 10px; margin-right: 5px; }
        </style>
      </head>
      <body>
        <div class="header" style="position: relative;">
          ${(() => {
        try {
          // Intenta cargar el logo local
          const logoPath = path.join(__dirname, '..', 'assets', 'logo-uefdb.png');
          if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            const base64Logo = logoBuffer.toString('base64');
            return `<img src="data:image/png;base64,${base64Logo}" style="position: absolute; left: 0; top: 0; height: 60px;" />`;
          } else {
            // Fallback for when running directly from src without Nest CLI assets setup yet
            const fallbackPath = path.join(process.cwd(), 'src', 'reports', 'assets', 'logo-uefdb.png');
            if (fs.existsSync(fallbackPath)) {
              const logoBuffer = fs.readFileSync(fallbackPath);
              const base64Logo = logoBuffer.toString('base64');
              return `<img src="data:image/png;base64,${base64Logo}" style="position: absolute; left: 0; top: 0; height: 60px;" />`;
            }
          }
        } catch (e) {
          console.error("No se pudo cargar el logo", e);
        }
        return '';
      })()}
          
          <h1>Ficha de Admisión</h1>
          <p>Unidad Educativa Fiscomisional Don Bosco</p>
          <p>Periodo Lectivo 2026 - 2027</p>
          <div style="margin-top: 10px;">
            <span class="status-badge">${statusLabel(app.status)}</span>
          </div>

          ${(() => {
        const photoDoc = app.documents?.find((d: any) => d.documentType === 'STUDENT_PHOTO');
        if (photoDoc) {
          // Ensure we use the correct backend URL for the image
          const photoUrl = photoDoc.fileUrl.startsWith('http') ? photoDoc.fileUrl : `http://localhost:${process.env.PORT || 4000}${photoDoc.fileUrl}`;
          return `<img src="${photoUrl}" style="position: absolute; right: 0; top: 0; width: 80px; height: 100px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px;" />`;
        }
        return '<div style="position: absolute; right: 0; top: 0; width: 80px; height: 100px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 10px;">FOTO</div>';
      })()}
        </div>

        <div class="section">
          <div class="section-title">Información del Estudiante</div>
          <div class="grid">
            <div class="field"><span class="label">Nombres:</span> <span class="value">${app.studentFirstName || '-'}</span></div>
            <div class="field"><span class="label">Apellidos:</span> <span class="value">${app.studentLastName || '-'}</span></div>
            <div class="field"><span class="label">Cédula:</span> <span class="value">${app.studentCedula || '-'}</span></div>
            <div class="field"><span class="label">Fecha Nacimiento:</span> <span class="value">${app.studentBirthDate ? new Date(app.studentBirthDate).toLocaleDateString() : '-'}</span></div>
            <div class="field"><span class="label">Género:</span> <span class="value">${genderLabel(app.studentGender)}</span></div>
            <div class="field"><span class="label">Dirección:</span> <span class="value">${app.studentAddress || '-'}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Datos Académicos</div>
          <div class="grid">
            <div class="field"><span class="label">Grado Solicitado:</span> <span class="value">${gradeLevelLabel(app.gradeLevel)}</span></div>
            <div class="field"><span class="label">Jornada:</span> <span class="value">${shiftLabel(app.shift)}</span></div>
            <div class="field"><span class="label">Especialidad:</span> <span class="value">${specialtyLabel(app.specialty)}</span></div>
            <div class="field"><span class="label">Institución Anterior:</span> <span class="value">${app.previousSchool || '-'}</span></div>
            <div class="field"><span class="label">Promedio Anterior:</span> <span class="value">${app.lastYearAverage != null ? Number(app.lastYearAverage).toFixed(2) : '-'}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Representante Legal</div>
          <div class="grid">
            <div class="field"><span class="label">Nombres:</span> <span class="value">${app.representativeData?.names || '-'}</span></div>
            <div class="field"><span class="label">Cédula:</span> <span class="value">${app.representativeData?.cedula || '-'}</span></div>
            <div class="field"><span class="label">Teléfono:</span> <span class="value">${app.representativeData?.phone || '-'}</span></div>
            <div class="field"><span class="label">Email:</span> <span class="value">${app.representativeData?.email || '-'}</span></div>
            <div class="field"><span class="label">Ocupación:</span> <span class="value">${app.representativeData?.occupation || '-'}</span></div>
          </div>
        </div>

        ${app.fatherData ? `
        <div class="section">
          <div class="section-title">Datos del Padre</div>
          <div class="grid">
            <div class="field"><span class="label">Nombres:</span> <span class="value">${app.fatherData.names || '-'}</span></div>
            <div class="field"><span class="label">Cédula:</span> <span class="value">${app.fatherData.cedula || '-'}</span></div>
            <div class="field"><span class="label">Teléfono:</span> <span class="value">${app.fatherData.phone || '-'}</span></div>
          </div>
        </div>` : ''}

        ${app.motherData ? `
        <div class="section">
          <div class="section-title">Datos de la Madre</div>
          <div class="grid">
            <div class="field"><span class="label">Nombres:</span> <span class="value">${app.motherData.names || '-'}</span></div>
            <div class="field"><span class="label">Cédula:</span> <span class="value">${app.motherData.cedula || '-'}</span></div>
            <div class="field"><span class="label">Teléfono:</span> <span class="value">${app.motherData.phone || '-'}</span></div>
          </div>
        </div>` : ''}

        <div class="footer">
          <p>Generado el ${new Date().toLocaleString()} | ID: ${app.id}</p>
          <p>Este documento es un comprobante de la solicitud de admisión.</p>
        </div>
      </body>
      </html>
    `;
  }
}
