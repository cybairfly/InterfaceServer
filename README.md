# Interface Server
*RPA-focused remote visual interface for inspection of and interaction with headless browser automations using Playwright or Puppeteer*

Part of the general purpose web automation library: [Apify Robot](https://gitlab.com/cybaerfly/apify-robot)

Legacy feature of the Apify platform extended for use in RPA.

`InterfaceServer` is a portable solution that enables real-time visual interaction with automations' runtime by serving browser snapshots via web sockets. It includes its own client that provides a simple frontend for interaction with and/or viewing of actions performed by the actor. Each snapshot consists of page content (HTML) and/or its screenshot along  with the currently opened URL.
```json
{
    "pageUrl": "https://www.example.com",
    "htmlContent": "<html><body> ....",
    "screenshotIndex": 3,
    "createdAt": "2019-04-18T11:50:40.060Z"
}
```
`InterfaceServer` is useful for visually inspecting the current browser status on demand and control of actor's actions via a user interface on the Apify platform or embedded remotely. When no client is connected, the webserver consumes very low resources so it should have a close to zero impact on performance. Only once a client connects the server will start serving snapshots. Once no longer needed, it can be simply closed or disabled again in the viewing client to remove any performance impact. 

It will take snapshots of the first page of the latest browser. Taking snapshots of only a single page improves performance and stability dramatically in high concurrency situations. When running locally, it is often best to use a headful browser for debugging, since it provides a better view into the browser, including DevTools, but `InterfaceServer` will work as well.

**Warning**: capturing screenshot in browser typically takes around 300ms. So having the `InterfaceServer` always serve snapshots will have a significant impact on performance.

# Access
Interface is accessible on port determined by the environment variable `CONTAINER_PORT` = `4321`

# Example

```javascript
const InterfaceServer = require('InterfaceServer');

const server = new InterfaceServer({
    screenshotDirectoryPath,
    maxScreenshotFiles = 10,
    snapshotTimeoutSecs = 3,
    maxSnapshotFrequencySecs = 2,
    useScreenshots = false,
    prompt: {
        handlers: {
            ['abort']: () => {
                throw new Robot.Error({
                    data: {
                        abortActor: true,
                    },
                });
            },
            ['cancel']: () => {
                throw new Robot.Error({
                    data: {
                        cancelAction: true,
                    },
                });
            },
            ['confirm']: () => {
                console.log('Cancellation confirmed');
            },
        }
    },
});

await server.serve(page);
```