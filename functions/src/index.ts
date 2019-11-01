import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as firebase from 'firebase'
import { names } from './names';
import Deck from '../../src/js/orm/deck'
admin.initializeApp()

export const updateDateAdded = functions.firestore
    .document('decks/{deckID}')
    .onCreate(async change => {
        const date = admin.firestore.Timestamp.fromMillis(Date.now())

        const data = change.data()
        if (data === undefined) return null

        const user = (await firebase.firestore()
            .collection('users')
            .doc(data.userID)
            .get()).data()
        if (user === undefined) return null

        return change.ref
            .set({
                createdAt: date,
                updatedAt: date,
                userName: user.userName,
            }, { merge: true })
    });

export const updateDateUpdated = functions.firestore
    .document('decks/{deckID}')
    .onUpdate(async change => {

        const data = change.after.data();
        const previousData = change.before.data();

        // We'll only update if the name has changed.
        // This is crucial to prevent infinite loops.
        if (data === undefined || previousData === undefined) return null
        if (data.name === previousData.name && data.cards === previousData.cards) return null

        const date = admin.firestore.Timestamp.fromMillis(Date.now())
        const update: Partial<Deck> = {
            updatedAt: date,
        }
        if (data.createdAt === undefined) {
            update.createdAt = date
        }

        return change.after.ref
            .set(update, { merge: true })
    });

export const updateUserName = functions.firestore
    .document('users/{userID}')
    .onUpdate(async change => {

        const data = change.after.data();
        const previousData = change.before.data();

        if (data === undefined || previousData === undefined) return null
        if (data.userName === previousData.userName) return null

        const decks = await firebase.firestore()
            .collection('decks')
            .where('userID', '==', change.after.id)
            .get()

        await Promise.all(
            decks.docs.map(
                deck => firebase.firestore()
                    .collection('decks')
                    .doc(deck.id)
                    .set({ userName: data.userName }, { merge: true })
            )
        )
        return null
    });

export const newUser = functions.auth
    .user()
    .onCreate(async user => {
        await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .set({
                name: names[Math.floor(Math.random() * names.length)]
            })
    });