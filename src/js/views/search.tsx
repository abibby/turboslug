import { bindValue } from '@zwzn/spicy'
import 'css/search-page'
import Card from 'js/components/card'
import { DBCard, searchCards } from 'js/database'
import { useQuery } from 'js/hooks/useQuery'
import { FunctionalComponent, h } from 'preact'
import { Link } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'
import Layout from './layout'

export const Search: FunctionalComponent = () => {
    const [query, setQuery] = useQuery('query')
    const [page, setPage] = useQuery('page', '1')
    const [cards, setCards] = useState<DBCard[] | undefined>(undefined)

    useEffect(() => {
        const pageSize = 16
        searchCards(query, {
            limit: pageSize,
            offset: pageSize * (Number(page) - 1),
        }).then(c => setCards(c))
    }, [query, setCards, page])
    return (
        <Layout class='search-page'>
            <input type='text' value={query} onInput={bindValue(setQuery)} />
            <div class='card-list'>
                {cards?.map(c => (
                    <Link href={`/card/${c.id}`} key={c.id}>
                        <Card card={c} />
                    </Link>
                ))}
            </div>
        </Layout>
    )
}
