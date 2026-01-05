import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const CACHE = path.join(process.cwd(), "cache.json");
let cache = {};

if (fs.existsSync(CACHE)) {
    try {
        cache = JSON.parse(fs.readFileSync(CACHE, "utf-8"));
    } catch (err) {
        console.error("Failed to load cache:", err);
        cache = {};
    }
}


function write() {
    try {
        fs.writeFileSync(CACHE, JSON.stringify(cache), "utf-8");
    } catch (err) {
        console.error("Failed to save cache:", err);
    }
}

app.use(express.static("public"));

app.get("/api/v1/mizuena", async (req, res) => {
    try {
        // UUID system so people can easily get the source image
        const uuidParam = req.query.uuid;

        if (uuidParam && cache[uuidParam]) {
            const img = await fetch(cache[uuidParam]);
            const buffer = await img.arrayBuffer();

            res.setHeader("Content-Type", "image/jpeg");
            return res.send(Buffer.from(buffer));
        }

        const query = "akiyama_mizuki shinonome_ena";
        const url = new URL("https://safebooru.org/index.php");

        url.searchParams.append("page", "dapi");
        url.searchParams.append("s", "post");
        url.searchParams.append("q", "index");
        // when calling the API with default limit max page is 7
        url.searchParams.append("pid", Math.floor(Math.random() * 7 + 1).toString());
        url.searchParams.append("tags", query);
        url.searchParams.append("json", "1");

        // Tagging system doesn't allow me to only search for posts containing two characters
        // So I have to use this really really stupid hack
        // Note: I'm writing this at 3 AM, there are probably typos. I dont speak Japanese!
        const blacklisted = [
            "hatsune_miku", "kagamine_rin", "kagamine_len", "megurine_luka", "meiko", "kaito", // VIRTUAL SINGER
            "hoshino_ichika", "tenma_saki", "mochizuki_honami", "hinomori_shiho", // Leo/need
            "hanasato_minori", "kiritani_haruka", "momoi_airi", "hinomori_shizuku", // MORE MORE JUMP!
            "azusawa_kohane", "shiraishi_an", "shinonome_akito", "aoyagi_toya", // Vivid BAD SQUAD
            "tenma_tsukasa", "otori_emu", "kusanagi_nene", "kamishiro_rui", // WonderlandsxShowtime
            "yoisaki_kanade", "asahina_mafuyu" // Rest of Nightcord at 25:00
        ];

        const response = await fetch(url.href);
        /*
        [{
            "file_url": "https://safebooru.org/images/4340/b7fc8e8bf43e4651bd688be5b74ad04229f5bedd.jpg",
            "tags": "1other 3girls :d akiyama_mizuki animal_ear_fluff animal_ears asahina_mafuyu black_jacket black_shirt blue_eyes blue_jacket blush brown_background brown_eyes brown_hair brown_shirt cat_ears cat_girl cat_other cat_tail collarbone collared_shirt grey_hair grey_shirt hair_between_eyes hair_over_shoulder highres jacket kemonomimi_mode long_hair mini_person minigirl multiple_girls no_mouth parted_lips pink_hair pink_sweater project_sekai purple_hair shinonome_ena shirt smile sorimachi-doufu sparkle sweat sweater tail translation_request violet_eyes yoisaki_kanade"
        }]
        */
        const data = await response.json();

        let post = null;
        let found = false; // found valid post

        while (found === false) {
            post = data[Math.floor(Math.random() * data.length)]; // Random post
            const tags = post.tags.split(" ");

            // Find valid post (only mizuena)
            if (!tags.some(tag => blacklisted.includes(tag))) {
                found = true;
            }
        }

        const uuid = crypto.randomUUID();
        cache[uuid] = post.file_url;

        write();
        res.json({ uuid: uuid });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// For embed
app.get("/api/v1/mizuena_old", async (_req, res) => {
    try {
        const query = "akiyama_mizuki shinonome_ena";
        const url = new URL("https://safebooru.org/index.php");

        url.searchParams.append("page", "dapi");
        url.searchParams.append("s", "post");
        url.searchParams.append("q", "index");
        url.searchParams.append("pid", Math.floor(Math.random() * 7 + 1).toString());
        url.searchParams.append("tags", query);
        url.searchParams.append("json", "1");

        const blacklisted = [
            "hatsune_miku", "kagamine_rin", "kagamine_len", "megurine_luka", "meiko", "kaito",
            "hoshino_ichika", "tenma_saki", "mochizuki_honami", "hinomori_shiho",
            "hanasato_minori", "kiritani_haruka", "momoi_airi", "hinomori_shizuku",
            "azusawa_kohane", "shiraishi_an", "shinonome_akito", "aoyagi_toya",
            "tenma_tsukasa", "otori_emu", "kusanagi_nene", "kamishiro_rui",
            "yoisaki_kanade", "asahina_mafuyu"
        ];

        const response = await fetch(url.href);
        const data = await response.json();

        let post = null;
        let found = false;

        while (found === false) {
            post = data[Math.floor(Math.random() * data.length)];
            const tags = post.tags.split(" ");

            if (!tags.some(tag => blacklisted.includes(tag))) {
                found = true;
            }
        }

        const img = await fetch(post.file_url);
        const buffer = await img.arrayBuffer();

        res.setHeader("Content-Type", "image/jpeg");
        res.send(Buffer.from(buffer));
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`)
});
