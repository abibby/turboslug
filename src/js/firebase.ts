import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

const firebaseConfig = {
    apiKey: 'AIzaSyBB8L89aHFYnpUuQwV_MElk5Q2GeV2Piys',
    authDomain: 'turboslug.app',
    databaseURL: 'https://turboslug-929d8.firebaseio.com',
    projectId: 'turboslug-929d8',
    storageBucket: 'turboslug-929d8.appspot.com',
    messagingSenderId: '26581796435',
    appId: '1:26581796435:web:d23156e608f5ce505a28a6',
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

export const firestore = firebase.firestore()
const auth = firebase.auth()
const provider = new firebase.auth.GoogleAuthProvider()

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
firestore.enablePersistence({ synchronizeTabs: true })

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
