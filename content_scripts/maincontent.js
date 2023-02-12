/**
 * COYO - Web Extension
 * 
 * (c) Copyright 2017 Denis Meyer. All rights reserved.
 */
(function() {

    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again, it will do nothing next time.
     */
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    let status = {
        error: {
            error: false,
            type: "",
            description: ""
        }
    };
    let data = {
        config: null,
        user: null,
        l10n: null
    };

    /**
     * Sets the script-local error status.
     * 
     * @param {boolean} error Boolean flag
     * @param {string} type The type of error
     * @param {string} description The error description
     */
    function setError(error, type, description) {
        type = type ? type : "";
        description = description ? description : "";
        status.error = {
            error: error,
            type: type,
            description: description
        }
    }

    /**
     * Listens for messages from the injected data retriever script.
     * 
     * @param {object} event The event
     */
    window.addEventListener("message", function(event) {
        if (event.source != window) {
            return;
        }
        switch (event.data.type) {
            case "configdata":
                console.log("[COYO] Received config data");
                data.config = JSON.parse(event.data.data);
                setError(false);
                break;
            case "userdata":
                console.log("[COYO] Received user data");
                data.user = JSON.parse(event.data.data);
                setError(false);
                break;
            case "l10ndata":
                console.log("[COYO] Received l10n data");
                data.l10n = JSON.parse(event.data.data);
                setError(false);
                break;
            case "usererror":
                console.log("[COYO] Received a user error: ", event.data.description);
                break;
            case "error":
                console.log("[COYO] Received an error: ", event.data.description);
                setError(true, event.data.type, event.data.description);
                objToSend = status.error;
                browser.runtime.sendMessage(objToSend);
                break;
            default:
                console.error("[COYO] Unknown event type: ", message.type);
                break;
        }
    }, false);

    /**
     * Listens for messages from the background script.
     * 
     * @param {object} request The request containing the information
     */
    browser.runtime.onMessage.addListener((request) => {
        console.log("[COYO] Received request: ", request);
        let objToSend = {};
        if (status.error.error) {
            objToSend = status.error;
            browser.runtime.sendMessage(objToSend);
            return;
        }
        switch (request.type) {
            case "showuser":
                if (!data.user) {
                    objToSend = {
                        type: "loggedout"
                    };
                } else {
                    console.log("[COYO] user data:", data.user);
                    objToSend = {
                        type: "userdata",
                        data: data.user
                    };
                }
                browser.runtime.sendMessage(objToSend);
                break;
            case "showconfig":
                console.log("[COYO] config data:", data.config);
                objToSend = {
                    type: "configdata",
                    data: data.config
                };
                browser.runtime.sendMessage(objToSend);
                break;
            case "showl10n":
                console.log("[COYO] l10n data:", data.l10n);
                objToSend = {
                    type: "l10ndata",
                    data: data.l10n
                };
                browser.runtime.sendMessage(objToSend);
                break;
            default:
                console.log("[COYO] Unknown request type: ", request.type);
                break;
        }
    });

    /**
     * Inject internal script to access to the `window` variables.
     *
     * @param    {type} file_path Local path of the internal script.
     * @param    {type} tag The tag as string, where the script will be append (default: 'body').
     */
    function injectScript(file_path, tag) {
        // console.log("[COYO] Injecting \"" + file_path + "\" to \"" + tag + "\"");
        let node = document.getElementsByTagName(tag)[0];
        let script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.setAttribute("src", file_path);
        node.appendChild(script);
    }

    (function init() {
        injectScript(browser.extension.getURL("content_scripts/dataretriever.js"), "body");
    })();

})();
