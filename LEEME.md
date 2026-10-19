# Horarios · Pregrado — sitio publicable

## Estructura
```
horarios-pregrado/
├─ index.html              portada (2 tarjetas)
├─ laboratorios.html       Horarios de laboratorios y talleres
├─ explorador.html         Explorador de horarios
├─ assets/
│  ├─ css/  portal.css · laboratorios.css · explorador.css
│  └─ js/   datos.js (carga y une los datos) · laboratorios.js · explorador.js
├─ datos/                  ← lo que lee el sitio (se publica)
│  ├─ horarios.json        GENERADO por el script  (no editar)
│  ├─ meta.json            GENERADO: fecha, periodo, advertencias
│  ├─ ambientes.csv        exportación de la hoja MATRIZ de Drive (CSV): laboratorio ↔ carrera ↔ ambiente
│  ├─ carreras_seccion.csv EDITABLE: letra de sección → carrera
│  └─ config.json          opcional: forzar el periodo
├─ entrada/                ← aquí pegas los .xlsm descargados (NO se publica)
└─ herramientas/
   ├─ build_data.py        convierte entrada/*.xlsm → datos/horarios.json
   ├─ actualizar.bat       doble clic (Windows)  ·  actualizar.sh (Mac/Linux)
   └─ ver_local.bat        abre el sitio en http://localhost:8000
```

## Cómo actualizar (cada vez que cambie la base)
1. Descarga de la web los archivos nuevos y **cópialos sin modificar** a `entrada/` (todos los `.xlsm`, incluido `principal.xlsm`). Reemplaza los anteriores.
2. Doble clic en `herramientas/actualizar.bat`. Lee las **ADVERTENCIAS** que imprime (programas incompletos o sin archivo).
3. Prueba con `herramientas/ver_local.bat`.
4. Sube la carpeta `datos/` al sitio (reemplazando la anterior). Nada más cambia.

Cambios de laboratorios (agregar/quitar aulas, renombrar): edita `datos/ambientes.csv` (columna `aulas` = aulas separadas por espacio, ej. `J601 J602`). Un programa nuevo sale solo del archivo `.xlsm`.

## Sugerencia de carpetas en Drive (espejo del sitio)
```
Horarios_Pregrado/
├─ 01_entrada_actual/          .xlsm tal como se descargan (principal.xlsm + un .xlsm por programa)
├─ 02_historico/202620_2026-10-16/   copia fechada de cada entrega (respaldo)
├─ 03_datos_publicados/        copia de la carpeta datos/ que está en el sitio
└─ 04_catalogos/               ambientes.csv · carreras_seccion.csv (versión maestra)
```
Nota: un sitio publicado no puede leer una carpeta privada de Drive directamente; Drive sirve de entrada y respaldo, y lo que se publica es la carpeta `datos/`.
