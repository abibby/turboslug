import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import { DeckStore } from 'js/save'

interface StoreDeck {
    name: string
    cards: string
    userID: string
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

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)

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

export default class FirebaseStore implements DeckStore {

    public async save(name: string, deck: string): Promise<void> {
        await db
            .collection('decks')
            .doc(name)
            .set({
                name: name,
                cards: deck,
                userID: this.userID(),
            })
    }
    public async load(name: string): Promise<string | undefined> {

        const deck = await db
            .collection('decks')
            .doc(name)
            .get()

        const data = deck.data()
        if (data === undefined) {
            return undefined
        }
        return data.cards
    }
    public async list(): Promise<string[]> {
        const userID = this.userID()
        if (userID === undefined) {
            return []
        }
        const decks = await db
            .collection('decks')
            .where('userID', '==', userID)
            .get()

        return decks.docs.map(doc => doc.id)
    }

    private userID(): string | undefined {
        const user = auth.currentUser
        if (user === null) {
            return undefined
        }
        return user.uid
    }

}
