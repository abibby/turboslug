import { initializeApp } from 'firebase/app'
import {
    browserLocalPersistence,
    ErrorFn,
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    Unsubscribe,
    User,
} from 'firebase/auth'
import {
    enableMultiTabIndexedDbPersistence,
    getFirestore,
} from 'firebase/firestore'

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
initializeApp(firebaseConfig)

export const firestore = getFirestore()
const auth = getAuth()
const provider = new GoogleAuthProvider()

auth.setPersistence(browserLocalPersistence)
enableMultiTabIndexedDbPersistence(firestore)

export async function signIn(): Promise<void> {
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    if (user === null) {
        return
    }
}

export function currentUser(): User | null {
    return auth.currentUser
}

export function onAuthChange(
    nextOrObserver: (a: User | null) => void,
    error?: ErrorFn,
): Unsubscribe {
    return auth.onAuthStateChanged(nextOrObserver, error)
}
export function signOut(): Promise<void> {
    return auth.signOut()
}
