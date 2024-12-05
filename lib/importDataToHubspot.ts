import { env } from "../env";
import * as fs from 'fs';
import * as path from 'path';

const myHeaders = new Headers();
myHeaders.append("Content-Type", "multipart/form-data");
myHeaders.append("Accept", "application/json");
myHeaders.append("Authorization", `Bearer ${env.HS_PRIVATE_APP_KEY}`);
const outputDir = path.join(__dirname, 'projectblogsByLanguage');

const importRequest = {
  name: "test_import_projectblogs",
  files: [
    {
      fileName: "detailedData.csv",
      fileFormat: "CSV",
      fileImportPage: {
        hasHeader: true,
        columnMappings: [
          {
            ignored: false,
            columnName: "ID",
            idColumnType: null,
            propertyName: "solve_id",
            foreignKeyType: null,
            columnObjectType: "MARKETING_EVENT",
            associationIdentifiedColumn: false
          },
          {
            ignored: false,
            columnName: "Nom du projet",
            idColumnType: null,
            propertyName: "hs_event_name",
            foreignKeyType: null,
            columnObjectType: "MARKETING_EVENT",
            associationIdentifiedColumn: false
          },
          {
            ignored: false,
            columnName: "Date de creation",
            idColumnType: null,
            propertyName: "created_date__in_sove_",
            foreignKeyType: null,
            columnObjectType: "MARKETING_EVENT",
            associationIdentifiedColumn: false
          },
          {
            ignored: false,
            columnName: "Updated",
            idColumnType: null,
            propertyName: "hs_lastmodifieddate",
            foreignKeyType: null,
            columnObjectType: "MARKETING_EVENT",
            associationIdentifiedColumn: false
          },
          {
            ignored: false,
            columnName: "Assigned To",
            idColumnType: null,
            propertyName: "assigned_to__in_solve_",
            foreignKeyType: null,
            columnObjectType: "MARKETING_EVENT",
            associationIdentifiedColumn: false
          },
          { 
            ignored: false,
            columnName: "Type de Projet",
            idColumnType: null,
            propertyName: "hs_event_type",
            foreignKeyType: null,
            columnObjectType: "MARKETING_EVENT",
            associationIdentifiedColumn: false
          },
          {
            ignored: true,
            columnName: "ownership"
          },
          {
            ignored: true,
            columnName: "flagged"
          },
          {
            ignored: true,
            columnName: "identicon"
          },
          {
            ignored: true,
            columnName: "fields"
          }
        ]
      }
    }
  ]
};
// Función para leer y enviar datos JSON de un idioma específico a HubSpot
export const importJSONDataToHubspot = async (language: string) => {
  const filePath = path.join(outputDir, `${language.toLowerCase()}Projects.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`El archivo para el idioma ${language} no existe.`);
    return;
  }

  const data = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(data);


  // Formatear los datos para la API de HubSpot
  const formattedData = jsonData.map((item: any) => ({
    properties: {
      solve_id: item.item.id,
      hs_event_name: item.item.name,
      created_date__in_sove_: item.item.created,
      hs_lastmodifieddate: item.item.updated,
      assigned_to__in_solve_: item.item.fields.assignedto,
      hs_event_type: item.item.fields.custom11546881, // Ajusta según el campo correcto
      // Agrega más mapeos según sea necesario
    }
  }));

  // Configurar las opciones de la solicitud
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.HS_PRIVATE_APP_KEY}`, // Asegúrate de tener la clave en las variables de entorno
    },
    body: JSON.stringify({ inputs: formattedData }),
  };

  try {
    const response = await fetch("https://api.hubapi.com/crm/v3/objects/marketing_events/batch/create", requestOptions);
    const result = await response.json();
    console.log(`Importación de ${language} completada:`, result);
  } catch (error) {
    console.error(`Error al importar ${language}:`, error);
  }
};

// Ejemplo de uso: importar datos en inglés
importJSONDataToHubspot('English');