export type NodeType =
    | 'quantity'
    | 'name'
    | 'tag'
    | 'version'
    | 'whitespace'
    | 'comment'
    | 'board'

export interface Node {
    line: number
    column: number
    value: string
    type: NodeType
}

export function parse(src: string): Node[][] {
    return src.split('\n').map((row, i) => parseRow(row, i))
}

export function parseRow(src: string, line: number): Node[] {
    let state: NodeType = 'whitespace'
    const nodes: Node[] = []
    let current = ''
    for (let i = 0; i < src.length; i++) {
        const c = src[i]

        switch (state) {
            case 'whitespace':
                if (isWhitespace(c)) {
                    current += c
                } else {
                    if (current.length > 0) {
                        nodes.push({
                            line: line,
                            column: i - current.length,
                            value: current,
                            type: 'whitespace',
                        })
                    }
                    current = c

                    if (c === '#') {
                        state = 'tag'
                    } else if (/[0-9]/.test(c)) {
                        state = 'quantity'
                    } else if (c === ';') {
                        state = 'comment'
                    } else if (c === '[') {
                        state = 'version'
                    } else if (/[ \t\n]/.test(c)) {
                        state = 'whitespace'
                    } else {
                        state = 'name'
                    }
                }
                break

            case 'name':
                if (c === '#') {
                    state = 'tag'
                } else if (c === '[') {
                    state = 'version'
                } else if (c === ';') {
                    state = 'comment'
                }
                if (state === 'name') {
                    current += c
                } else {
                    const card = current.trimEnd()
                    nodes.push({
                        line: line,
                        column: i - current.length,
                        value: card,
                        type: 'name',
                    })
                    nodes.push({
                        line: line,
                        column: i - current.length,
                        value: current.slice(card.length),
                        type: 'whitespace',
                    })
                    current = c
                }
                break

            case 'version':
                if (c !== ']') {
                    current += c
                } else {
                    current += c
                    nodes.push({
                        line: line,
                        column: i - current.length,
                        value: current,
                        type: 'version',
                    })
                    state = 'whitespace'
                    current = ''
                }
                break

            case 'tag':
                if (!isWhitespace(c)) {
                    current += c
                } else {
                    state = 'whitespace'
                    nodes.push({
                        line: line,
                        column: i - current.length,
                        value: current,
                        type: 'tag',
                    })
                    current = c
                }
                break

            case 'quantity':
                if (/[0-9]/.test(c) || (current.length > 1 && c === 'x')) {
                    current += c
                } else {
                    state = 'whitespace'
                    nodes.push({
                        line: line,
                        column: i - current.length,
                        value: current,
                        type: 'quantity',
                    })
                    current = c
                }
                break

            case 'comment':
                current += c
                break
        }
    }
    if (current.length > 0) {
        nodes.push({
            line: line,
            column: src.length - current.length,
            value: current,
            type: state,
        })
    }

    return nodes
}

export function stringifyDeck(nodes: Node[][]): string {
    return nodes.map(row => stringifyRow(row)).join('\n')
}
export function stringifyRow(nodes: Node[]): string {
    return nodes.map(node => node.value).join('')
}

function isWhitespace(c: string): boolean {
    return c === ' ' || c === '\t' || c === '\n'
}
