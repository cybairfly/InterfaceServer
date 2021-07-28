# Interface Server
`InterfaceServer` enables real-time visual interaction with actor's runtime by serving browser snapshots via web sockets. It includes its own client that provides a simple frontend for interaction with and/or viewing of actions performed by the actor. Each snapshot consists of page content (HTML) and/or its screenshot along  with the currently opened URL.
```json
{
    "pageUrl": "https://www.example.com",
    "htmlContent": "<html><body> ....",
    "screenshotIndex": 3,
    "createdAt": "2019-04-18T11:50:40.060Z"
}
```
`InterfaceServer` is useful for visually inspecting the current browser status on demand and control of actor's actions via a user interface on the Apify platform or embedded remotely. When no client is connected, the webserver consumes very low resources so it should have a close to zero impact on performance. Only once a client connects the server will start serving snapshots. Once no longer needed, it can be disabled again in the client to remove any performance impact. NOTE: Screenshot taking in browser typically takes around 300ms. So having the `InterfaceServer` always serve snapshots will have a significant impact on performance.

It will take snapshots of the first page of the latest browser. Taking snapshots of only a single page improves performance and stability dramatically in high concurrency situations. When running locally, it is often best to use a headful browser for debugging, since it provides a better view into the browser, including DevTools, but `InterfaceServer` works too.

# Example

```javascript
const Server = require('InterfaceServer');

```