let info = undefined;
if (process.argv.length >= 3) {
    info = JSON.parse(process.argv[2])
}


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

    await processInput(input);

    console.log(JSON.stringify({'objects': []}));
    console.error('No changes');
    process.exit(0);
    return;
});


async function processInput(input) {

    try {
        const servicerUrl = await getServicerUrl();
        const data = JSON.parse(input);
        for (let object of data.objects) {
            await processObject(object, servicerUrl);
        }
    } catch (error) {
        console.error(`Could not parse input: ${error.message}`, error.stack);
        process.exit(1);
    }
}


async function processObject(object, servicerUrl) {

    if (!isNewObject(object)) return;

    await callServicer(object, servicerUrl);
}


async function getServicerUrl() {

    const pluginConfiguration = await getPluginConfiguration();
    const servicerUrl = pluginConfiguration.servicer_url.ValueText;
    
    if (!servicerUrl) {
        throwErrorToFrontend(
            'Die Servicer-URL wurde nicht angegeben.',
            'Bitte tragen Sie die Servicer-URL in den Basiseinstellungen unter "archaeoDox" ein.'
        );
    }

    return servicerUrl;
}


async function getPluginConfiguration() {

    const baseConfiguration = await getBaseConfiguration();
    return baseConfiguration.BaseConfigList.find(section => section.Name === 'archaeodox').Values;
}


async function getBaseConfiguration() {

    const url = 'http://fylr.localhost:8082/inspect/config';
    const headers = { 'Accept': 'application/json' };

    let response;
    try {
        response = await fetch(url, { headers });
    } catch {
        throwErrorToFrontend('Die Basiskonfiguration konnte nicht geladen werden.');
    }

    if (response.ok) {
        return response.json();
    } else {
        throwErrorToFrontend('Die Basiskonfiguration konnte nicht geladen werden.', response.statusText);
    }
}


async function callServicer(object, servicerUrl) {

    let failed = false;

    try {
        let response = await fetch(servicerUrl + '/handle-new-objects/' + object._objecttype, {
            method: 'POST'
        });
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
