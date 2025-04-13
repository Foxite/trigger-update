# trigger-update
Sends a JWT-authenticated request to [AuthenticatedGlue](https://github.com/Foxite/WatchtowerGlue), which will then trigger [Watchtower](https://github.com/containrrr/Watchtower) to pull your newly pushed container images and restart your containers.

## Inputs
All inputs are required.

| key        | description                                              |
|------------|----------------------------------------------------------|
| glueUrl    | The full URL where AuthenticatedGlue is accessible from. |
| privateKey | PEM encoded private key for signing JWTs.                |
| keyId      | The JWT kid value.                                       |
| algorithm  | JWT signing algorithm. /(RS\|PS\|ES\|HS)(256\|384\|512)/ |
| images     | A comma-separated list of images to update.              |

## Outputs
None

## Example
```yaml
- name: Trigger update
  uses: Foxite/trigger-update@v1.0
  with:
    keyId: sig-123456789
    algorithm: ES512
    images: ghcr.io/foxite/fridgebot
    glueUrl: https://authenticatedglue.myhomelab.net # Consider putting this in a secret.
    privateKey: ${{ secrets.GLUE_KEY }} # Should be a a value starting with -----BEGIN PRIVATE KEY-----

```
