import * as fs from 'fs';
import * as path from 'path';
import { env } from './env';
import { parseStringPromise } from 'xml2js';

const endpoints = {
    projectblogs: '/projectblogs', // Añade más endpoints según sea necesario
};

async function fetchAndSaveData() {
    try {
        for (const [folderName, endpoint] of Object.entries(endpoints)) {
            const response = await fetch(`${env.BASE_URL}${endpoint}?limit=4000`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${env.USER_EMAIL}:${env.API_KEY}`),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error en la solicitud a ${endpoint}: ${response.statusText}`);
            }

            const data = await response.json();

            // Crea la carpeta si no existe
            const dir = path.join(__dirname, folderName);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            // Guarda los datos en un archivo dentro de la carpeta
            const filePath = path.join(dir, 'data.json');
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

            console.log(`Datos guardados exitosamente en ${folderName}/data.json`);
        }
    } catch (error) {
        console.error('Error al obtener o guardar los datos:', error);
    }
}

// Función para leer el archivo data.json, extraer los IDs y guardarlos en un archivo
function getIdsFromDataFile(filePath: string): number[] {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);
    const ids = Object.keys(data)
        .filter(key => !isNaN(Number(key))) // Filtra solo las claves que son números (IDs)
        .map(Number);

    // Guardar los IDs en un archivo JSON
    const idsFilePath = path.join(path.dirname(filePath), 'ids.json');
    fs.writeFileSync(idsFilePath, JSON.stringify(ids, null, 2));
    console.log(`IDs guardados exitosamente en ${idsFilePath}`);

    return ids;
}

// Función para hacer fetch de datos detallados por ID
async function fetchDetailedDataById(id: number): Promise<any> {
    const response = await fetch(`${env.BASE_URL}/projectblogs/${id}`, {
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + btoa(`${env.USER_EMAIL}:${env.API_KEY}`),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching data for ID ${id}: ${response.statusText}`);
    }

    // Obtener el límite de llamadas desde el encabezado
    const apiCallLimit = response.headers.get('Http-X-Solve360-Api-Call-Limit');
    if (apiCallLimit) {
        console.log(`Límite de llamadas API: ${apiCallLimit}`);
    }

    return response.json();
}

// Función principal para procesar los IDs y guardar los datos detallados
async function processAndSaveDetailedData() {
    const resultFilePath = path.join(__dirname, 'projectblogs', 'detailedData.json');
    const stateFilePath = path.join(__dirname, 'projectblogs', 'state.json');
    const failedIdsFilePath = path.join(__dirname, 'projectblogs', 'failedIds.json');
    const dataFilePath = path.join(__dirname, 'projectblogs', 'data.json');
    const ids = getIdsFromDataFile(dataFilePath);

    let startIndex = 0;
    if (fs.existsSync(stateFilePath)) {
        const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'));
        startIndex = state.lastProcessedIndex || 0;
    }

    let detailedData: Record<number, any> = {};
    if (fs.existsSync(resultFilePath)) {
        detailedData = JSON.parse(fs.readFileSync(resultFilePath, 'utf-8'));
    }

    const maxConcurrentRequests = 10;
    let currentIndex = startIndex;
    const failedIds: number[] = [];

    async function fetchBatch() {
        const batch = ids.slice(currentIndex, currentIndex + maxConcurrentRequests);
        const promises = batch.map(async (id) => {
            let retries = 3;
            while (retries > 0) {
                try {
                    const data = await fetchDetailedDataById(id);
                    detailedData[id] = data;
                    console.log(`Datos detallados guardados para ID ${id}`);
                    break;
                } catch (error) {
                    console.error(`Error al obtener datos detallados para ID ${id}:`, error);
                    retries--;
                    if (retries > 0) {
                        console.log(`Reintentando ID ${id}, intentos restantes: ${retries}`);
                        await new Promise(res => setTimeout(res, 2000 * (3 - retries)));
                    } else {
                        failedIds.push(id); // Agregar ID a la lista de fallidos
                    }
                }
            }
        });

        await Promise.all(promises);

        currentIndex += maxConcurrentRequests;
        fs.writeFileSync(resultFilePath, JSON.stringify(detailedData, null, 2));
        fs.writeFileSync(stateFilePath, JSON.stringify({ lastProcessedIndex: currentIndex }, null, 2));
    }

    while (currentIndex < ids.length) {
        await fetchBatch();
    }

    if (fs.existsSync(stateFilePath)) {
        fs.unlinkSync(stateFilePath);
    }

    // Guardar los IDs fallidos
    if (failedIds.length > 0) {
        fs.writeFileSync(failedIdsFilePath, JSON.stringify(failedIds, null, 2));
        console.log(`IDs fallidos guardados en ${failedIdsFilePath}`);
    }
}

// Función para leer y convertir XML a JSON
async function convertXmlToJsonAndSave(filePath: string, outputFilePath: string): Promise<any> {
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = await parseStringPromise(xmlData);
    fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2));
    return jsonData;
}

// Función para comparar dos objetos JSON
function compareJsonObjects(json1: any, json2: any): void {
    const keys1 = Object.keys(json1);
    const keys2 = Object.keys(json2);

    const missingInJson1 = keys2.filter(key => !keys1.includes(key));
    const missingInJson2 = keys1.filter(key => !keys2.includes(key));

    if (missingInJson1.length > 0) {
        console.log('Keys missing in JSON 1:', missingInJson1);
    }

    if (missingInJson2.length > 0) {
        console.log('Keys missing in JSON 2:', missingInJson2);
    }

    // Compare values for common keys
    keys1.forEach(key => {
        if (keys2.includes(key) && JSON.stringify(json1[key]) !== JSON.stringify(json2[key])) {
            console.log(`Difference found in key ${key}:`);
            console.log('JSON 1:', json1[key]);
            console.log('JSON 2:', json2[key]);
        }
    });
}

// Función principal para comparar detailedData.json con content.xml
async function compareDetailedDataWithXml() {
    const jsonFilePath = path.join(__dirname, 'projectblogs', 'detailedData.json');
    const xmlFilePath = path.join(__dirname, 'projectblogs', 'content.xml');
    const xmlJsonFilePath = path.join(__dirname, 'projectblogs', 'content.json');

    // Leer y parsear detailedData.json
    const detailedData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

    // Convertir content.xml a JSON y guardarlo
    const xmlData = await convertXmlToJsonAndSave(xmlFilePath, xmlJsonFilePath);

    // Comparar los dos JSON
    compareJsonObjects(detailedData, xmlData);
}

const jsonToSolve360CsvEquivalences: Record<string, string> = {
    "ID": "id",
    "Nom du projet": "title",
    "Date de creation": "created",
    "Updated": "updated",
    "Created by": "creatorname",
    "Updated by": "modificatorname",
    "Assigned To": "assignedto_cn",
    "Type de Projet": "custom11546881",
    "Sous type": "custom11536909",
    "Description": "description",
    "Owner": "ownership",
    // Añade más equivalencias según sea necesario
};

const jsonToHubspotCsvEquivalences: Record<string, string> = {
    "ID": "id",
    "Nom du projet": "title",
}

function jsonToCsv(jsonData: string) {
    const data = JSON.parse(jsonData);
    const originalIds = Object.keys(data);

    const header = Object.keys(jsonToSolve360CsvEquivalences);

    const csv = [
        header.join(','), // Encabezados
        ...originalIds.map(id => {
            const entry = data[id];
            const item = entry.item;
            const fields = item.fields;

            // Construir cada fila del CSV usando las equivalencias
            return header.map(columnName => {
                const jsonFieldName = jsonToSolve360CsvEquivalences[columnName];
                return JSON.stringify(fields[jsonFieldName] || '', replacer);
            }).join(',');
        })
    ].join('\r\n');

    return csv;
}

function replacer(key: any, value: any) {
    return value === null ? '' : value;
}

function convertJsonFileToCsv(inputFilePath: string, outputFilePath: string) {
    const jsonData = fs.readFileSync(inputFilePath, 'utf-8');
    const csvData = jsonToCsv(jsonData);
    fs.writeFileSync(outputFilePath, csvData);
    console.log(`Datos convertidos y guardados en ${outputFilePath}`);
}

function divideByLanguage() {
    // Ruta del archivo JSON original
    const inputFilePath = path.join(__dirname, 'projectblogs', 'detailedData.json');

    // Directorio donde se guardarán los archivos separados por idioma
    const outputDir = path.join(__dirname, 'projectblogsByLanguage');

    // Asegúrate de que el directorio de salida existe
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // Leer el archivo JSON
    fs.readFile(inputFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
            return;
        }

        // Validar que el JSON no esté vacío
        if (!data) {
            console.error('El archivo JSON está vacío.');
            return;
        }

        // Parsear el JSON
        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (parseError) {
            console.error('Error al parsear el JSON:', parseError);
            return;
        }

        // Diccionarios para almacenar los datos separados por idioma
        const languageProjects: { [key: string]: any[] } = {
            "Belgium": [],
            "English": [],
            "French": [],
            "German": [],
            "International": [],
            "Italian": [],
            "Portuguese": [],
            "Spanish": [],
            "Multilingual": [],
            "NoLanguageTag": []
        };

        // Iterar sobre los datos
        for (const itemId in jsonData) {
            if (jsonData.hasOwnProperty(itemId)) {
                const itemData = jsonData[itemId];
                const categories = itemData.categories || [];

                // Obtener los idiomas del proyecto
                const idiomas = categories.map((cat: any) => cat.name);

                // Verificar si el proyecto tiene múltiples idiomas
                if (idiomas.length > 1) {
                    languageProjects["Multilingual"].push(itemData);
                } else if (idiomas.includes('1-Belgium')) {
                    languageProjects["Belgium"].push(itemData);
                } else if (idiomas.includes('1-English Speaking')) {
                    languageProjects["English"].push(itemData);
                } else if (idiomas.includes('1-French Speaking')) {
                    languageProjects["French"].push(itemData);
                } else if (idiomas.includes('1-German Speaking')) {
                    languageProjects["German"].push(itemData);
                } else if (idiomas.includes('1-International')) {
                    languageProjects["International"].push(itemData);
                } else if (idiomas.includes('1-Italian Speaking')) {
                    languageProjects["Italian"].push(itemData);
                } else if (idiomas.includes('1-Portuguese Speaking')) {
                    languageProjects["Portuguese"].push(itemData);
                } else if (idiomas.includes('1-Spanish Speaking')) {
                    languageProjects["Spanish"].push(itemData);
                } else {
                    languageProjects["NoLanguageTag"].push(itemData);
                }
            }
        }

        // Mostrar un resumen de los datos antes de escribirlos
        console.log('Resumen de proyectos por idioma:');
        Object.entries(languageProjects).forEach(([language, projects]) => {
            console.log(`- ${language}: ${projects.length} proyectos`);
        });

        // Función para escribir los datos en un archivo
        const writeToFile = (filename: string, data: any) => {
            fs.writeFile(path.join(outputDir, filename), JSON.stringify(data, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error(`Error al escribir el archivo ${filename}:`, err);
                } else {
                    console.log(`Archivo ${filename} escrito correctamente.`);
                }
            });
        };

        // Escribir los datos en archivos separados
        for (const [language, projects] of Object.entries(languageProjects)) {
            writeToFile(`${language.toLowerCase()}.json`, projects);
        }
    });
}

// fetchAndSaveData();
// getIdsFromDataFile(path.join(__dirname, 'projectblogs', 'data.json'));
// processAndSaveDetailedData();
// convertJsonFileToCsv(inputFilePath, outputFilePath);
// compareDetailedDataWithXml().catch(error => console.error('Error:', error));
divideByLanguage();