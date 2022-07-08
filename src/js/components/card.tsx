import 'css/card.scss'
import { cardImage, DBCard } from 'js/database'
import { FunctionalComponent, h } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import ManaCost from './mana-cost'

interface Props {
    card: DBCard
    set?: string
}

const Card: FunctionalComponent<Props> = ({ card, set }) => {
    const [hidden, setHidden] = useState(false)
    const hideImage = useCallback(() => {
        setHidden(true)
    }, [setHidden])
    const [id, setID] = useState('')
    useEffect(() => {
        setID(Math.random().toString().slice(2))
    }, [])
    return (
        <svg class='card' viewBox='0 0 63 88'>
            <defs>
                <mask id={`mask-${id}`}>
                    <rect id='rect' width='100%' height='100%' fill='black' />
                    <rect
                        id='rect'
                        width='100%'
                        height='100%'
                        rx={3.5}
                        fill='white'
                    />
                </mask>
            </defs>
            <g mask={`url(#mask-${id})`}>
                <rect id='rect' width='100%' height='100%' fill='black' />
                <rect x='3' y='3' width='57' height='82' rx='1' fill='white' />

                <text x='5.5' y='8' class='title'>
                    {card.name}
                </text>
                <foreignObject width='300' height='40' class='mana-cost'>
                    <ManaCost
                        // there are type errors if you don't use the spread
                        {...{ xmlns: 'http://www.w3.org/1999/xhtml' }}
                        cost={card.mana_cost}
                    />
                </foreignObject>
                <text x='5.5' y='53' class='type'>
                    {card.type}
                </text>
                <foreignObject x='5.5' y='56' width='52' height='28'>
                    <div
                        // there are type errors if you don't use the spread
                        {...{ xmlns: 'http://www.w3.org/1999/xhtml' }}
                        class='oracle'
                    >
                        {card.oracle_text}
                    </div>
                </foreignObject>
                <image
                    href={cardImage(card, set)}
                    width='100%'
                    height='100%'
                    x='0'
                    y='0'
                    visibility={hidden ? 'hidden' : 'visible'}
                    onError={hideImage}
                />
            </g>
        </svg>
    )
}

export default Card
