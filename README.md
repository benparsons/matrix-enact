
*There is a working version available at <https://play.matrix.org/matrix-enact>.*

# matrix-enact

This project is a read-only Matrix client which uses Web Audio API speech synthesis to "enact" the history of a Matrix room. It is designed to take a single event from a guest-visible Matrix room and read forwards from there.

The repo is a `create-react-app` project, so it's easy to get started with:

```
yarn install
yarn start
```

The project does not depend on [matrix-js-sdk](https://github.com/matrix-org/matrix-js-sdk/), but makes calls directly.

There is a working version available at <https://play.matrix.org/matrix-enact>.