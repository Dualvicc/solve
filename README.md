# Proyecto de Automatización de Datos: Solve360 a HubSpot

Este proyecto automatiza la extracción, limpieza e importación de datos desde Solve360 a HubSpot. El script principal, `index.ts`, gestiona la obtención de datos, su procesamiento y la conversión a formatos adecuados para su importación.

## Tabla de Contenidos

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Requisitos](#requisitos)
3. [Instalación](#instalación)
4. [Uso](#uso)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Detalles Técnicos](#detalles-técnicos)
7. [Contribuciones](#contribuciones)
8. [Licencia](#licencia)

## Descripción del Proyecto

Este proyecto está diseñado para facilitar la migración de datos desde Solve360 a HubSpot, automatizando el proceso de extracción de datos, limpieza y transformación, y su posterior importación a HubSpot.

## Requisitos

- Node.js
- npm
- Acceso a las API de Solve360 y HubSpot
- Permisos para leer y escribir archivos en el sistema

## Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/dualvicc/solve.git
   ```
2. Navega al directorio del proyecto:
   ```bash
   cd solve
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```

## Uso

1. Configura las variables de entorno en el archivo `env.ts`:
   ```typescript
   export const env = {
       BASE_URL: 'tu_base_url',
       USER_EMAIL: 'tu_email',
       API_KEY: 'tu_api_key',
       HS_PRIVATE_APP_KEY: 'tu_hs_private_app_key'
   };
   ```

2. Ejecuta las funciones necesarias según el flujo de trabajo deseado:
   - `fetchAndSaveData()`: Extrae y guarda datos desde Solve360.
   - `getIdsFromDataFile()`: Extrae IDs de los datos guardados.
   - `processAndSaveDetailedData()`: Procesa los IDs y guarda datos detallados.
   - `convertJsonFileToCsv()`: Convierte datos JSON a CSV.
   - `compareDetailedDataWithXml()`: Compara datos detallados con un archivo XML.
   - `importDataToHubspot()`: Importa datos a HubSpot.
3. Ejecuta el script principal:
   ```bash
   npx ts-node index.ts
   ```

## Estructura del Proyecto

- `index.ts`: Script principal que coordina la extracción, limpieza e importación de datos.
- `env.ts`: Archivo de configuración para las variables de entorno.
- `projectblogs/`: Directorio donde se almacenan los datos extraídos y transformados.

## Detalles Técnicos

- **Extracción de Datos**: Utiliza la API de Solve360 para obtener datos en formato JSON.
- **Limpieza y Transformación**: Normaliza y estructura los datos, extrayendo información relevante de campos de texto libre.
- **Importación a HubSpot**: Convierte los datos a CSV y los importa a HubSpot utilizando su API.
- **Comparación de Datos**: Compara datos JSON con archivos XML para verificar consistencias.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request para discutir cambios importantes.

## Licencia

Este proyecto está licenciado bajo la Licencia Misco.
