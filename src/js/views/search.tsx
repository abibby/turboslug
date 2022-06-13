import { bindValue } from '@zwzn/spicy'
import 'css/search-page.scss'
import Card from 'js/components/card'
import { PaginatedList } from 'js/components/paginated'
import { Select } from 'js/components/select'
import { DBCard, searchCards } from 'js/database'
import { Paginated } from 'js/database.worker'
import { useQueryState } from 'js/hooks/use-query-state'
import Layout from 'js/views/layout'
import { FunctionalComponent, h } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'

export const Search: FunctionalComponent = () => {
    const [search, setSearch] = useQueryState('query', '')
    const [sort, setSort] = useQueryState('sort', 'name')
    const [order, setOrder] = useQueryState('order', 'asc')
    const [pageStr, setPage] = useQueryState('page', '0')
    const page = Number(pageStr)
    const perPage = 16
    const [cards, setCards] = useState<Paginated<DBCard>>({
        total: 0,
        results: [],
    })
    const abort = useRef<AbortController | null>(null)
    useEffect(() => {
        abort.current?.abort()
        abort.current = new AbortController()

        searchCards(
            search,
            {
                take: perPage,
                skip: page * perPage,
                sort: sort as keyof DBCard,
                order: order as 'asc' | 'desc',
            },
            abort.current,
        )
            .then(c => {
                abort.current = null
                setCards(c)
            })
            .catch(e => {
                abort.current = null
            })
    }, [search, page, perPage, sort, order])
    const inputChange = useCallback(
        (query: string) => {
            setSearch(query)
            setPage(0)
        },
        [setSearch, setPage],
    )

    const sortOptions = [
        ['name', 'Name'],
        ['cmc', 'Mana Value'],
        ['power', 'Power'],
        ['toughness', 'Toughness'],
    ] as const
    const orderOptions = [
        ['asc', 'Ascending'],
        ['desc', 'Descending'],
    ] as const

    return (
        <Layout class='search-page'>
            <h1>Search</h1>
            <input
                class='input'
                type='text'
                onInput={bindValue(inputChange)}
                value={search}
            />
            <div>
                <Select options={sortOptions} onChange={setSort} value={sort} />
                <Select
                    options={orderOptions}
                    onChange={setOrder}
                    value={order}
                />
            </div>
            Found {cards.total} {cards.total === 1 ? 'card' : 'cards'}
            <PaginatedList
                paginator={cards}
                perPage={perPage}
                page={page}
                onPageChange={setPage}
            >
                <div class='list'>
                    {cards.results.map(c => (
                        <a
                            key={c.id}
                            href={`https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=${c.id}`}
                            target='_blank'
                        >
                            <Card card={c} />
                        </a>
                    ))}
                </div>
            </PaginatedList>
        </Layout>
    )
}
