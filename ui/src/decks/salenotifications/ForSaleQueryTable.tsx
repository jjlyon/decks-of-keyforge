import { Card, IconButton, Typography } from "@material-ui/core"
import Table from "@material-ui/core/Table"
import TableBody from "@material-ui/core/TableBody"
import TableCell from "@material-ui/core/TableCell"
import TableHead from "@material-ui/core/TableHead"
import TableRow from "@material-ui/core/TableRow"
import { Delete } from "@material-ui/icons"
import { startCase } from "lodash"
import * as React from "react"
import { spacing } from "../../config/MuiConfig"
import { Routes } from "../../config/Routes"
import { SellDeckIcon } from "../../generic/icons/SellDeckIcon"
import { TradeDeckIcon } from "../../generic/icons/TradeDeckIcon"
import { UnregisteredDeckIcon } from "../../generic/icons/UnregisteredDeckIcon"
import { HouseBanner } from "../../houses/HouseBanner"
import { LinkButton } from "../../mui-restyled/LinkButton"
import { forSaleNotificationsStore } from "./ForSaleNotificationsStore"
import { ForSaleQuery, ForSaleQueryEntity, prepareForSaleQueryForQueryString } from "./ForSaleQuery"

interface ForSaleQueryTableProps {
    queries: ForSaleQueryEntity[]
}

export const ForSaleQueryTable = (props: ForSaleQueryTableProps) => {
    return (
        <Card>
            <Table padding={"dense"}>
                <TableHead>
                    <TableRow>
                        <TableCell>Notifications Search</TableCell>
                        <TableCell>Deck Name</TableCell>
                        <TableCell>Houses</TableCell>
                        <TableCell>Search Type</TableCell>
                        <TableCell>My Country</TableCell>
                        <TableCell>Filters</TableCell>
                        <TableCell>Card Filters</TableCell>
                        <TableCell/>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {props.queries.map((queryEntity) => {
                        const query: ForSaleQuery = JSON.parse(queryEntity.json)
                        const preparedForQuery = prepareForSaleQueryForQueryString(query)
                        return (
                            <TableRow key={queryEntity.id}>
                                <TableCell>
                                    <LinkButton
                                        to={Routes.deckSearch(preparedForQuery)}
                                        color={"primary"}
                                    >
                                        {queryEntity.name.length === 0 ? "Unnamed" : queryEntity.name}
                                    </LinkButton>
                                </TableCell>
                                <TableCell>{query.title}</TableCell>
                                <TableCell><HouseBanner houses={query.houses} size={36}/></TableCell>
                                <TableCell>
                                    {query.forSale ? <SellDeckIcon style={{marginRight: spacing(1)}}/> : null}
                                    {query.forTrade ? <TradeDeckIcon style={{marginRight: spacing(1)}}/> : null}
                                    {query.includeUnregistered ? <UnregisteredDeckIcon style={{marginRight: spacing(1)}}/> : null}
                                </TableCell>
                                <TableCell>
                                    {query.forSaleInCountry ? "Yes" : ""}
                                </TableCell>
                                <TableCell>
                                    {query.constraints.map((constraint) => (
                                        <div style={{display: "flex"}} key={constraint.property + constraint.cap + constraint.value}>
                                            <Typography>
                                                {startCase(constraint.property)}
                                                {constraint.property === "listedWithinDays" ? " " : (constraint.cap === "MAX" ? " < " : " > ")}
                                                {constraint.value}
                                            </Typography>
                                        </div>
                                    ))}
                                </TableCell>
                                <TableCell>
                                    {query.cards.map((card) => (
                                        <div style={{display: "flex"}} key={card.cardName}>
                                            <Typography>{card.cardName} – {card.quantity} {card.quantity === 1 ? "copy" : "copies"}</Typography>
                                        </div>
                                    ))}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => forSaleNotificationsStore.deleteQuery(queryEntity.id)}
                                    >
                                        <Delete/>
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </Card>
    )
}