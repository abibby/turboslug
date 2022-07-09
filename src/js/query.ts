import { DBCard } from './database'
import { notNullish } from './util'

export interface QueryField<T, K extends keyof T> {
    attribute: K
    field: string[]
    matcher: (a: T[K], words: string[]) => boolean
    description?: string
}

export type QueryDefinition<T> = Array<
    { [K in keyof T]: QueryField<T, K> }[keyof T]
>

export const filters: QueryDefinition<DBCard> = [
    {
        attribute: 'name',
        field: ['default'],
        matcher: stringMatch,
    },
    {
        attribute: 'oracle_text',
        field: ['oracle', 'o'],
        matcher: stringMatch,
    },
    {
        attribute: 'type',
        field: ['type', 't'],
        matcher: stringMatch,
    },
    {
        attribute: 'set',
        field: ['set', 's'],
        matcher: arrayMatch,
    },
    {
        attribute: 'color_identity',
        field: ['color', 'c'],
        matcher: colorMatch,
    },
    {
        attribute: 'color_identity',
        field: ['commander', 'edh'],
        matcher: commanderColorMatch,
    },
    {
        attribute: 'legalities',
        field: ['legal', 'l'],
        matcher: arrayExactMatch,
    },
    {
        attribute: 'cmc',
        field: ['mana-value', 'cmc', 'mv'],
        matcher: numberMatch,
    },
    {
        attribute: 'power',
        field: ['power', 'p'],
        matcher: numberMatch,
    },
    {
        attribute: 'toughness',
        field: ['toughness', 'd'],
        matcher: numberMatch,
    },
    {
        attribute: 'mana_cost',
        field: ['mana-const', 'mc'],
        matcher: manaCostMatch,
    },
]

function stringMatch(found: string, search: string[]): boolean {
    for (let word of search) {
        const not = word.startsWith('!')
        if (not) {
            word = word.slice(1)
        }

        if (found.toLowerCase().includes(word.toLowerCase()) === not) {
            return false
        }
    }
    return true
}

function exactStringMatch(found: string, search: string[]): boolean {
    for (let word of search) {
        const not = word.startsWith('!')
        if (not) {
            word = word.slice(1)
        }

        if ((found.toLowerCase() === word.toLowerCase()) === not) {
            return false
        }
    }
    return true
}

function manaCostMatch(found: string, search: string[]): boolean {
    return exactStringMatch(
        found,
        search
            .map(s => {
                const matches = s
                    .toLowerCase()
                    .match('^(!)?(\\d+)?([wubrg]+)?$')
                if (matches === null) {
                    return undefined
                }
                const [, not, generic, colored] = matches

                const cost =
                    (not ?? '') +
                    (generic ? `{${generic}}` : '') +
                    (colored ?? '')
                        .split('')
                        .map(c => `{${c}}`)
                        .join('')

                return cost
            })
            .filter(notNullish),
    )
}

function numberMatch(found: number | string | null, search: string[]): boolean {
    if (found === null) {
        return false
    }
    found = Number(found)
    for (const word of search) {
        const [, operator, valueStr] = word.match(/^([<>!]=?)?(\d+)$/) ?? []

        const value = Number(valueStr)
        if (valueStr !== undefined) {
            switch (operator) {
                case '>':
                    if (found <= value) {
                        return false
                    }
                    break
                case '>=':
                    if (found < value) {
                        return false
                    }
                    break
                case '<':
                    if (found >= value) {
                        return false
                    }
                    break
                case '<=':
                    if (found > value) {
                        return false
                    }
                    break
                case '!':
                case '!=':
                    if (found === value) {
                        return false
                    }
                    break
                default:
                    if (found !== value) {
                        return false
                    }
            }
        }
    }
    return true
}

function colorMatch(found: string[], search: string[]): boolean {
    return arrayExactMatch(
        found,
        search.flatMap(s => {
            const not = s.startsWith('!')
            if (not) {
                s = s.slice(1)
            }
            return s
                .split('')
                .filter(c => /^[wubrg]$/i.test(c))
                .map(c => {
                    if (not) {
                        return '!' + c
                    }
                    return c
                })
        }),
    )
}
function commanderColorMatch(found: string[], search: string[]): boolean {
    const searchColors = search.flatMap(s => s.split(''))
    const colors = ['w', 'u', 'b', 'r', 'g']
        .filter(c => !searchColors.includes(c))
        .map(c => '!' + c)

    return arrayExactMatch(found, colors)
}

function arrayExactMatch(found: string[], search: string[]): boolean {
    for (let term of search) {
        const not = term.startsWith('!')
        if (not) {
            term = term.slice(1)
        }
        if (
            (found.find(
                fColor => fColor.toLowerCase() === term.toLowerCase(),
            ) ===
                undefined) !==
            not
        ) {
            return false
        }
    }
    return true
}
function arrayMatch(found: string[], search: string[]): boolean {
    for (const f of found) {
        if (stringMatch(f, search)) {
            return true
        }
    }
    return false
}
