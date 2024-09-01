const morph = {
    url: "https://labs.goo.ne.jp/api/morph",
    req: {
        "app_id": "ca81727daf11523cc1c1a3e235f3c1767c4a1c1b68aec6640347ebf13d59669c",
        "request_id": "",
        "sentence": "",
        "info_filter": "form|read"
    }
}

const rgxKanjis = /[\u4E00-\u9FAF]/;
const rgxKatakana = /[\u30A0-\u30FF]/g;

function randomId() {
    return Math.random().toString(36)
}

function shiftKana(text) {
    return text.replace(rgxKatakana,
        (kana) => kana === 'ー' ? kana : String.fromCharCode(kana.charCodeAt(0) - 0x60));
}

export default async function furigana(sentence, fn) {
    const request_id = randomId();
    const res = await fetch(morph.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...morph.req, sentence, request_id })
    });

    const { word_list } = await res.json();

    return word_list.flat().reduce((rby, [word, read]) => {
        if (rgxKanjis.test(word)) {
            const ruby = document.createElement("ruby");
            ruby.textContent += word;
            const rt = document.createElement("rt");
            rt.textContent = shiftKana(read);
            fn?.(rt);
            ruby.appendChild(rt)
            return [...rby, ruby]
        }

        if (rby.at(-1)?.querySelector("rt") !== undefined) {
            const ruby = document.createElement("ruby");
            ruby.textContent += word;
            return [...rby, ruby]
        }

        rby.at(-1).textContent += word;

        return rby;
    }, [document.createElement("ruby")]);
}

