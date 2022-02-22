const defaultLiquidPayload = `
{% assign company = booking.company %}
{% assign client = booking.client %}
{% assign person = booking.person %}

{
   "companyData":{
      "name":"{{company.name}}"
   },
   "customerData":{
      "fullname":"{{client.first_name}} {{client.last_name}}",
      "firstname":"{{client.first_name}}",
      "lastname":"{{client.last_name}}",
      "email":"{{client.email}}"
   },
   "staffData":{
      "firstname":"{{person.name | split: ' ' | reverse | slice: 1, 100 | reverse | join: ' '}}",
      "lastname":"{{person.name | split: ' ' | last}}",
      "email":"{{person.email}}",
      "desc":"{{person.description}}"
   }
}`;
export default defaultLiquidPayload;