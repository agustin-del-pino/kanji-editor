const EOF = "\x00";
const TokenType = {
    EOF: -1,
    PLAIN: 0,
    TITLE: 1,
    ITALIC: 2,
    BOLD: 3,
    BOLD_ITALIC: 4,
    UNDERLINE: 5,
    BULLET: 6,
    QUOTE: 7,
    BREAK: 8
}

const decorators = {
    1: TokenType.ITALIC,
    2: TokenType.BOLD,
    3: TokenType.BOLD_ITALIC
}

const breakers = "#_*->";

class Scanner {
    #src = "";
    #pos = 0;
    constructor(text) {
        this.#src = text + EOF;
    }
    get char() {
        return this.#src[this.#pos]
    }
    next() {
        const tok = {
            type: TokenType.PLAIN,
            value: "",
            data: null
        }
        switch (this.char) {
            case EOF:
                tok.type = TokenType.EOF;
                return tok;
            case "#": {
                const p = this.#pos;
                let heading = 0;
                for (; this.char === "#"; this.#pos++, heading++) { }
                if (this.char === " ") {
                    tok.type = TokenType.TITLE;
                }
                for (; !(this.char === "\n" || this.char === EOF); this.#pos++) { }

                tok.value = this.#src.substring(p, this.#pos);
                tok.data = tok.type === TokenType.TITLE ? heading : null;

                return tok;
            }
            case "*": {
                const p = this.#pos;
                let decorator = 0;
                for (; this.char === "*"; this.#pos++, decorator++) { }
                if (this.char !== " ") {
                    if (decorator <= 3) {
                        tok.type = decorators[decorator];
                    }
                }
                for (; !(this.char === "*" || this.char === EOF); this.#pos++) { }
                if (this.#src[this.#pos - 1] === " ") {
                    tok.type = TokenType.PLAIN;
                } else {
                    for (let i = 0; i < decorator; i++, this.#pos++) {
                        if (this.char !== "*") {
                            tok.type = TokenType.PLAIN;
                            break;
                        }
                    }
                }

                tok.value = this.#src.substring(p, this.#pos);
                return tok;
            }
            case "_": {
                const p = this.#pos;
                this.#pos++;

                if (this.char !== " ") {
                    tok.type = TokenType.UNDERLINE;
                }

                for (; !(this.char === "_" || this.char === EOF); this.#pos++) { }
                if (this.#src[this.#pos - 1] === " " || this.char !== "_") {
                    tok.type = TokenType.PLAIN;
                } else {
                    this.#pos++;
                }
                tok.value = this.#src.substring(p, this.#pos);
                return tok;
            }

            case "-": {
                const p = this.#pos;
                this.#pos++;

                if (this.char === " ") {
                    tok.type = TokenType.BULLET;
                }

                for (; !(this.char === "\n" || this.char === EOF); this.#pos++) { }
                tok.value = this.#src.substring(p, this.#pos);
                if (tok.value === "---") {
                    tok.type = TokenType.BREAK;
                }
                return tok;
            }

            case ">": {
                const p = this.#pos;
                this.#pos++;
                tok.type = TokenType.QUOTE;

                for (; !(this.char === "\n" || this.char === EOF); this.#pos++) { }
                tok.value = this.#src.substring(p, this.#pos);
                return tok;
            }
            default: {
                const p = this.#pos;
                for (; !(breakers.includes(this.char) || this.char === EOF); this.#pos++) { }
                tok.value = this.#src.substring(p, this.#pos);
                return tok;
            }
        }
    }
}

const MD = new (class {
    /**
     * @type {Scanner}
     */
    #scanner;
    #tok = {
        type: 0,
        value: "",
        data: null
    };
    #next() {
        this.#tok = this.#scanner.next();
    }

    #parsePlain() {
        const span = document.createElement("span");
        span.textContent = this.#tok.value;
        this.#next();

        for (; this.#tok.type === TokenType.PLAIN;) {
            span.textContent += this.#tok.value;
            this.#next();
        }

        span.classList.add("md-plain");

        return span;
    }

    #parseTitle() {
        const heading = document.createElement(`h${this.#tok.data}`);
        heading.textContent = this.#tok.value.substring(this.#tok.data + 1);
        this.#next();
        heading.classList.add("md-heading");
        return heading;
    }
    #parseItalic() {
        const span = document.createElement(`span`);
        span.textContent = this.#tok.value.substring(1, this.#tok.value.length - 1);
        this.#next();
        span.classList.add("md-italic");
        return span;
    }
    #parseBold() {
        const span = document.createElement(`span`);
        span.textContent = this.#tok.value.substring(2, this.#tok.value.length - 2);
        this.#next();
        span.classList.add("md-bold");
        return span;
    }
    #parseBoldItalic() {
        const span = document.createElement(`span`);
        span.textContent = this.#tok.value.substring(3, this.#tok.value.length - 3);
        this.#next();
        span.classList.add("md-bold", "md-italic");
        return span;
    }
    #parseUnderline() {
        const span = document.createElement(`span`);
        span.textContent = this.#tok.value.substring(1, this.#tok.value.length - 1);
        this.#next();
        span.classList.add("md-underline");
        return span;
    }
    #parseQuote() {
        const span = document.createElement(`span`);
        span.textContent = this.#tok.value.substring(1);
        this.#next();
        span.classList.add("md-quote");
        return span;
    }
    #parseBullet() {
        const ul = document.createElement("ul");
        for (; this.#tok.type === TokenType.BULLET;) {
            const li = document.createElement("li");
            li.textContent = this.#tok.value.substring(1);
            li.classList.add("md-bullet");
            ul.appendChild(li);
            this.#next();
        }
        ul.classList.add("md-bullet-list");
        return ul
    }
    #parseBreak() {
        const div = document.createElement(`div`);
        this.#next();
        div.classList.add("md-break");
        return div;
    }

    parse(text) {
        this.#scanner = new Scanner(text);
        this.#next();
        const html = [];

        for (; this.#tok.type !== TokenType.EOF;) {
            switch (this.#tok.type) {
                case TokenType.PLAIN:
                    html.push(this.#parsePlain());
                    break;
                case TokenType.TITLE:
                    html.push(this.#parseTitle());
                    break;
                case TokenType.ITALIC:
                    html.push(this.#parseItalic());
                    break;
                case TokenType.BOLD:
                    html.push(this.#parseBold());
                    break;
                case TokenType.BOLD_ITALIC:
                    html.push(this.#parseBoldItalic());
                    break;
                case TokenType.UNDERLINE:
                    html.push(this.#parseUnderline());
                    break;
                case TokenType.QUOTE:
                    html.push(this.#parseQuote());
                    break;
                case TokenType.BULLET:
                    html.push(this.#parseBullet());
                    break;
                case TokenType.BREAK:
                    html.push(this.#parseBreak());

            }
        }
        return html;
    }
})();

export default MD;