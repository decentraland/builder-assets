# builder-assets

This repo contains the assets for the [Decentraland Builder](https://builder.decentraland.org/) and a script to deploy them.

## Deploy

### Before runing

Some set-up before running the deployment script

#### Env file

You can supply your AWS credentials by creating a `.env` file in the root folder of this project. Check the `.env.example` file to see how the variables should be named.

#### Asset pack thumbnail

Add a `thumbnail.png` file to an asset pack folder for it to be the thumbnail of that pack.

#### Asset pack info file

The file must be called `info.json` and it should have the following properties (example from `MiniTown`, AKA `Genesis City`):

```json
{
  "id": "e6fa9601-3e47-4dff-9a84-e8e017add15a",
  "title": "Genesis City"
}
```

#### Generating a new id

You can use [uuid generator](https://www.uuidgenerator.net/)

### How to run

```bash
cd builder-assets
npm run bundle -- --src ./assets  --bucket AWS_BUCKET --content-server CONTENT_SERVER_URL --out ./out/path --url https://ALIAS.now.sh
cd ./out/path
now alias $(now --scope decentraland) ALIAS
```

Run `npm run bundle -- --help` to see the help in the terminal
