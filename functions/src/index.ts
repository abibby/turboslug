import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// admin.initializeApp()

export const updateDateAdded = functions.firestore
    .document('decks/{deckID}')
    .onCreate((change, context) => {
        const date = admin.firestore.Timestamp.fromMillis(Date.now())
        console.log('created at ' + (new Date()).toISOString())
        return change.ref
            .set({
                createdAt: date,
                updatedAt: date,
            }, { merge: true })
            .catch(e => console.warn(e))
    });

export const updateDateUpdated = functions.firestore
    .document('decks/{deckID}')
    .onUpdate((change, context) => {

        const data = change.after.data();
        const previousData = change.before.data();

        // We'll only update if the name has changed.
        // This is crucial to prevent infinite loops.
        if (data === undefined || previousData === undefined) return null
        if (data.name === previousData.name && data.cards === previousData.cards) return null


        console.log('updated at ' + (new Date()).toISOString())
        return change.after.ref
            .set({
                updatedAt: admin.firestore.Timestamp.fromMillis(Date.now()),
            }, { merge: true })
            .catch(e => console.warn(e))
    });
