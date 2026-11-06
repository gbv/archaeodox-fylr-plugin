const crypto = require('crypto');

const info = process.argv.length >= 3
    ? JSON.parse(process.argv[2])
    : {};

let input = '';
process.stdin.on('data', d => {
    try {
        input += d.toString();
    } catch(e) {
        console.error(`Could not read input into string: ${e.message}`, e.stack);
        process.exit(1);
    }
});


process.stdin.on('end', async () => {

    const changedObjects = await processInput(input);

    console.log(JSON.stringify({ objects: changedObjects }));

    if (!changedObjects.length) {
        console.error('No changes');
        process.exit(0);
    }
});


async function processInput(input) {

    try {
        const servicerUrl = await getServicerUrl();
        const objectTypes = await getObjectTypes();
        const data = JSON.parse(input);

        const changedObjects = [];
        for (let object of data.objects) {
            if (await processObject(object, servicerUrl, objectTypes)) {
                changedObjects.push(object);
            }
        }
        return changedObjects;
    } catch (error) {
        console.error(`Could not parse input: ${error.message}`, error.stack);
        process.exit(1);
    }
}


async function processObject(object, servicerUrl, objectTypes) {

    if (!isNewObject(object) || !hasConfiguredObjectType(object, objectTypes)) return false;

    addServicerRequestId(object);
    await callServicer(object, servicerUrl);

    return true;
}


async function getServicerUrl() {

    const pluginConfiguration = await getPluginConfiguration();
    const servicerUrl = pluginConfiguration.servicer_url;
    
    if (!servicerUrl) {
        throwErrorToFrontend(
            'Die Servicer-URL wurde nicht angegeben.',
            'Bitte tragen Sie die Servicer-URL in den Basiseinstellungen unter "archaeoDox" ein.'
        );
    }

    return servicerUrl;
}


async function getObjectTypes() {

    const pluginConfiguration = await getPluginConfiguration();
    const objectTypes = pluginConfiguration.object_types
        ?.map(objectType => objectType?.name)
        .filter(name => name);
    
    if (!objectTypes?.length) {
        throwErrorToFrontend(
            'Es wurden keine Objekttypen konfiguriert.',
            'Bitte geben Sie in den Basiseinstellungen unter "archaeoDox" die Objekttypen an, ' +
                'für die der Servicer benachrichtigt werden soll.'
        );
    }

    return objectTypes;
}


function getPluginConfiguration() {

    return info.config.plugin['archaeodox'].config.archaeodox;
}


function addServicerRequestId(object) {

    object[object._objecttype].servicer_request_id = createServicerRequestId();
}


function createServicerRequestId() {

    return crypto.randomBytes(20).toString('hex');
}


async function callServicer(object, servicerUrl) {

    const url = servicerUrl + '/handle-new-object/'
        + object._objecttype + '/'
        + object[object._objecttype].servicer_request_id;

    let failed = false;

    try {
        let response = await fetch(url, { method: 'POST' });
        if (!response.ok) failed = true;
    } catch (error) {
        failed = true;
    }

    if (failed) {
        throwErrorToFrontend(
            'Der archaeoDox-Servicer konnte nicht erreicht werden.',
            'Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut und wenden Sie sich gegebenenfalls an die Administration.'
        );
    }
}


function isNewObject(object) {

    return !object._uuid;
}


function hasConfiguredObjectType(object, objectTypes) {

    return (objectTypes.includes(object._objecttype));
}


function throwErrorToFrontend(error, description) {

    console.log(JSON.stringify({
        error: {
            code: 'error.archaeoDox',
            statuscode: 400,
            realm: 'api',
            error,
            parameters: {},
            description
        }
    }));

    process.exit(0);
}
