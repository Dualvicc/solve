import { env } from "../env";

const myHeaders = new Headers();
myHeaders.append("Content-Type", "multipart/form-data");
myHeaders.append("Accept", "application/json");
myHeaders.append("Authorization", `Bearer ${env.HS_PRIVATE_APP_KEY}`);

const formdata = new FormData();
formdata.append("files", new Blob([/* contenido del archivo CSV */], { type: "text/csv" }), "detailedData.csv");

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
            columnName: "id",
            idColumnType: null,
            propertyName: "hs_object_id",
            foreignKeyType: null,
            columnObjectType: "CONTACT",
            associationIdentifiedColumn: false
          },
          {
            ignored: false,
            columnName: "name",
            idColumnType: null,
            propertyName: "name",
            foreignKeyType: null,
            columnObjectType: "CONTACT",
            associationIdentifiedColumn: false
          },
          {
            ignored: false,
            columnName: "typeid",
            idColumnType: null,
            propertyName: "type_id",
            foreignKeyType: null,
            columnObjectType: "CONTACT",
            associationIdentifiedColumn: false
          },
          {
            ignored: false,
            columnName: "created",
            idColumnType: null,
            propertyName: "created_date",
            foreignKeyType: null,
            columnObjectType: "CONTACT",
            associationIdentifiedColumn: false
          },
          {
            ignored: false,
            columnName: "viewed",
            idColumnType: null,
            propertyName: "viewed_date",
            foreignKeyType: null,
            columnObjectType: "CONTACT",
            associationIdentifiedColumn: false
          },
          {
            ignored: false,
            columnName: "updated",
            idColumnType: null,
            propertyName: "updated_date",
            foreignKeyType: null,
            columnObjectType: "CONTACT",
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

formdata.append("importRequest", JSON.stringify(importRequest));

const requestOptions = {
  method: "POST",
  headers: myHeaders,
  body: formdata,
  redirect: "follow" as RequestRedirect
};

export const importDataToHubspot = async () => {
  try {
    const response = await fetch("https://api.hubapi.com/crm/v3/imports/", requestOptions);
    const result = await response.text();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
};