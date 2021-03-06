"use strict";

define(["pebkac"], function (PebkacError) {

    /**
     * L'identifiant de la file d'attente des vidéos.
     */
    const PLAYLIST_ID = 1;

    /**
     * L'ordre des formats vidéo selon l'option choisie.
     */
    const FORMATS = {
        "hd_webm": ["hd_mp4", "mp4", "webm", "hd_webm"],
        "webm":    ["hd_mp4", "hd_webm", "mp4", "webm"],
        "hd_mp4":  ["hd_webm", "webm", "mp4", "hd_mp4"],
        "mp4":     ["hd_webm", "hd_mp4", "webm", "mp4"]
    };

    /**
     * Les règles avec les patrons et leur action.
     */
    const rules = new Map();

    /**
     * Extrait les informations nécessaire pour lire une vidéo sur Kodi.
     *
     * @param {String} url L'URL d'une vidéo Air Mozilla.
     * @return {Promise} L'identifiant de la file d'attente et l'URL du fichier.
     */
    rules.set(["https://air.mozilla.org/*/"], function (url) {
        return browser.storage.local.get(["airmozilla-format"]).then(
                                                             function (config) {
            const formats = FORMATS[config["airmozilla-format"]];

            return fetch(url.toString()).then(function (response) {
                return response.text();
            }).then(function (data) {
                const doc = new DOMParser().parseFromString(data, "text/html");

                let file = null;
                for (const a of doc.querySelectorAll("[download]")) {
                    const href = new URL(a.getAttribute("href"));
                    if (null === file ||
                            formats.indexOf(file.searchParams.get("format")) <
                            formats.indexOf(href.searchParams.get("format"))) {
                        file = href;
                    }
                }

                if (null === file) {
                    throw new PebkacError("novideo", "Air Mozilla");
                }
                return {
                    "playlistid": PLAYLIST_ID,
                    "file":       file.toString()
                };
            });
        });
    });

    return rules;
});
