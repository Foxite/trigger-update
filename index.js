const actionsCore = require("@actions/core");
const uuid = require("uuid");
const jwa = require("jwa");

function getInput(key) {
    if (process.env.MODE === "DEBUG") {
        return {
            "glueUrl": "http://localhost:5134",
            "privateKey": "-----BEGIN PRIVATE KEY-----\nMGACAQAwEAYHKoZIzj0CAQYFK4EEACMESTBHAgEBBEIBYts8Uc7CBBi4qCKVw1hF\nxUS62xeMqZWXfhaozCYluTkCxFVjMgk3O+0nNif9vTBss92ZPUBPUmg7kLW58Ioi\nnJ8=\n-----END PRIVATE KEY-----",
            "keyId": "authenticatedglue",
            "algorithm": "ES512",
            "images": "testimage,testimage2",
        }[key];
    } else {
        return actionsCore.getInput(key);
    }
}

async function runJob() {
    const glueUrl = getInput("glueUrl");
    const privateKey = getInput("privateKey");
    const keyId = getInput("keyId");
    const algorithm = getInput("algorithm");
    const images = getInput("images").split(",");
    if (images.length === 0) {
        throw new Error("No images defined.");
    }

    const jwt = makeJwt(algorithm, keyId, privateKey, images);
    await callUpdate(glueUrl, jwt)
}

function makeJwt(alg, keyId, privateKey, images) {
    const header = {
        typ: "JWT",
        kid: keyId,
        alg: alg
    };

    const currentTime = Math.floor(new Date().valueOf() / 1000);
    const payload = {
        jti: uuid.v4(),
        iat: currentTime,
        nbf: currentTime,
        exp: currentTime + 15,
        images: images,
    }

    const jwaAlgorithm = jwa(alg);
    const headerEncoded = Buffer.from(JSON.stringify(header)).toString("base64url")
    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString("base64url")
    const signBody = headerEncoded + "." + payloadEncoded;
    const signature = jwaAlgorithm.sign(signBody, privateKey);
    return signBody + "." + signature;
}

async function callUpdate(glueUrl, jwt) {
    const result = await fetch(`${glueUrl}/notify`, {
        method: "POST",
        headers: {
            "content-type": "application/jwt"
        },
        body: jwt,
    });

    if (result.status < 200 || result.status >= 300) {
        throw new Error(`Invalid response code: ${result.status} ${result.statusText}\n${await result.text()}`);
    }
}

if (process.env.MODE === "DEBUG") {
    runJob();
} else {
    try {
        runJob();
    } catch (error) {
        actionsCore.setFailed(error.message);
    }
}
