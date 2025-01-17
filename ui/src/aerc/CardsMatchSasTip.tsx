import { Typography } from "@material-ui/core"
import { observer } from "mobx-react"
import React from "react"
import { cardStore } from "../cards/CardStore"
import { KCard } from "../cards/KCard"
import { spacing } from "../config/MuiConfig"
import { SasTip } from "../mui-restyled/SasTip"

export interface CardsMatchSasTipProps {
    title: string
    subtitle1?: string
    subtitle2?: string
    matches: (card: KCard) => boolean
    matches2?: (card: KCard) => boolean
    cards: KCard[]
    children: React.ReactNode
}

@observer
export class CardsMatchSasTip extends React.Component<CardsMatchSasTipProps> {

    render() {
        const {title, subtitle1, subtitle2, cards, matches, matches2, children} = this.props

        if (!cardStore.cardsLoaded) {
            return null
        }

        const matchedCards = cards
            .filter(card => card != null && matches(card as KCard))

        const matchedCards2 = matches2 == null ? [] : cards
            .filter(card => card != null && matches2(card as KCard))

        return (
            <SasTip
                title={<Typography variant={"subtitle1"}>{title}</Typography>}
                contents={(
                    <div>
                        {subtitle1 != null && matchedCards.length > 0 && (
                            <Typography variant={"overline"} style={{fontWeight: 575}}>
                                {subtitle1}
                            </Typography>
                        )}
                        {matchedCards.length > 0 &&
                        <div>
                            {matchedCards.map((card, idx) => (
                                <Typography variant={"body2"} key={idx}>
                                    {card!.cardTitle}
                                </Typography>
                            ))}
                        </div>}
                        {matchedCards2.length > 0 && (
                            <>
                                <Typography variant={"overline"} style={{marginTop: spacing(2)}}>
                                    {subtitle2}
                                </Typography>
                                {matchedCards2.map((card, idx) => (
                                    <Typography variant={"body2"} key={idx}>
                                        {card!.cardTitle}
                                    </Typography>
                                ))}
                            </>
                        )}
                    </div>
                )}
            >
                {children}
            </SasTip>
        )
    }
}