import 'css/playtest.scss'
import Card from 'js/components/card'
import { DBCard } from 'js/database'
import Deck from 'js/orm/deck'
import { useModel, useQuery } from 'js/orm/model'
import { FunctionalComponent, h } from 'preact'
import { useState } from 'preact/hooks'
import Layout from './layout'

interface Props {
    matches?: {
        id: string,
        type?: string,
    }
}

export const PlayTest: FunctionalComponent<Props> = props => {
    const [player1, setPlayer1] = useState({
        zones: {
            deck: [],
            hand: [],
            graveyard: [],
            exile: [],
        },
    })

    const deck = useModel(props.matches!.id, Deck)

    return <Layout class='playtest' >
        <h1>playtest</h1>
        {deck?.cards}
        <Player {...player1} />
    </Layout>
}

interface PlayerProps {
    zones: {
        deck: DBCard[]
        hand: DBCard[]
        graveyard: DBCard[]
        exile: DBCard[],
    }
}

const Player: FunctionalComponent<PlayerProps> = props => {
    return <div class='player'>
        <div className='hand'>
            {props.zones.hand.map((c, i) => <Card key={i} card={c} />)}
        </div>
    </div>
}
