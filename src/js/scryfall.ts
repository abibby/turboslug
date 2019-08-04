export interface ScryfallResponse<T> {
    object: 'list'
    has_more: boolean
    data: T[]
}

export interface CardResponse extends ScryfallResponse<Card> {
    total_cards: number
    next_page: string
}

export type Card = NormalCard | TransformCard

export interface BaseCard {
    object: 'card'
    id: string
    oracle_id: string
    multiverse_ids: number[]
    tcgplayer_id: number
    name: string
    lang: string
    released_at: string
    uri: string
    scryfall_uri: string
    highres_image: boolean
    cmc: number
    type_line: string
    color_indicator: string[]
    color_identity: Array<'W' | 'U' | 'B' | 'R' | 'G'>
    legalities: { [format: string]: 'legal' | 'not_legal' | 'banned' }
    games: string[]
    reserved: boolean
    foil: boolean
    nonfoil: boolean
    oversized: boolean
    promo: boolean
    reprint: boolean
    variation: boolean
    set: string
    set_name: string
    set_type: string
    set_uri: string
    set_search_uri: string
    scryfall_set_uri: string
    rulings_uri: string
    prints_search_uri: string
    collector_number: string
    digital: boolean
    rarity: string
    card_back_id: string
    artist: string
    border_color: string
    frame: string
    full_art: boolean
    textless: boolean
    booster: boolean
    story_spotlight: boolean
    prices: { [type: string]: string }
    related_uris: { [service: string]: string }
    purchase_uris: { [service: string]: string }
}

export interface NormalCard extends BaseCard {
    layout: 'normal'

    artist: string
    colors: string[]
    illustration_id: string
    image_uris: ImageURIs
    mana_cost: string
    name: string
    oracle_text: string
    power?: string
    toughness?: string
    type_line: string,
}
export interface TransformCard extends BaseCard {
    layout: 'transform'

    card_faces: Array<{
        object: 'card_face'
        artist: string
        colors: string[]
        illustration_id: string
        image_uris: ImageURIs
        mana_cost: string
        name: string
        oracle_text: string
        power: string
        toughness: string
        type_line: string,
    }>
}

export interface ImageURIs {
    art_crop: string
    border_crop: string
    large: string
    normal: string
    png: string
    small: string,
}

export interface Set {
    object: 'set'
    id: string
    code: string
    tcgplayer_id: number
    name: string
    uri: string
    scryfall_uri: string
    search_uri: string
    released_at: string
    set_type: string
    card_count: number
    digital: boolean
    foil_only: boolean
    block_code: string
    block: string
    icon_svg_uri: string
}

export interface CardSymbol {
    object: 'card_symbol',
    symbol: string,
    loose_variant: null,
    english: string,
    transposable: boolean,
    represents_mana: boolean,
    appears_in_mana_costs: boolean,
    cmc: number,
    funny: boolean,
    colors: string[],
    gatherer_alternates: string[],
}
