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
    return
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
        console.error('No configured servicer URL for archaeoDox plugin');
        process.exit(1);
    }

    return servicerUrl;
}


async function callServicer(servicerUrl, object) {

    try {
        let response = await fetch(servicerUrl + '/handle-new-objects/' + object._objecttype, {
            method: 'POST'
        });
        if (!response.ok) {
            console.error(response);
            process.exit(1);
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
