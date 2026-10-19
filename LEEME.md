# Horarios · Pregrado — sitio publicable (solo HTML, CSS y JavaScript)

Sin Python. Los datos se leen de **Google Sheets** (o, si no configuras nada, de los CSV de la carpeta `datos/`).

## Estructura
```
index.html · laboratorios.html · explorador.html     páginas del sitio
importador.html                                      convierte los .xlsm / CURSOS_2026.zip en la hoja "Horarios"
assets/css · assets/js                               estilos y código (datos.js carga las fuentes)
datos/config.json                                    ← aquí van los 3 enlaces de Google Sheets
datos/horarios.csv · ambientes.csv · carreras_seccion.csv   copia local = plantilla de las 3 pestañas
```

## Puesta en marcha (una sola vez)
1. En Google Sheets crea un libro con 3 pestañas: **Horarios**, **Ambientes**, **Secciones**.
2. En cada pestaña: *Archivo ▸ Importar ▸ Subir* el CSV correspondiente de `datos/` ▸ *Reemplazar hoja actual*
   (`horarios.csv` → Horarios · `ambientes.csv` → Ambientes · `carreras_seccion.csv` → Secciones).
3. *Archivo ▸ Compartir ▸ Publicar en la web*. Elige la pestaña, formato **Valores separados por comas (.csv)** ▸ Publicar ▸ copia el enlace. Repite con las 3 pestañas.
4. Pega los 3 enlaces en `datos/config.json` (campo `fuentes`) y sube el sitio a GitHub Pages / tu hosting.

## Actualizar (cada vez que cambie la base)
- **Horarios:** abre `importador.html` (en el sitio publicado) ▸ sube el `CURSOS_2026.zip` o los `.xlsm` ▸ *Descargar horarios.csv* ▸ en la pestaña **Horarios** haz *Importar ▸ Reemplazar hoja actual*. La web ya muestra los datos nuevos.
- **Matriz de laboratorios:** edita directamente la pestaña **Ambientes** (columnas: N°, Programa de Estudio, Acronimo, LABORATORIO O TALLER, AMBIENTE, SEDE).
- **Letra de sección → carrera:** edita la pestaña **Secciones** (columnas: letra, programa, carrera).

## Cosas que debes saber
- Google tarda hasta unos 5 minutos en reflejar los cambios en el enlace publicado; después basta recargar la página (F5).
- Una hoja "publicada en la web" es accesible para cualquiera que tenga el enlace. La hoja Horarios incluye nombres e ID de docentes.
- Si un enlace falla, el sitio muestra la copia local de `datos/` y un aviso naranja en la parte superior.
- Abrir las páginas con doble clic (file://) no funciona porque el navegador bloquea la lectura de datos: usa el sitio publicado.
- La cabecera de `laboratorios.html` muestra todos los programas de la hoja Horarios (ADMI, ADMA, etc.). Los que no tienen laboratorios en la hoja **Ambientes** salen atenuados con 0 y un aviso al hacer clic.
