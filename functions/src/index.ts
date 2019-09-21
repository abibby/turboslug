import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

export const updateDateAdded = functions.firestore
    .document('decks/{deckID}')
    .onCreate(change => {
        const date = admin.firestore.Timestamp.fromMillis(Date.now())

        return change.ref
            .set({
                createdAt: date,
                updatedAt: date,
            }, { merge: true })
    });

export const updateDateUpdated = functions.firestore
    .document('decks/{deckID}')
    .onUpdate(change => {

        const data = change.after.data();
        const previousData = change.before.data();

        // We'll only update if the name has changed.
        // This is crucial to prevent infinite loops.
        if (data === undefined || previousData === undefined) return null
        if (data.name === previousData.name && data.cards === previousData.cards) return null

        const date = admin.firestore.Timestamp.fromMillis(Date.now())
        const update: any = {
            updatedAt: date,
        }
        if (data.createdAt === undefined) {
            update.createdAt = date
        }

        return change.after.ref
            .set(update, { merge: true })
    });
