import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API SIAM UEFDB</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            background-color: white;
            padding: 2.5rem 3rem;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            max-width: 32rem;
            text-align: center;
            border-top: 4px solid #0f172a;
          }
          h1 {
            color: #0f172a;
            margin-top: 0;
            font-size: 1.5rem;
            font-weight: 600;
          }
          p {
            line-height: 1.6;
            margin-bottom: 1.5rem;
            font-size: 0.95rem;
          }
          .env-badge {
            display: inline-block;
            background-color: #e2e8f0;
            color: #475569;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 1rem;
          }
          .btn-container {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          .btn {
            display: inline-block;
            background-color: #0f172a;
            color: white;
            padding: 0.6rem 1.2rem;
            border-radius: 0.375rem;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.9rem;
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #1e293b;
          }
          .btn-outline {
            background-color: transparent;
            color: #0f172a;
            border: 1px solid #cbd5e1;
          }
          .btn-outline:hover {
            background-color: #f1f5f9;
          }
          footer {
            margin-top: 2rem;
            font-size: 0.8rem;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="env-badge">Core Backend</div>
          <h1>Sistema Académico (SIAM)</h1>
          <p>
            Bienvenido al servicio principal del Sistema Académico de la Unidad Educativa Fiscomisional Don Bosco.
            La API se encuentra operativa y en línea.
          </p>
          <div class="btn-container">
            <a href="/api/docs" class="btn">Documentación Swagger</a>
          </div>
          <footer>
            &copy; ${new Date().getFullYear()} UEFDB. Todos los derechos reservados.
          </footer>
        </div>
      </body>
      </html>
    `;
  }
}


