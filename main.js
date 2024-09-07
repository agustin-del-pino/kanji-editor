import furigana from "./furigana.js";
import MD from "./md.js";


const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const SESSION_KEY = "kjeditor-session";
const PREVIEW_KEY = `${SESSION_KEY}:preview`;
const EDITOR_KEY = `${SESSION_KEY}:editor`;

const FILENAME = "kjeditor.txt";

const editor = $("#editor");
const preview = $("#preview");
const writer = $("#writer");
const render = $("#render");
const addFontModal = $("#modal-font");
const loading = $("#modal-loading");
const furiganaEditor = $("#modal-furigana");
const furiganaEntry = $("#furigana-entry");
const fontSelection = $("#fonts");
const fontUrl = $("#font-url");
const fontName = $("#font-name");

function replaceText(fn) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = fn(editor.value.substring(start, end))
    editor.value = editor.value.substring(0, start) + text + editor.value.substring(end);
    editor.focus();
    editor.selectionStart = (editor.selectionEnd = start + text.length);
    parseText();
}

async function draftEditor() {
    localStorage.setItem(EDITOR_KEY, editor.value);
}

async function draftPreview() {
    localStorage.setItem(PREVIEW_KEY, preview.innerHTML);
}

function parseText() {
    preview.innerHTML = "";
    MD.parse(editor.value).forEach(e => preview.appendChild(e))
    draftEditor().then(draftPreview);
}

function editFurigana({ target }) {
    furiganaEntry.value = target.textContent;
    furiganaEditor.rt = target;
    furiganaEditor.showModal();
}

function addFuriganaEdition(rt) {
    rt.addEventListener("click", editFurigana);
    rt.classList.add("cursor-pointer");
}

function download(name, txt) {
    const blob = new Blob([txt], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

editor.addEventListener("input", () => parseText());

fontSelection.addEventListener("change", ({ target }) => {
    if (target.value === "-") {
        addFontModal.showModal();
        return;
    }
    preview.style.fontFamily = target.value;
});

$("#print").addEventListener("click", () => print());
$("#save").addEventListener("click", () => download(FILENAME, editor.value));
$("#bold").addEventListener("click", () => replaceText((text) => `**${text}**`));
$("#italic").addEventListener("click", () => replaceText((text) => `*${text}*`));
$("#underline").addEventListener("click", () => replaceText((text) => `_${text}_`));
$("#bullet").addEventListener("click", () => replaceText((text) => `- ${text}`));
$("#quote").addEventListener("click", () => replaceText((text) => `> ${text}`));
$("#break").addEventListener("click", () => replaceText((text) => `---\n${text}`));
$("#heading").addEventListener("click", () => replaceText((text) => text.startsWith("# ") ? `#${text}` : `# ${text}`));
$("#furigana").addEventListener("click", async () => {
    loading.showModal();
    const task = [];
    for (const c of preview.children) {
        if (c.classList.contains("md-break")) continue;
        
        if (c.classList.contains("md-bullet-list")) {
            for (const li of c.children) {
                task.push((async (ch) => {
                    const rubies = await furigana(ch.textContent, addFuriganaEdition);
                    ch.innerHTML = "";
                    rubies.forEach(r => ch.appendChild(r))
                })(li));
            }
            continue
        } 

        task.push((async (ch) => {
            const rubies = await furigana(ch.textContent, addFuriganaEdition);
            ch.innerHTML = "";
            rubies.forEach(r => ch.appendChild(r))
        })(c));
    }
    await Promise.all(task);
    await draftPreview();
    loading.close();
});
$("#show-preview").addEventListener("click", () => {
    writer.classList.add("hidden")
    render.classList.remove("hidden")
});
$("#close-preview").addEventListener("click", () => {
    writer.classList.remove("hidden")
    render.classList.add("hidden")
});
$("#sizes").addEventListener("change", ({ target }) => {
    for (const c of preview.classList) {
        if (c.endsWith("xl")) {
            console.log(c);
            preview.classList.remove(c);
            preview.classList.add(target.value);
            return;
        }
    }
})
$("#discard-font").addEventListener("click", () => {
    addFontModal.close();
    fontUrl.value = "";
    fontName.value = "";
})
$("#add-font").addEventListener("click", () => {
    if (fontUrl.value === "" && fontName.value === "") return;

    const option = document.createElement("option");
    option.value = fontName.value;
    option.textContent = fontName.value;
    fontSelection.prepend(option);

    const style = document.createElement("style")
    style.textContent = `@import url('${fontUrl}');`

    addFontModal.close();
    fontUrl.value = "";
    fontName.value = "";
    option.selected = true;
    preview.style.fontFamily = option.value;
})
$("#save-furigana").addEventListener("click", async () => {
    furiganaEditor.rt.textContent = furiganaEntry.value;
    await draftPreview();
    furiganaEditor.close();
})
$("#discard-furigana").addEventListener("click", () => {
    furiganaEditor.close();
})

editor.value = localStorage.getItem(EDITOR_KEY) || "";
preview.innerHTML = localStorage.getItem(PREVIEW_KEY) || "";
