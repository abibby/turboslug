import { bind } from '@zwzn/spicy'
import classNames from 'classnames'
import 'css/paginated.scss'
import { Paginated } from 'js/database.worker'
import { Fragment, FunctionalComponent, h } from 'preact'

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
    const pageGroups = getPageGroups(props.page, props.pageCount)
    return (
        <div class='paginator-buttons'>
            <button
                onClick={bind(props.page - 1, props.onPageChange)}
                class='page-link'
                disabled={props.page <= 1}
            >
                &lt;
            </button>
            {pageGroups.map((pages, i) => (
                <Fragment key={i}>
                    {i !== 0 && <span class='ellipsis'>...</span>}
                    {pages.map(p => (
                        <button
                            key={p}
                            onClick={bind(p, props.onPageChange)}
                            class={classNames('page-link', {
                                active: p === props.page,
                            })}
                            disabled={p === props.page}
                        >
                            {p}
                        </button>
                    ))}
                </Fragment>
            ))}
            <button
                onClick={bind(props.page + 1, props.onPageChange)}
                class='page-link'
                disabled={props.page >= props.pageCount}
            >
                &gt;
            </button>
        </div>
    )
}

function range(start: number, end: number): number[] {
    if (start > end) {
        return []
    }
    return new Array(end - start + 1).fill(undefined).map((_, i) => i + start)
}

function getPageGroups(currentPage: number, pageCount: number): number[][] {
    const totalCount = 9
    const startCount = 1
    const endCount = 1
    const midCount = totalCount - startCount - endCount - 2

    const midStart = currentPage - Math.ceil(midCount / 2) + 1
    const midEnd = currentPage + Math.floor(midCount / 2)

    if (pageCount <= totalCount) {
        return [range(1, pageCount)]
    }
    if (midStart < startCount + 3) {
        return [
            range(1, totalCount - endCount - 1),
            range(pageCount - endCount + 1, pageCount),
        ]
    }
    if (midEnd >= pageCount - endCount - 1) {
        return [
            range(1, startCount),
            range(pageCount - totalCount + endCount + 2, pageCount),
        ]
    }
    return [
        range(1, startCount),
        range(midStart, midEnd),
        range(pageCount - endCount + 1, pageCount),
    ]
}
