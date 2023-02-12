/**
 * COYO - Web Extension
 * 
 * (c) Copyright 2017 Denis Meyer. All rights reserved.
 */
(function() {
    if (!window.postMessage) {
        console.error("[COYO] The function \"window.postMessage\" is not defined.");
        return;
    }

    /**
     * Sends a message to the content script.
     * 
     * @param {string} type The message type
     * @param {string} data The message data
     * @param {string} description Optional description
     */
    function sendMessage(type, data, description) {
        window.postMessage({
            type: type,
            data: data,
            description: description
        }, "*");
    }

    if (!window.Config || !window.Config.backendUrl) {
        console.error("[COYO] This extension only works on COYO websites...");
        sendMessage("error", "", "This extension only works on COYO websites.");
        return;
    }

    (function init () {
        if (angular) {
            const config = angular.element(document.body).injector().get('coyoConfig');
            if (config) {
                sendMessage("configdata", JSON.stringify(config));
            } else {
                console.error("[COYO] The COYO config is not defined.");
                sendMessage("error", "", "The COYO config is not defined.");
            }
            const auth = angular.element(document.body).injector().get('authService');
            if (auth) {
                if (!auth.isAuthenticated()) {
                    sendMessage("usererror", "", "No user is currently authenticated.");
                } else {
                    auth.getUser().then(function(user) {
                        sendMessage("userdata", JSON.stringify(user));
                    });
                }
            } else {
                console.error("[COYO] The auth service is not defined.");
                sendMessage("error", "", "The auth service is not defined.");
            }
            const translate = angular.element(document.body).injector().get('$translate');
            if (translate) {
                let stringifiedData = JSON.stringify({
                    availableLanguageKeys: translate.getAvailableLanguageKeys(),
                    translationTable: translate.getTranslationTable()
                });
                sendMessage("l10ndata", stringifiedData);
            } else {
                console.error("[COYO] The translation service is not defined.");
                sendMessage("error", "", "The translation service is not defined.");
            }
        } else {
            console.error("[COYO] Angular is not defined.");
            sendMessage("error", "", "Angular is not defined.");
        }
    })();
})();
