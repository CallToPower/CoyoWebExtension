/**
 * COYO - Web Extension
 * 
 * (c) Copyright 2017 Denis Meyer. All rights reserved.
 */
(function () {

    const globalOptions = {
        json: {
            file: {
                mimetype: "application/json",
                type: "json",
                suffix: ".json"
            }
        },
        xls: {
            file: {
                mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                type: "xls",
                suffix: ".xls"
            },
            printHeaders: false
        }
    }
    const options = {
        config: {
            showCount: true,
            sortKeys: false
        },
        user: {
            showCount: true,
            sortKeys: false
        },
        l10n: {
            showCount: true,
            sortKeys: true
        }
    };
    const keyTranslations = {
        "availableLanguageKeys": browser.i18n.getMessage("keyAvailableLanguageKeys"),
        "translationTable": browser.i18n.getMessage("keyTranslationTable"),
    };

    /**
     * Asserts that the option object is not undefined. If undefined, returns a default options object.
     * 
     * @param {object} options The options object
     */
    function assertOptionsOrGetDefault(options) {
        if (!options) {
            return {
                showCount: true,
                sortKeys: false
            };
        }

        return options;
    }

    /**
     * Formats a given object.
     * 
     * @param {object} obj The object to format
     * @param {int} indent The indentation level
     */
    function formatObj(obj, indent, options) {
        if (obj === undefined || obj === null) {
            return JSON.stringify(obj);
        }
        if (!indent || indent < 0) {
            indent = 0;
        }
        options = assertOptionsOrGetDefault(options);
        let retStr = "";
        let indentStr = "";
        let indentStrEnd = "";
        for (let i = 0; i < indent - 1; ++i) {
            indentStrEnd += "    ";
        }
        indentStr = indentStrEnd + "    ";
        if (typeof obj === "object") {
            let cnt = 0;
            if (Array.isArray(obj)) {
                retStr += "[\n";
                for (let o in obj) {
                    let formattedObj = formatObj(obj[o], indent + 1, options);
                    retStr += (cnt > 0 ? ",\n" : "") + indentStr + formattedObj;
                    ++cnt;
                }
                retStr += "\n" + indentStrEnd + "\]";
            } else {
                retStr += "{\n";
                let keys = Object.keys(obj);
                if (options.sortKeys) {
                    keys.sort();
                }
                keys.forEach(function (v, i) {
                    let formattedObj = formatObj(obj[v], indent + 1, options);
                    retStr += (cnt > 0 ? ",\n" : "") + indentStr + "\"" + v + "\": " + formattedObj;
                    ++cnt;
                });
                retStr += "\n" + indentStrEnd + "\}";
            }
        } else {
            retStr += JSON.stringify(obj);
        }

        return retStr;
    }

    /**
     * Returns a formatted HTML string (list item (li)).
     * 
     * @param {string} key The table key
     * @param {string} dataStr The data string
     * @param {object} options File options
     * @return A formatted HTML string (list item (li))
     */
    function getDownloadAsHtmlLI(key, dataStr, options) {
        let blob = new Blob([dataStr], {
            "type": options.mimetype
        });
        let i18nkey = browser.i18n.getMessage("downloadAs", options.type);
        let filename = 'COYO ' + translateKey(key) + options.suffix;
        return '<li><a href="' + window.URL.createObjectURL(blob) + '" download="' + filename + '">' + i18nkey + '</a></li>';
    }

    /**
     * Formats given start data.
     * 
     * @param {string} key The key -> header (will be translated)
     * @param {object|string} data An object or string to be printed
     * @param {object} options The formatting options
     * @return Formated data string
     */
    function getFormattedData(key, data, options) {
        options = assertOptionsOrGetDefault(options);
        let html = "";
        if (data) {
            html += "<h3>" + translateKey(key) + "</h3>";
            if (typeof data === "object") {
                let cnt = 0;
                let tableStr = "";
                if (Array.isArray(data)) {
                    for (let o in data) {
                        tableStr += (cnt > 0 ? ",\n" : "") + "    " + formatObj(data[o], 2, options);
                        ++cnt;
                    }
                    html += options.showCount ? browser.i18n.getMessage("numberElements") + " " + cnt : "";
                    html += "<pre>[" + (cnt > 0 ? "\n" : "");
                    html += tableStr;
                    html += (cnt > 0 ? "\n" : "") + "]</pre>";
                } else {
                    let keys = Object.keys(data);
                    if (options.sortKeys) {
                        keys.sort();
                    }
                    keys.forEach(function (v, i) {
                        tableStr += (cnt > 0 ? ",\n" : "") + "    " + "\"" + v + "\": " + formatObj(data[v], 2, options);
                        ++cnt;
                    });

                    if (key === "translationTable" && cnt > 0) {
                        html += "<ul>";
                        let jsonStr = "{\n" + tableStr + "\n}";
                        html += getDownloadAsHtmlLI(key, jsonStr, globalOptions.json.file);
                        html += getDownloadAsHtmlLI(key, jsonToSsXml(jsonStr), globalOptions.xls.file);
                        html += "</ul>"
                    }

                    html += options.showCount ? browser.i18n.getMessage("numberKeys") + " " + cnt : "";
                    html += "<pre>{" + (cnt > 0 ? "\n" : "");
                    html += tableStr;
                    html += (cnt > 0 ? "\n" : "") + "}</pre>";
                }
            } else {
                html += JSON.stringify(data);
            }
        }

        return html;
    }

    /**
     * Translates a key. If not found, returns the key.
     * 
     * @param {string} key The key to be translated
     * @return The translated key if found, else the key
     */
    function translateKey(key) {
        let tr = keyTranslations[key];
        return tr ? tr : key;
    }

    /**
     * Reports an error.
     * 
     * @param {string} error The error
     */
    function reportError(error) {
        console.error(`An error occurred: ${error}`);
    }

    /**
     * Listens for clicks on the buttons and sends the appropriate message to the content script in the page.
     */
    function init() {
        document.getElementById("showconfig").addEventListener("click", (e) => {
            function showconfig(tabs) {
                browser.tabs.sendMessage(tabs[0].id, {
                    type: "showconfig"
                });
            }

            browser.tabs.query({
                    active: true,
                    currentWindow: true
                })
                .then(showconfig)
                .catch(reportError);
        });
        document.getElementById("showuser").addEventListener("click", (e) => {
            function showuser(tabs) {
                browser.tabs.sendMessage(tabs[0].id, {
                    type: "showuser"
                });
            }

            browser.tabs.query({
                    active: true,
                    currentWindow: true
                })
                .then(showuser)
                .catch(reportError);
        });
        document.getElementById("showl10n").addEventListener("click", (e) => {
            function showl10n(tabs) {
                browser.tabs.sendMessage(tabs[0].id, {
                    type: "showl10n"
                });
            }

            browser.tabs.query({
                    active: true,
                    currentWindow: true
                })
                .then(showl10n)
                .catch(reportError);
        });
    }

    /**
     * Shows the element with the given ID.
     * 
     * @param {string} id The element ID 
     */
    function showElem(id) {
        document.querySelector("#" + id).classList.remove("hidden");
    }

    /**
     * Hides the element with the given ID.
     * 
     * @param {string} id The element ID 
     */
    function hideElem(id) {
        document.querySelector("#" + id).classList.add("hidden");
    }

    /**
     * When the script execution failed or an erro occurred.
     * 
     * @param {object} error The error
     */
    function onError(error) {
        hideElem("data-content");
        hideElem("popup-content");
        showElem("error-content");
        console.error(`Failed to execute content script: ${error.message}`);
    }

    /**
     * Hides all other content areas and shows the data content area.
     */
    function fillAndShowContent(title, content) {
        let html = "<h2>" + title + "</h2>";
        html += content;
        document.querySelector("#data-content").innerHTML = html;

        hideElem("error-content");
        hideElem("popup-content");
        showElem("data-content");
    }

    /**
     * Formats the given object to HTML.
     * 
     * @param {object} data The data to be formatted 
     */
    function objToHtml(data, options) {
        let html = "";
        for (let key in data) {
            html += getFormattedData(key, data[key], options);
        }

        return html;
    }

    /**
     * Returns the options for the given type. Null if not found.
     * 
     * @param {string} type The request type
     */
    function getOptions(type) {
        switch (type) {
            case "configdata":
                return options.config;
            case "userdata":
                return options.user;
            case "l10ndata":
                return options.l10n;
            default:
                return null;
        }
    }

    /**
     * Returns the header for the given type. Empty string if not found.
     * 
     * @param {string} type The request type
     * @param {string} displayName The Display name if available
     */
    function getHeader(type, displayName) {
        switch (type) {
            case "configdata":
                return browser.i18n.getMessage("headerDataConfig", displayName);
            case "userdata":
                return browser.i18n.getMessage("headerDataUserName", displayName);
            case "l10ndata":
                return browser.i18n.getMessage("headerDataL10n");
            default:
                return "";
        }
    }

    /**
     * Listens for messages from the content script.
     * 
     * @param {object} request The request containing the information
     */
    browser.runtime.onMessage.addListener(
        function (request) {
            switch (request.type) {
                case "configdata":
                case "userdata":
                case "l10ndata":
                    {
                        let html = objToHtml(request.data, getOptions(request.type));
                        fillAndShowContent(getHeader(request.type, request.data["displayName"]), html);
                    }
                    break;
                case "usererror":
                case "loggedout":
                    {
                        let html = browser.i18n.getMessage("errorNotLoggedIn");
                        fillAndShowContent(browser.i18n.getMessage("headerDataUser"), html);
                    }
                    break;
                default:
                case "error":
                    onError(request.description);
                    break;
            }
        }
    );

    /**
     * When the popup loads, inject a content script into the active tab, and add a click handler.
     * If the script couldn't be injected, handle the error.
     */
    browser.tabs.executeScript({
            file: "/content_scripts/maincontent.js"
        })
        .then(init)
        .catch(onError);

    (function init() {
        document.getElementById("showconfig").innerHTML = browser.i18n.getMessage("showConfig");
        document.getElementById("showuser").innerHTML = browser.i18n.getMessage("showUser");
        document.getElementById("showl10n").innerHTML = browser.i18n.getMessage("showL10n");
        document.getElementById("error-content").innerHTML = browser.i18n.getMessage("errorContent");
    })();

    /** JSON to Excel converter */

    function emitXmlHeader(printHeaderValues) {
        let headerRow = '<ss:Row>\n';
        let headers = ['KEY', 'VALUE'];
        for (let h in headers) {
            headerRow += '  <ss:Cell>\n';
            headerRow += '    <ss:Data ss:Type="String">';
            headerRow += headers[h] + '</ss:Data>\n';
            headerRow += '  </ss:Cell>\n';
        }
        headerRow += '</ss:Row>\n';

        return '<?xml version="1.0"?>\n' +
            '<ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n' +
            '<ss:Worksheet ss:Name="Sheet1">\n' +
            '<ss:Table>\n\n' + (printHeaderValues ? headerRow : "");
    };

    function emitXmlFooter() {
        return '\n</ss:Table>\n' +
            '</ss:Worksheet>\n' +
            '</ss:Workbook>\n';
    };

    function jsonToSsXml(jsonObject) {
        var row;
        var col;
        var xml;
        var data = typeof jsonObject != "object" ? JSON.parse(jsonObject) : jsonObject;

        xml = emitXmlHeader(globalOptions.xls.printHeaders);

        for (let key in data) {
            xml += '<ss:Row>\n';
            xml += '  <ss:Cell>\n';
            xml += '    <ss:Data ss:Type="String">';
            xml += key + '</ss:Data>\n';
            xml += '  </ss:Cell>\n';
            xml += '  <ss:Cell>\n';
            xml += '    <ss:Data ss:Type="String">';
            xml += data[key] + '</ss:Data>\n';
            xml += '  </ss:Cell>\n';
            xml += '</ss:Row>\n';
        }

        xml += emitXmlFooter();
        return xml;
    };
})();
