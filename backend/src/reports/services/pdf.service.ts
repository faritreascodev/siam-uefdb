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
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
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
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    });

    await page.close();
    return Buffer.from(pdfBuffer);
  }

  private gradeLevelLabel(g: string): string {
    const map: Record<string, string> = {
      // Formato nuevo (canónico)
      'Inicial 1': 'Inicial 1 (3 años)',
      'Inicial 2': 'Inicial 2 (4 años)',
      '1ero EGB': '1ro Básico',
      '2do EGB': '2do Básico',
      '3ro EGB': '3ro Básico',
      '4to EGB': '4to Básico',
      '5to EGB': '5to Básico',
      '6to EGB': '6to Básico',
      '7mo EGB': '7mo Básico',
      '8vo EGB': '8vo Básico',
      '9no EGB': '9no Básico',
      '10mo EGB': '10mo Básico',
      '1ero BGU': '1ro Bachillerato',
      '2do BGU': '2do Bachillerato',
      '3ro BGU': '3ro Bachillerato',
      // Formato legado (retrocompatibilidad)
      'inicial_1': 'Inicial 1',
      'inicial_2': 'Inicial 2',
      '1ro_basico': '1ro Básico',
      '2do_basico': '2do Básico',
      '3ro_basico': '3ro Básico',
      '4to_basico': '4to Básico',
      '5to_basico': '5to Básico',
      '6to_basico': '6to Básico',
      '7mo_basico': '7mo Básico',
      '8vo_basico': '8vo Básico',
      '9no_basico': '9no Básico',
      '10mo_basico': '10mo Básico',
      '1ro_bachillerato': '1ro Bachillerato',
      '2do_bachillerato': '2do Bachillerato',
      '3ro_bachillerato': '3ro Bachillerato',
    };
    return map[g] || g || '—';
  }

  private specialtyLabel(s: string | null): string {
    if (!s) return 'N/A';
    const map: Record<string, string> = {
      // Formato nuevo
      'Ciencias': 'BGU Ciencias',
      'Técnico Informática': 'BGU Técnico en Informática',
      // Formato legado
      'CIENCIAS': 'BGU Ciencias',
      'TECNICO_INFORMATICA': 'BGU Técnico en Informática',
    };
    return map[s] || s;
  }

  private statusLabel(s: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Borrador',
      SUBMITTED: 'Enviada',
      UNDER_REVIEW: 'En Revisión',
      APPROVED: 'Aprobada',
      REJECTED: 'Rechazada',
      REQUIRES_CORRECTION: 'Requiere Corrección',
      MATRICULATED: 'Matriculada',
      CURSILLO_SCHEDULED: 'Cursillo Programado',
      CURSILLO_APPROVED: 'Cursillo Aprobado',
      CURSILLO_REJECTED: 'Cursillo Reprobado',
      PAYMENT_UPLOADED: 'Pago Cargado',
      PAYMENT_VALIDATED: 'Pago Validado',
    };
    return map[s] || s;
  }

  private statusColor(s: string): string {
    const colors: Record<string, string> = {
      MATRICULATED: '#166534',
      APPROVED: '#1e40af',
      CURSILLO_APPROVED: '#1e40af',
      REJECTED: '#991b1b',
      CURSILLO_REJECTED: '#991b1b',
      UNDER_REVIEW: '#92400e',
    };
    return colors[s] || '#374151';
  }

  private statusBg(s: string): string {
    const bgs: Record<string, string> = {
      MATRICULATED: '#dcfce7',
      APPROVED: '#dbeafe',
      CURSILLO_APPROVED: '#dbeafe',
      REJECTED: '#fee2e2',
      CURSILLO_REJECTED: '#fee2e2',
      UNDER_REVIEW: '#fef3c7',
    };
    return bgs[s] || '#f3f4f6';
  }

  private formatDate(d: string | Date | null, locale = 'es-EC'): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString(locale, {
        day: '2-digit', month: 'long', year: 'numeric',
      });
    } catch {
      return String(d);
    }
  }

  private getLogoBase64(): string {
    const paths = [
      path.join(__dirname, '..', 'assets', 'logo-uefdb.png'),
      path.join(process.cwd(), 'src', 'reports', 'assets', 'logo-uefdb.png'),
      path.join(process.cwd(), 'dist', 'reports', 'assets', 'logo-uefdb.png'),
    ];
    for (const p of paths) {
      try {
        if (fs.existsSync(p)) {
          return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
        }
      } catch { /* skip */ }
    }
    return '';
  }

  private getHtmlTemplate(app: any): string {
    const shiftLabel = (s: string) => s === 'MORNING' ? 'Matutina' : s === 'AFTERNOON' ? 'Vespertina' : s || '—';
    const genderLabel = (g: string) => g === 'M' ? 'Masculino' : g === 'F' ? 'Femenino' : g === 'OTHER' ? 'Otro' : g || '—';

    const logoSrc = this.getLogoBase64();
    const logoTag = logoSrc
      ? `<img src="${logoSrc}" style="height:56px; object-fit:contain;" alt="Logo UEFDB" />`
      : `<div style="width:56px;height:56px;background:#1e40af;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:10px;">UEFDB</div>`;

    const photoDoc = app.documents?.find((d: any) => d.documentType === 'STUDENT_PHOTO');
    const photoSrc = photoDoc
      ? (photoDoc.fileUrl.startsWith('http')
        ? photoDoc.fileUrl
        : `http://localhost:${process.env.PORT || 4000}${photoDoc.fileUrl}`)
      : null;
    const photoTag = photoSrc
      ? `<img src="${photoSrc}" style="width:90px;height:110px;object-fit:cover;border:2px solid #e5e7eb;border-radius:4px;" />`
      : `<div style="width:90px;height:110px;border:2px dashed #d1d5db;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:10px;text-align:center;">FOTO<br>ESTUDIANTE</div>`;

    const row = (label: string, value: string) =>
      `<tr><td style="padding:5px 8px;color:#6b7280;font-size:11px;width:40%;vertical-align:top;">${label}</td><td style="padding:5px 8px;font-size:12px;font-weight:500;color:#111827;">${value}</td></tr>`;

    const sectionTitle = (t: string, color = '#1e3a8a') =>
      `<div style="background:${color};color:#fff;padding:6px 12px;font-size:12px;font-weight:700;border-radius:4px 4px 0 0;margin-top:16px;letter-spacing:0.5px;">${t}</div>`;

    const table = (rows: string) =>
      `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 4px 4px;background:#fff;">${rows}</table>`;

    const nowStr = new Date().toLocaleDateString('es-EC', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; background: #fff; font-size: 12px; line-height: 1.5; }
    tr:nth-child(even) td { background: #f9fafb; }
    @page { size: A4; margin: 15mm; }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1e3a8a;padding-bottom:12px;margin-bottom:16px;">
    <div style="display:flex;align-items:center;gap:12px;">
      ${logoTag}
      <div>
        <div style="font-size:16px;font-weight:700;color:#1e3a8a;">Unidad Educativa Fiscomisional Don Bosco</div>
        <div style="font-size:11px;color:#6b7280;">Sistema Integrado de Admisiones y Matrículas</div>
        <div style="font-size:11px;color:#6b7280;">Período Lectivo 2026–2027</div>
      </div>
    </div>
    <div>
      ${photoTag}
    </div>
  </div>

  <!-- TÍTULO + ESTADO -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
    <div>
      <div style="font-size:18px;font-weight:700;color:#111827;">Ficha de Admisión</div>
      <div style="font-size:11px;color:#6b7280;">ID: ${app.id}</div>
    </div>
    <div style="background:${this.statusBg(app.status)};color:${this.statusColor(app.status)};padding:6px 14px;border-radius:20px;font-weight:700;font-size:13px;border:1px solid currentColor;">
      ${this.statusLabel(app.status)}
    </div>
  </div>

  <!-- DATOS DEL ESTUDIANTE -->
  ${sectionTitle('INFORMACIÓN DEL ESTUDIANTE')}
  ${table(`
    ${row('Apellidos', (app.studentLastName || '—').toUpperCase())}
    ${row('Nombres', (app.studentFirstName || '—').toUpperCase())}
    ${row('Cédula / Pasaporte', app.studentCedula || '—')}
    ${row('Fecha de Nacimiento', this.formatDate(app.studentBirthDate))}
    ${row('Género', genderLabel(app.studentGender))}
    ${row('Nacionalidad', app.studentNationality || '—')}
    ${row('Dirección', app.studentAddress || '—')}
    ${app.studentEmail ? row('Correo Electrónico', app.studentEmail) : ''}
    ${app.studentPhone ? row('Teléfono', app.studentPhone) : ''}
  `)}

  <!-- DATOS ACADÉMICOS -->
  ${sectionTitle('DATOS ACADÉMICOS', '#1e40af')}
  ${table(`
    ${row('Grado Solicitado', this.gradeLevelLabel(app.gradeLevel))}
    ${row('Jornada', shiftLabel(app.shift))}
    ${row('Especialidad', this.specialtyLabel(app.specialty))}
    ${row('Institución de Procedencia', app.previousSchool || '—')}
    ${row('Promedio Año Anterior', app.lastYearAverage != null ? Number(app.lastYearAverage).toFixed(2) : '—')}
    ${app.assignedParallel ? row('Paralelo Asignado', app.assignedParallel) : ''}
  `)}

  <!-- REPRESENTANTE LEGAL -->
  ${sectionTitle('REPRESENTANTE LEGAL', '#065f46')}
  ${table(`
    ${row('Nombres y Apellidos', app.representativeData?.names || '—')}
    ${row('Cédula', app.representativeData?.cedula || '—')}
    ${row('Teléfono', app.representativeData?.phone || '—')}
    ${row('Correo Electrónico', app.representativeData?.email || '—')}
    ${row('Ocupación / Empresa', app.representativeData?.occupation || '—')}
    ${app.representativeData?.address ? row('Dirección', app.representativeData.address) : ''}
  `)}

  ${app.fatherData ? `
  <!-- PADRE -->
  ${sectionTitle('DATOS DEL PADRE', '#4c1d95')}
  ${table(`
    ${row('Nombres y Apellidos', app.fatherData.names || '—')}
    ${row('Cédula', app.fatherData.cedula || '—')}
    ${row('Teléfono', app.fatherData.phone || '—')}
    ${app.fatherData.email ? row('Correo Electrónico', app.fatherData.email) : ''}
    ${app.fatherData.occupation ? row('Ocupación', app.fatherData.occupation) : ''}
  `)}` : ''}

  ${app.motherData ? `
  <!-- MADRE -->
  ${sectionTitle('DATOS DE LA MADRE', '#4c1d95')}
  ${table(`
    ${row('Nombres y Apellidos', app.motherData.names || '—')}
    ${row('Cédula', app.motherData.cedula || '—')}
    ${row('Teléfono', app.motherData.phone || '—')}
    ${app.motherData.email ? row('Correo Electrónico', app.motherData.email) : ''}
    ${app.motherData.occupation ? row('Ocupación', app.motherData.occupation) : ''}
  `)}` : ''}

  <!-- INFORMACIÓN DEL PROCESO -->
  ${sectionTitle('INFORMACIÓN DEL PROCESO', '#374151')}
  ${table(`
    ${row('Fecha de Envío', this.formatDate(app.submittedAt))}
    ${app.paymentDate ? row('Fecha de Pago', this.formatDate(app.paymentDate)) : ''}
    ${app.paymentReference ? row('Referencia de Pago', app.paymentReference) : ''}
    ${app.processedAt ? row('Fecha de Procesado', this.formatDate(app.processedAt)) : ''}
    ${row('Acepta Ideario Institucional', app.acceptedIdeario ? 'Sí' : 'No')}
  `)}

  <!-- FIRMA -->
  <div style="margin-top:40px;display:flex;justify-content:space-between;gap:20px;">
    <div style="text-align:center;flex:1;">
      <div style="border-top:1px solid #374151;padding-top:6px;font-size:11px;color:#374151;">
        <div style="font-weight:600;">Representante Legal</div>
        <div style="color:#6b7280;">${app.representativeData?.names || '________________________'}</div>
        <div style="color:#6b7280;">C.I.: ${app.representativeData?.cedula || '___________________'}</div>
      </div>
    </div>
    <div style="text-align:center;flex:1;">
      <div style="border-top:1px solid #374151;padding-top:6px;font-size:11px;color:#374151;">
        <div style="font-weight:600;">Secretaría / Responsable</div>
        <div style="color:#6b7280;">________________________</div>
        <div style="color:#6b7280;">Cargo: ___________________</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:8px;text-align:center;font-size:9px;color:#9ca3af;">
    <p>Documento generado el ${nowStr} | Sistema SIAM — UEFDB</p>
    <p>Este documento es un comprobante oficial de la solicitud No. ${app.id}. Cualquier modificación no autorizada lo invalida.</p>
  </div>

</body>
</html>`;
  }
}
