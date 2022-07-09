import { bind } from '@zwzn/spicy'
import { DBCard, findCard, searchCards } from 'js/database'
import { Paginated } from 'js/database.worker'
import { useEventTarget } from 'js/hooks/use-event-target'
import { FunctionalComponent, h } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import Card from './card'

interface BaseProps {
    hidden: boolean
    onSelect: (value: string | null) => void
    textArea: HTMLTextAreaElement | null
}

interface CardWithSet extends DBCard {
    setKey?: string
}

interface AutocompleteProps extends BaseProps {
    options: Array<readonly [string, CardWithSet]> | null
    name: string
}

export const Autocomplete: FunctionalComponent<AutocompleteProps> = props => {
    const [selected, setSelected] = useState(0)
    useEventTarget(
        props.textArea,
        'keydown',
        (e: KeyboardEvent) => {
            if (props.hidden) {
                return
            }
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
        [props.hidden, props.options, selected, props.onSelect],
    )

    useEventTarget(
        props.textArea,
        'click',
        (e: Event) => {
            props.onSelect(null)
        },
        [props.onSelect],
    )

    if (props.options === null) {
        return (
            <div class={`autocomplete ${props.hidden ? 'hidden' : ''}`}>
                Loading...
            </div>
        )
    }

    if (props.options.length === 0) {
        return (
            <div class={`autocomplete ${props.hidden ? 'hidden' : ''}`}>
                No cards
            </div>
        )
    }

    const selectedCard = props.options[selected % props.options.length][1]

    return (
        <div class={`autocomplete ${props.hidden ? 'hidden' : ''}`}>
            <Card card={selectedCard} set={selectedCard.setKey} />
            <div class='options'>
                {props.options.map(([title, c], i) => (
                    <div
                        key={c.id}
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
    // onNewResults: (results: DBCard[]) => void
}

export const CardAutocomplete: FunctionalComponent<
    CardAutocompleteProps
> = props => {
    const [options, setOptions] = useState<Paginated<DBCard> | null>(null)

    const search = props.name
    // const onNewResults = props.onNewResults

    const abort = useRef<AbortController | null>(null)
    useEffect(() => {
        abort.current?.abort()
        abort.current = new AbortController()

        searchCards(search, {}, abort.current)
            .then(c => {
                abort.current = null
                setOptions(c)
                // onNewResults(c.results)
            })
            .catch(e => {
                abort.current = null
            })
    }, [search, setOptions])

    const results = options?.results.map(c => [c.name, c] as const)
    return <Autocomplete {...props} options={results ?? null} />
}

interface VersionAutocompleteProps extends BaseProps {
    search: string
    card?: string
    // onNewResults: (results: DBCard[]) => void
}
export const VersionAutocomplete: FunctionalComponent<
    VersionAutocompleteProps
> = ({ card, search, ...props }) => {
    const [dbCard, setDBCard] = useState<DBCard | undefined>(undefined)
    const [options, setOptions] = useState<Array<
        readonly [string, CardWithSet]
    > | null>(null)
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
            // onNewResults(opt.map(([, c]) => c))
        } else {
            setOptions(null)
        }
    }, [search, dbCard])

    return (
        <Autocomplete {...props} name={card ?? ''} options={options ?? null} />
    )
}
