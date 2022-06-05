import { bind } from '@zwzn/spicy'
import classNames from 'classnames'
import 'css/paginated.scss'
import { Paginated } from 'js/database.worker'
import { FunctionalComponent, h } from 'preact'

export interface PaginatedListProps {
    paginator: Paginated<unknown>
    perPage: number
    page: number
    onPageChange: (page: number) => void
}

export const PaginatedList: FunctionalComponent<PaginatedListProps> = props => {
    const pageCount = Math.ceil(props.paginator.total / props.perPage)

    return (
        <div class='paginated-list'>
            <PaginatorButtons
                page={props.page}
                pageCount={pageCount}
                onPageChange={props.onPageChange}
            />
            {props.children}
            <PaginatorButtons
                page={props.page}
                pageCount={pageCount}
                onPageChange={props.onPageChange}
            />
        </div>
    )
}

interface PaginatorButtonsProps {
    page: number
    pageCount: number
    onPageChange: (page: number) => void
}

const PaginatorButtons: FunctionalComponent<PaginatorButtonsProps> = props => {
    const pages = [0]

    const around = 3
    for (let i = props.page - around; i <= props.page + around; i++) {
        if (i > 0 && i < props.pageCount - 1) {
            pages.push(i)
        }
    }
    if (props.pageCount > 1) {
        pages.push(props.pageCount - 1)
    }
    return (
        <div class='paginator-buttons'>
            {/* maybe use links instead of buttons */}
            {pages.flatMap((p, i) => {
                const button = (
                    <button
                        key={p}
                        onClick={bind(p, props.onPageChange)}
                        class={classNames('page-link', {
                            active: p === props.page,
                        })}
                        disabled={p === props.page}
                    >
                        {p + 1}
                    </button>
                )
                const lastPage = pages[i - 1]
                if (lastPage !== undefined && lastPage !== p - 1) {
                    return [
                        <span key={p - 0.5} class='ellipsis'>
                            ...
                        </span>,
                        button,
                    ]
                }
                return button
            })}
        </div>
    )
}
