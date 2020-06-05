import { bind } from '@zwzn/spicy'
import 'css/playtest.scss'
import Button from 'js/components/button'
import Card from 'js/components/card'
import { DBCard, useCards } from 'js/database'
import Deck from 'js/orm/deck'
import { useModel, useQuery } from 'js/orm/model'
import { FunctionalComponent, h } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { cardNames } from './edit-deck'
import Layout from './layout'

interface Zones {
    deck: string[]
    hand: string[]
    graveyard: string[]
    exile: string[],
    battlefield: string[],
}

interface Props {
    matches?: {
        id: string,
        type?: string,
    }
}

export const PlayTest: FunctionalComponent<Props> = props => {
    const [player1, setPlayer1] = useState<Zones>({
        deck: [],
        hand: [],
        graveyard: [],
        exile: [],
        battlefield: [],
    })

    useEffect(() => {
        Deck.find(props.matches!.id)
            .then(deck => {
                const cards = shuffle(
                    cardNames(deck?.cards ?? '')
                        .flatMap(c => (new Array(c.quantity)).fill(c.card)),
                )

                setPlayer1({
                    deck: cards,
                    hand: [],
                    graveyard: [],
                    exile: [],
                    battlefield: [],
                })
            })
    }, [props.matches?.id, setPlayer1])

    const drawCards = useCallback((n: number) => {
        setPlayer1(p => ({
            ...p,
            deck: p.deck.slice(n),
            hand: p.hand.concat(p.deck.slice(0, n)),
        }))
    }, [setPlayer1])

    const playCard = useCallback((name: string) => {
        setPlayer1(p => {
            const i = p.hand.indexOf(name)
            if (i < 0) {
                return p
            }
            return {
                ...p,
                battlefield: p.battlefield.concat([p.hand[i]]),
                hand: p.hand.filter((_, j) => j !== i),
            }
        })
    }, [setPlayer1])

    return <Layout class='playtest'>
        <h1>Goldfish</h1>
        <Button onClick={bind(1, drawCards)}>Draw</Button>
        {player1.deck.length}
        <Player zones={player1} playCard={playCard} />
    </Layout>
}

interface PlayerProps {
    zones: Zones
    playCard: (name: string) => void
}

const Player: FunctionalComponent<PlayerProps> = props => {
    const handCards = useCards(props.zones.hand) ?? []
    const battlefieldCards = useCards(props.zones.battlefield) ?? []

    return <div class='player'>
        hand
        <div class='battlefield'>
            <div class='creatures'>
                {battlefieldCards
                    .filter(c => c.type.includes('Creature'))
                    .map((c, i) => (
                        <Card
                            key={c.id + i}
                            card={c}
                            onClick={bind(c.name, props.playCard)}
                        />
                    ))}
            </div>
            <div class='other'>
                {battlefieldCards
                    .filter(c => !c.type.includes('Land') && !c.type.includes('Creature'))
                    .map((c, i) => (
                        <Card
                            key={c.id + i}
                            card={c}
                            onClick={bind(c.name, props.playCard)}
                        />
                    ))}
            </div>
            <div class='land'>
                {battlefieldCards
                    .filter(c => c.type.includes('Land') && !c.type.includes('Creature'))
                    .map((c, i) => (
                        <Card
                            key={c.id + i}
                            card={c}
                            onClick={bind(c.name, props.playCard)}
                        />
                    ))}
            </div>
        </div>
        <div class='hand'>
            {handCards.map((c, i) => (
                <Card
                    key={c.id + i}
                    card={c}
                    onClick={bind(c.name, props.playCard)}
                />
            ))}
        </div>
    </div>
}

function shuffle<T>(array: T[]): T[] {
    let temporaryValue: T
    let randomIndex: number

    // While there remain elements to shuffle...
    for (let i = 0; i < array.length; i++) {
        // Pick a reent...
        randomIndex = Math.floor(Math.random() * i)

        // And swap current element.
        temporaryValue = array[i]
        array[i] = array[randomIndex]
        array[randomIndex] = temporaryValue
    }

    return array
}
