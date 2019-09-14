import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export interface Deck {
    id: string
    userID: string
    name: string
    cards: string
    keyImageURL: string
}

const firebaseConfig = {
    apiKey: 'AIzaSyBB8L89aHFYnpUuQwV_MElk5Q2GeV2Piys',
    authDomain: 'turboslug-929d8.firebaseapp.com',
    databaseURL: 'https://turboslug-929d8.firebaseio.com',
    projectId: 'turboslug-929d8',
    storageBucket: 'turboslug-929d8.appspot.com',
    messagingSenderId: '26581796435',
    appId: '1:26581796435:web:d23156e608f5ce505a28a6',
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

const db = firebase.firestore()
const auth = firebase.auth()
const provider = new firebase.auth.GoogleAuthProvider()

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
db.enablePersistence({ synchronizeTabs: true })

export async function signIn(): Promise<void> {
    const result = await auth.signInWithPopup(provider)
    const user = result.user
    if (user === null) {
        return
    }
}

export function currentUser(): firebase.User | null {
    return auth.currentUser
}

export function onAuthChange(
    nextOrObserver: (a: firebase.User | null) => void,
    error?: (a: firebase.auth.Error) => void,
): firebase.Unsubscribe {
    return auth.onAuthStateChanged(nextOrObserver, error)
}
export function signOut(): Promise<void> {
    return auth.signOut()
}

export async function create(deck: Omit<Deck, 'id' | 'userID'>): Promise<string> {
    const doc = await db
        .collection('decks')
        .add({
            ...deck,
            userID: userID(),
        })
    return doc.id
}

export async function save(deck: Omit<Deck, 'userID'>): Promise<void> {
    await db
        .collection('decks')
        .doc(deck.id)
        .set({
            ...deck,
            userID: userID(),
        })
}

export async function load(id: string): Promise<Deck | undefined> {
    const deck = await db
        .collection('decks')
        .doc(id)
        .get()

    if (deck === undefined) {
        return undefined
    }
    return loadDeck(deck)
}

export async function destroy(id: string): Promise<void> {
    await db
        .collection('decks')
        .doc(id)
        .delete()
}

export async function list(): Promise<Deck[]> {
    const uid = userID()
    if (uid === undefined) {
        return []
    }
    const decks = await db
        .collection('decks')
        // .where('userID', '==', uid)
        .orderBy('name')
        .get()

    return decks.docs.map(loadDeck)
}

function loadDeck(document: firebase.firestore.DocumentSnapshot): Deck {
    return {
        ...document.data(),
        id: document.id,
    } as Deck
}

function userID(): string | undefined {
    const user = auth.currentUser
    if (user === null) {
        return undefined
    }
    return user.uid
}
