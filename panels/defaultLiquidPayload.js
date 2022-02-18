const defaultLiquidPayload = `
{%- assign company = booking.company -%}
{%- assign item = booking.printable_items.first -%}
{%- assign space = booking.all_spaces|first -%}
{%- assign slot = booking.slot -%}
{%- assign service = booking.service -%}
{%- assign member = booking.member -%}
{%- assign client = booking.client -%}
{%- assign person = booking.person -%}
{%- assign resource = booking.resource -%}

{
    "appointmentConfirmationNumber": "{{booking.purchase_ref}}",
    "modeOfAppointment": "[[modeOfAppointment]]",
    "scheduledStart": "{{booking.datetime}}",
    "scheduledEnd": "{{booking.end_datetime}}",
    "branchNumber": "{{booking.company_id}}",
    "customer": {
        "firstName": "{{client.first_name}}",
        "lastName": "{{client.last_name}}",
        "fullName": "{{client.first_name}} {{client.last_name}}",
        "businessName": "",
        "emailAddress": "{{client.email}}",
        "phoneNumber": "{{client.mobile}}",
        "hashedLpid": "{{client.reference}}"
    },
    "bankerEmailAddress": "{{person.email}}",
    "bankerOnBehalfOf": "false",
    "whatToBring": "{{service.extras.documentation}}",
    "mobileNumberForSms": "[[mobileNumberForSms]]",
    "bookingBugInternalReferenceId": "{{booking.purchase_id}}",
    "icsURL": "https://usbank-staging.bookingbug.com/ical/total/{{booking.purchase_ref}}",
    "status": "Open",
}`;
export default defaultLiquidPayload;