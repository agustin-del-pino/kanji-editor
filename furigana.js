const morph = {
    url: "https://labs.goo.ne.jp/api/morph",
    req: {
        "app_id": "ca81727daf11523cc1c1a3e235f3c1767c4a1c1b68aec6640347ebf13d59669c",
        "request_id": "",
        "sentence": "",
        "info_filter": "form|read"
    }
}

const rgxKanjis = /[\u4E00-\u9FFF]+/g;
const rgxKatakana = /[\u30A0-\u30FF]/g;
const rgxNonKanji = /[^\u4E00-\u9FFF]+/g

function randomId() {
    return Math.random().toString(36)
}

function shiftKana(text) {
    return text.replace(rgxKatakana,
        (kana) => kana === 'ー' ? kana : String.fromCharCode(kana.charCodeAt(0) - 0x60));
}

function atStr(str, index) {
    if (index < 0) {
        return str[str.length + index]
    }

    return str[index];
}

function splitWord(word) {
    let kanji = word.match(rgxKanjis) || [];
    let okuri = word.match(rgxNonKanji) || [];

    return {
        kanji: kanji.join(''),
        okuri: okuri.join(''),
    };
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
            const rt = document.createElement("rt");
            const hira = shiftKana(read);

            rt.textContent = hira;
            const { kanji, okuri } = splitWord(word);

            for (let i = 1; i <= okuri.length; i++) {
                if (atStr(okuri, -i) === atStr(hira, -i)) {
                    rt.textContent = hira.substring(0, hira.length - i);
                }
            }

            const ruby = document.createElement("ruby");
            ruby.textContent = kanji;
            
            fn?.(rt);
            ruby.appendChild(rt)

            if (okuri === "") {
                return [...rby, ruby]
            }

            const rubyOkuri = document.createElement("ruby");
            rubyOkuri.textContent = okuri

            return [...rby, ruby, rubyOkuri];
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

