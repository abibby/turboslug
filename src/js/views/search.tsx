import { bindValue } from '@zwzn/spicy'
import 'css/search-page.scss'
import Card from 'js/components/card'
import { PaginatedList } from 'js/components/paginated'
import { DBCard, searchCards } from 'js/database'
import { Paginated } from 'js/database.worker'
import { useQueryState } from 'js/hooks/use-query-state'
import Layout from 'js/views/layout'
import { FunctionalComponent, h } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'

export const Search: FunctionalComponent = () => {
    const [search, setSearch] = useQueryState('query', '')
    const [pageStr, setPage] = useQueryState('page', '')
    const page = Number(pageStr)
    const perPage = 16
    const [cards, setCards] = useState<Paginated<DBCard>>({
        total: 0,
        results: [],
    })
    useEffect(() => {
        searchCards(search, perPage, page * perPage).then(c => {
            setCards(c)
        })
    }, [search, page, perPage])
    const inputChange = useCallback(
        (query: string) => {
            setSearch(query)
            setPage(0)
        },
        [setSearch, setPage],
    )
    return (
        <Layout class='search-page'>
            <h1>Search</h1>
            <input
                class='input'
                type='text'
                onInput={bindValue(inputChange)}
                value={search}
            />
            {cards.total}
            <PaginatedList
                paginator={cards}
                perPage={perPage}
                page={page}
                onPageChange={setPage}
            >
                <div class='list'>
                    {cards.results.map(c => (
                        <Card key={c.id} card={c} />
                    ))}
                </div>
            </PaginatedList>
        </Layout>
    )
}
