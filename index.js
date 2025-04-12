const core = require("@actions/core");
//const github = require("@actions/github");
const uuid = require("uuid");
const jwa = require("jwa")

async function runJob() {
    const callUrl = core.getInput("callUrl");
    const privateKey = core.getInput("privateKey");
    const keyId = core.getInput("keyId");
    const algorithm = core.getInput("algorithm");
    const images = core.getInput("images").split(",");
    if (images.length === 0) {
        throw new Error("No images defined.");
    }

    const jwt = makeJwt(algorithm, keyId, privateKey, images);
    await callUpdate(callUrl, jwt)
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

async function callUpdate(callUrl, jwt) {
    await fetch({
        method: "POST",
        url: callUrl,
        headers: {
            "content-type": "application/jwt"
        },
        body: jwt,
    })
}

try {
    await runJob();
} catch (error) {
    core.setFailed(error.message);
}
