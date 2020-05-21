import { IconButton } from "@material-ui/core"
import { GetApp } from "@material-ui/icons"
import { observer } from "mobx-react"
import React from "react"
import { CSVLink } from "react-csv"
import { Utils } from "../config/Utils"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CsvDownloadButton = observer((props: { name: string, data?: CsvData, size?: "small" | "medium" }) => {
    const {data, name, size} = props
    if (data == null || data.length === 0) {
        return (
            <IconButton disabled={true}>
                <GetApp/>
            </IconButton>
        )
    }
    const dataEncoded = data.map(row => {
        return row.map(cell => {
            let cellJoined = cell
            if (cell instanceof Array) {
                cellJoined = cell.join(" | ")
            }
            if (typeof cellJoined == "string" && cellJoined.includes('"')) {
                return cellJoined.replace(/"/g, '""')
            }
            return cellJoined
        })
    })
    return (
        <CSVLink
            data={dataEncoded}
            target={"_blank"} rel={"noopener noreferrer"}
            filename={`dok-${name}-${Utils.nowDateString()}.csv`}

        >
            <IconButton size={size}>
                <GetApp/>
            </IconButton>
        </CSVLink>
    )
})

export type CsvData = (string | number | boolean | string[] | number[] | boolean[] | undefined)[][]
