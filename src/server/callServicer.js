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
        const data = JSON.parse(input);
        const servicerUrl = getServicerUrl(data);
        for (let object of data.objects) {
            await callServicer(servicerUrl, object);
        }
    } catch (error) {
        console.error(`Could not parse input: ${error.message}`, error.stack);
        process.exit(1);
    }
}


function getServicerUrl(data) {

    const servicerUrl = data.info?.config?.plugin?.archaeodox?.config?.archaeodox?.servicer_url;
    
    if (!servicerUrl) {
        throwErrorToFrontend(
            'Die Servicer-URL wurde nicht angegeben.',
            'Bitte tragen Sie die Servicer-URL in den Basiseinstellungen unter "archaeoDox" ein.'
        );
    }

    return servicerUrl;
}


async function callServicer(servicerUrl, object) {

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
