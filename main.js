import furigana from "./furigana.js";
import MD from "./md.js";

const SESSION_KEY = "kjeditor-session";
const PREVIEW_KEY = `${SESSION_KEY}:preview`;
const EDITOR_KEY = `${SESSION_KEY}:editor`;

const editor = document.querySelector("#editor");
const preview = document.querySelector("#preview");
const writer = document.querySelector("#writer");
const render = document.querySelector("#render");
const addFontModal = document.querySelector("#modal-font");
const loading = document.querySelector("#modal-loading");
const furiganaEditor = document.querySelector("#modal-furigana");
const furiganaEntry = document.querySelector("#furigana-entry");
const fontSelection = document.querySelector("#fonts");
const fontUrl = document.querySelector("#font-url");
const fontName = document.querySelector("#font-name");

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

editor.addEventListener("input", () => parseText());

fontSelection.addEventListener("change", ({ target }) => {
    if (target.value === "-") {
        addFontModal.showModal();
        return;
    }
    preview.style.fontFamily = target.value;
});

document.querySelector("#furigana").addEventListener("click", async () => {
    loading.showModal();
    const task = [];
    for (const c of preview.children) {
        if (c.classList.contains("md-break")) continue;
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
document.querySelector("#print").addEventListener("click", () => print());
document.querySelector("#bold").addEventListener("click", () => replaceText((text) => `**${text}**`));
document.querySelector("#italic").addEventListener("click", () => replaceText((text) => `*${text}*`));
document.querySelector("#underline").addEventListener("click", () => replaceText((text) => `_${text}_`));
document.querySelector("#bullet").addEventListener("click", () => replaceText((text) => `- ${text}`));
document.querySelector("#quote").addEventListener("click", () => replaceText((text) => `> ${text}`));
document.querySelector("#break").addEventListener("click", () => replaceText((text) => `---\n${text}`));
document.querySelector("#heading").addEventListener("click", () => replaceText((text) => text.startsWith("# ") ? `#${text}` : `# ${text}`));
document.querySelector("#show-preview").addEventListener("click", () => {
    writer.classList.add("hidden")
    render.classList.remove("hidden")
});
document.querySelector("#close-preview").addEventListener("click", () => {
    writer.classList.remove("hidden")
    render.classList.add("hidden")
});
document.querySelector("#save").addEventListener("click", () => {
    const blob = new Blob([editor.value], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'kjeditor.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
})
document.querySelector("#sizes").addEventListener("change", ({ target }) => {
    for (const c of preview.classList) {
        if (c.endsWith("xl")) {
            console.log(c);
            preview.classList.remove(c);
            preview.classList.add(target.value);
            return;
        }
    }
})
document.querySelector("#discard-font").addEventListener("click", () => {
    addFontModal.close();
    fontUrl.value = "";
    fontName.value = "";
})
document.querySelector("#add-font").addEventListener("click", () => {
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
document.querySelector("#save-furigana").addEventListener("click", async () => {
    furiganaEditor.rt.textContent = furiganaEntry.value;
    await draftPreview();
    furiganaEditor.close();
})
document.querySelector("#discard-furigana").addEventListener("click", () => {
    furiganaEditor.close();
})

editor.value = localStorage.getItem(EDITOR_KEY) || "";
preview.innerHTML = localStorage.getItem(PREVIEW_KEY) || "";
