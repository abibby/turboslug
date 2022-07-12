import { bind } from '@zwzn/spicy'
import { DBCard, findCard, searchCards } from 'js/database'
import { Board } from 'js/deck'
import { useEventTarget } from 'js/hooks/use-event-target'
import { Node } from 'js/parse'
import { strings, unique } from 'js/util'
import { Fragment, FunctionalComponent, h } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import Card from './card'

type Options = Array<readonly [string, CardWithSet]> | Array<readonly [string]>

interface BaseProps {
    onSelect: (value: string | null) => void
    textArea: HTMLTextAreaElement | null
}

interface CardWithSet extends DBCard {
    setKey?: string
}

interface BaseAutocompleteProps extends BaseProps {
    options: Options | null
}

const BaseAutocomplete: FunctionalComponent<BaseAutocompleteProps> = props => {
    const [selected, setSelected] = useState(0)
    useEventTarget(
        props.textArea,
        'keydown',
        (e: KeyboardEvent) => {
            const len = props.options?.length ?? 1
            if (len === 0) {
                props.onSelect(null)
                return
            }
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setSelected((selected + 1) % len)
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setSelected((selected + len - 1) % len)
                    break

                case 'ArrowLeft':
                case 'ArrowRight':
                case 'Escape':
                    props.onSelect(null)
                    break

                case 'Enter':
                case 'Tab':
                    const result = props.options?.[selected][0] ?? null
                    if (result !== null) {
                        e.preventDefault()
                    }
                    props.onSelect(result)
                    break
            }
        },
        [props.options, selected, props.onSelect],
    )

    useEventTarget(
        props.textArea,
        'click',
        (e: Event) => {
            props.onSelect(null)
        },
        [props.onSelect],
    )

    useEffect(() => {
        setSelected(0)
    }, [props.options])

    if (props.options === null) {
        return <div class='autocomplete'>Loading...</div>
    }

    if (props.options.length === 0) {
        return <div class='autocomplete'>No cards</div>
    }

    const selectedCard = props.options[selected % props.options.length][1]

    return (
        <div class='autocomplete'>
            {selectedCard !== undefined && (
                <Card card={selectedCard} set={selectedCard.setKey} />
            )}
            <div class='options'>
                {props.options.map(([title, c], i) => (
                    <div
                        key={c?.id ?? title}
                        class={`option ${i === selected ? 'selected' : ''}`}
                        onClick={bind(title, props.onSelect)}
                        onMouseEnter={bind(i, setSelected)}
                    >
                        {title}
                    </div>
                ))}
            </div>
        </div>
    )
}

interface CardAutocompleteProps extends BaseProps {
    name: string
}

export const CardAutocomplete: FunctionalComponent<
    CardAutocompleteProps
> = props => {
    const [options, setOptions] = useState<Options | null>(null)

    const search = props.name

    const abort = useRef<AbortController | null>(null)
    useEffect(() => {
        abort.current?.abort()
        abort.current = new AbortController()

        searchCards(search, {}, abort.current)
            .then(paginatedCards => {
                abort.current = null
                setOptions(
                    paginatedCards?.results.map(
                        card => [card.name, card] as const,
                    ),
                )
            })
            .catch(e => {
                abort.current = null
            })
    }, [search])

    return <BaseAutocomplete {...props} options={options} />
}

interface VersionAutocompleteProps extends BaseProps {
    search: string
    card?: string
}
export const VersionAutocomplete: FunctionalComponent<
    VersionAutocompleteProps
> = ({ card, search, ...props }) => {
    const [dbCard, setDBCard] = useState<DBCard | undefined>(undefined)
    const [options, setOptions] = useState<Options | null>(null)
    useEffect(() => {
        if (card !== undefined) {
            findCard(card.trim()).then(c => {
                setDBCard(c)
            })
        }
    }, [card])
    useEffect(() => {
        if (dbCard !== undefined) {
            const s = search.replace(/^\[/, '').replace(/\]$/, '')

            const opt = Object.entries(dbCard.image_urls)
                .filter(([key]) => {
                    if (s === '') {
                        return true
                    }
                    return key.includes(s)
                })
                .sort(([a], [b]) =>
                    a.localeCompare(b, undefined, { numeric: true }),
                )
                .slice(0, 15)
                .map(
                    ([key]) =>
                        [
                            `[${key}]`,
                            {
                                ...dbCard,
                                setKey: key,
                            },
                        ] as const,
                )
            setOptions(opt)
        } else {
            setOptions(null)
        }
    }, [search, dbCard])

    return <BaseAutocomplete {...props} options={options ?? null} />
}

interface TagAutocompleteProps extends BaseProps {
    search: string
    boards: Board[]
}
export const TagAutocomplete: FunctionalComponent<TagAutocompleteProps> = ({
    boards,
    search,
    ...props
}) => {
    const [options, setOptions] = useState<Options | null>(null)

    useEffect(() => {
        const tags = boards
            .flatMap(b => b.cards.flatMap(c => c.tags))
            .sort(strings('asc', true))
            .filter(unique)
            .map(t => t.replace(' ', '_'))
            .filter(t => t !== '' && t !== search.slice(1))
            .filter(
                t =>
                    search === '' ||
                    t.toLowerCase().includes(search.slice(1).toLowerCase()),
            )
            .map(t => ['#' + t] as const)
        setOptions(tags)
    }, [search, boards])

    return <BaseAutocomplete {...props} options={options} />
}

interface AutocompleteProps extends BaseProps {
    node: Node | undefined
    boards: Board[]
    card: string | undefined
}
export const Autocomplete: FunctionalComponent<AutocompleteProps> = ({
    node,
    card,
    ...props
}) => {
    if (node?.type === 'name') {
        return <CardAutocomplete {...props} name={node.value} />
    }
    if (node?.type === 'version') {
        return (
            <VersionAutocomplete {...props} card={card} search={node.value} />
        )
    }
    if (node?.type === 'tag') {
        return <TagAutocomplete {...props} search={node.value} />
    }
    return <></>
}
