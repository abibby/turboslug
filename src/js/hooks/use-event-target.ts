import { Inputs, useEffect } from 'preact/hooks'

interface TypeSaveEventTarget<TEvent extends Event> {
    addEventListener(
        type: string,
        callback: (event: TEvent) => void | null,
        options?: AddEventListenerOptions | boolean,
    ): void
    removeEventListener(
        type: string,
        callback: (event: TEvent) => void | null,
        options?: EventListenerOptions | boolean,
    ): void
}

export function useEventTarget<
    TType extends string,
    TEvent extends Event,
    TEventTarget extends TypeSaveEventTarget<TEvent>,
>(
    eventTarget: TEventTarget | null,
    type: TType,
    callback: (event: TEvent) => void,
    inputs: Inputs,
): void {
    useEffect(() => {
        if (eventTarget === null) {
            return
        }

        eventTarget.addEventListener(type, callback)
        return () => {
            eventTarget.removeEventListener(type, callback)
        }
    }, [type, eventTarget, ...inputs])
}
