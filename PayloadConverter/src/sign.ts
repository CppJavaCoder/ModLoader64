let crypto = require('crypto');
let fs = require('fs');

export function generate(file: string) {
  let hasher = crypto.createHash('sha256');
  hasher.update(fs.readFileSync(file));
  const digest = hasher.digest('hex');
  const privateKey = fs.readFileSync('./private_key.pem');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(digest);

  let readlineSync = require('readline-sync');

  let passphrase = readlineSync.question('Enter passphrase for key');

  const signature = crypto
    .createSign('RSA-SHA256')
    .update(digest)
    .sign(
      {
        key: privateKey,
        passphrase,
      },
      'base64'
    );
  return signature;
}
