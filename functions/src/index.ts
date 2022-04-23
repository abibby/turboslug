import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { downloadCards } from './cards'
import { names } from './names'

admin.initializeApp()
const db = admin.firestore()

export const updateDateAdded = functions.firestore
    .document('decks/{deckID}')
    .onCreate(async change => {
        const date = admin.firestore.Timestamp.fromMillis(Date.now())

        const data = change.data()
        if (data === undefined) return null

        const user = (
            await db.collection('users').doc(data.userID).get()
        ).data()
        if (user === undefined) return null

        return change.ref.set(
            {
                createdAt: date,
                updatedAt: date,
                userName: user.userName,
            },
            { merge: true },
        )
    })

export const updateDateUpdated = functions.firestore
    .document('decks/{deckID}')
    .onUpdate(async change => {
        const data = change.after.data()
        const previousData = change.before.data()

        // We'll only update if the name has changed.
        // This is crucial to prevent infinite loops.
        if (data === undefined || previousData === undefined) return null
        if (
            data.name === previousData.name &&
            data.cards === previousData.cards
        ) {
            return null
        }

        const date = admin.firestore.Timestamp.fromMillis(Date.now())
        const update: any = {
            updatedAt: date,
        }
        if (data.createdAt === undefined) {
            update.createdAt = date
        }

        return change.after.ref.set(update, { merge: true })
    })

export const updateUserName = functions.firestore
    .document('users/{userID}')
    .onUpdate(async change => {
        const data = change.after.data()
        const previousData = change.before.data()

        if (data === undefined || previousData === undefined) return null
        if (data.userName === previousData.userName) return null

        const decks = await db
            .collection('decks')
            .where('userID', '==', change.after.id)
            .get()

        const batch = db.batch()

        for (const deck of decks.docs) {
            batch.set(
                db.collection('decks').doc(deck.id),
                { userName: data.userName },
                { merge: true },
            )
        }

        await batch.commit()
        return null
    })

export const newUser = functions.auth.user().onCreate(async user => {
    await db
        .collection('users')
        .doc(user.uid)
        .set({
            userName: names[Math.floor(Math.random() * names.length)],
        })
})

// 3am on sunday morning
export const updateCards = functions.pubsub
    .schedule('0 3 * * 0')
    .onRun(async () => {
        await downloadCards()
    })
