export const millisecond = 1
export const second = millisecond * 1000
export const minute = second * 60
export const hour = minute * 60
export const day = hour * 24
export const week = day * 7

export function sleep(timeout: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeout))
}
