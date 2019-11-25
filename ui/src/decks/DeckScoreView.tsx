import { Typography } from "@material-ui/core"
import { blue } from "@material-ui/core/colors"
import { ThemeStyle } from "@material-ui/core/styles/createTypography"
import Tooltip from "@material-ui/core/Tooltip"
import HistoryIcon from "@material-ui/icons/History"
import { range } from "lodash"
import * as React from "react"
import { spacing } from "../config/MuiConfig"
import { AboutSubPaths } from "../config/Routes"
import { roundToThousands } from "../config/Utils"
import { activeExpansions, BackendExpansion } from "../expansions/Expansions"
import { StarIcon, StarType } from "../generic/imgs/stars/StarIcons"
import { UnstyledLink } from "../generic/UnstyledLink"

export enum DeckScoreSize {
    SMALL,
    MEDIUM,
    MEDIUM_LARGE,
    LARGE
}

interface DeckScoreViewProps {
    deck: {
        rawAerc: number,
        sasRating: number,
        synergyRating: number,
        antisynergyRating: number,
        previousSasRating?: number,
        sasPercentile?: number,
        expansion?: BackendExpansion
    }
    style?: React.CSSProperties
    small?: boolean
    noLinks?: boolean
}

export const DeckScorePill = (props: DeckScoreViewProps) => {
    const {small} = props
    return (
        <div
            style={{
                backgroundColor: blue["500"],
                padding: spacing(small ? 1 : 2),
                paddingBottom: spacing(small ? 0 : 2),
                width: small ? 168 : 216,
                borderRadius: 10
            }}
        >
            <DeckScoreView {...props}/>
        </div>
    )
}

export const DeckScoreView = (props: DeckScoreViewProps) => {

    const {small, deck, noLinks} = props
    const {
        rawAerc,
        previousSasRating,
        sasRating,
        synergyRating,
        antisynergyRating,
        sasPercentile,
        expansion
    } = deck

    if (expansion != null && !activeExpansions.includes(expansion)) {
        return (
            <Typography variant={"h5"} style={{color: "#FFFFFF"}}>Score Pending</Typography>
        )
    }

    let sasInfo = null
    if (previousSasRating != null && previousSasRating !== sasRating && previousSasRating !== 0) {
        sasInfo = (
            <Tooltip title={`Previous SAS rating: ${previousSasRating}`} enterTouchDelay={100}>
                <div>
                    <HistoryIcon style={{marginTop: spacing(1), marginLeft: spacing(2), color: "#FFFFFF", width: 20, height: 20}}/>
                </div>
            </Tooltip>
        )
    } else if (!small) {
        sasInfo = <div style={{width: 36}}/>
    }

    return (
        <div style={{display: "flex"}}>
            <div style={props.style}>
                <Tooltip title={"Total SAS / AERC score without synergies and antisynergies."}>
                    <div>
                        <RatingRow value={rawAerc} name={"BASE AERC"} size={small ? DeckScoreSize.SMALL : DeckScoreSize.MEDIUM}/>
                    </div>
                </Tooltip>
                <RatingRow value={synergyRating} name={"SYNERGY"} operator={"+"} size={small ? DeckScoreSize.SMALL : DeckScoreSize.MEDIUM}/>
                <RatingRow value={antisynergyRating} name={"ANTISYNERGY"} operator={"-"} size={small ? DeckScoreSize.SMALL : DeckScoreSize.MEDIUM}/>
                <div style={{borderBottom: "1px solid rgba(255,255,255)"}}/>
                <div style={{display: "flex"}}>
                    <div style={{flexGrow: 1}}/>
                    <Tooltip
                        title={"Synergy and Antisynergy Rating. All the synergized AERC scores for each card added together. Read more on the about page."}>
                        <div>
                            {noLinks ? (
                                <RatingRow value={sasRating} name={"SAS"} size={small ? DeckScoreSize.MEDIUM_LARGE : DeckScoreSize.LARGE}/>
                            ) : (
                                <UnstyledLink to={AboutSubPaths.sas}>
                                    <RatingRow value={sasRating} name={"SAS"} size={small ? DeckScoreSize.MEDIUM_LARGE : DeckScoreSize.LARGE}/>
                                </UnstyledLink>
                            )}
                        </div>
                    </Tooltip>
                    {sasInfo}
                </div>
            </div>
            {sasPercentile && (
                <div style={{marginLeft: spacing(2), display: "flex", alignItems: "flex-end"}}>
                    <SaStars
                        sasPercentile={sasPercentile}
                        small={small}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                        }}
                    />
                </div>
            )}
        </div>
    )
}

export const SaStars = (props: { sasPercentile: number, small?: boolean, style?: React.CSSProperties, gray?: boolean, halfAtEnd?: boolean, noPercent?: boolean }) => {
    const {sasPercentile, small, style, gray, halfAtEnd, noPercent} = props
    let includeHalf = false
    let type = StarType.NORMAL
    let quantity = 0
    let tooltip = ""

    const random = Math.random()
    if (sasPercentile >= 99.99) {
        quantity = 5
        type = StarType.GOLD
        if (random > 0.5) {
            tooltip = "A controller of weakling decks. Only one in 10,000 decks is this good"
        } else {
            tooltip = "When nature calls, this deck won't have to go. Only one in 10,000 decks is this good"
        }
    } else if (sasPercentile >= 99.9) {
        quantity = 5
        if (random > 0.5) {
            tooltip = "One of the glorious few. Only one in 1,000 decks is this good"
        } else {
            tooltip = "On the doorstep to heaven. Only one in 1,000 decks is this good"
        }
    } else if (sasPercentile >= 90) {
        quantity = 4
        if (sasPercentile >= 99) {
            if (random > 0.5) {
                tooltip = "This deck makes for unfair games. Top 1% of decks"
            } else {
                tooltip = "Don't discard this penny. Top 1% of decks"
            }
            includeHalf = true
        } else {
            if (random > 0.5) {
                tooltip = "This deck is lights out. Top 10% of decks"
            } else {
                tooltip = "Culler of weak decks. In the top 10%"
            }
        }
    } else if (sasPercentile >= 25) {
        quantity = 3
        if (sasPercentile >= 75) {
            if (random > 0.5) {
                tooltip = "Overlord of pedestrian decks. In the top 25% of decks"
            } else {
                tooltip = "Stealer of sub-par souls. Better than 75% of decks out there"
            }
            includeHalf = true
        } else {
            if (random > 0.7) {
                tooltip = "One Zyzzix among many. In the middle 50% of decks"
            } else if (random > 0.3) {
                tooltip = "Standardized testing? Yes please. One of the middle 50% of decks"
            } else {
                tooltip = "Is it mating season? 50% of decks match this deck's profile"
            }
        }
    } else if (sasPercentile > 1) {
        quantity = 2
        if (sasPercentile >= 10) {
            if (random > 0.5) {
                tooltip = "It would take some experimental therapy to make this deck good. Among the worst 25% of decks"
            } else {
                tooltip = "Wretched doll, wretched deck. Among the worst 25% of decks"
            }
            includeHalf = true
        } else {
            if (random > 0.5) {
                tooltip = "This deck won't save the pack. Among the worst 10% of decks"
            } else {
                tooltip = "A shard of pain. Among the worst 10% of decks"
            }
        }
    } else if (sasPercentile >= 0.01) {
        quantity = 1
        if (sasPercentile >= 0.1) {
            if (random > 0.5) {
                tooltip = "You're grasping at vines if you think this deck is any good. Among the worst 1% of decks"
            } else {
                tooltip = "Like Ortannu's Binding without the Ortannu. In the worst 1% of decks"
            }
            includeHalf = true
        } else {
            if (random > 0.5) {
                tooltip = "Baddeck Queen. Only one in 1,000 decks is this bad"
            } else {
                tooltip = "Call the troops! Only one in 1,000 decks is this bad"
            }
        }
    } else {
        if (random > 0.5) {
            tooltip = "The Key to Darkness and Reversal. Only one in 10,000 decks is this bad"
        } else {
            tooltip = "Imagine Grommid, but bad. Only one in 10,000 decks is this bad"
        }
        includeHalf = true
    }

    tooltip = `${roundToThousands(sasPercentile)}%. ${tooltip} according to SAS.`

    const starStyle = {marginTop: spacing(0.5)}
    return (
        <Tooltip title={tooltip}>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                <div style={style}>
                    {includeHalf && !halfAtEnd && <StarIcon starType={StarType.HALF} style={starStyle} small={small} gray={gray}/>}
                    {range(quantity).map((idx) => <StarIcon key={idx} starType={type} style={starStyle} small={small} gray={gray}/>)}
                    {includeHalf && halfAtEnd && <StarIcon starType={StarType.HALF} style={starStyle} small={small} gray={gray}/>}
                </div>
                {!noPercent && (
                    <Typography
                        variant={"body2"}
                        style={{color: "#FFFFFF", marginTop: spacing(0.5)}}
                    >
                        {Math.round(sasPercentile)}%
                    </Typography>
                )}
            </div>
        </Tooltip>
    )
}

const RatingRow = (props: { value: number, name: string, operator?: string, size?: DeckScoreSize, tooltip?: string }) => {
    const {size} = props
    let largeText: ThemeStyle = "body1"
    let smallText: ThemeStyle = "body2"
    let smallFontSize: number | undefined = 12
    let smallTextMarginBottom: number | undefined = 2
    let width = 88
    if (size === DeckScoreSize.LARGE) {
        largeText = "h3"
        smallText = "h5"
        smallFontSize = undefined
        smallTextMarginBottom = undefined
        width = 52
    } else if (size === DeckScoreSize.SMALL) {
        largeText = "body2"
        smallText = "body2"
        smallFontSize = 10
        width = 72
    } else if (size === DeckScoreSize.MEDIUM_LARGE) {
        largeText = "h4"
        smallText = "h5"
        smallFontSize = undefined
        smallTextMarginBottom = undefined
        width = 72
    }
    return (
        <div style={{display: "flex", alignItems: "flex-end"}}>
            <div style={{flexGrow: 1}}/>
            <Typography variant={largeText} style={{color: "#FFFFFF", marginRight: spacing(1)}}>{props.operator} {props.value}</Typography>
            <Typography
                variant={smallText}
                style={{fontSize: smallFontSize, marginBottom: smallTextMarginBottom, color: "#FFFFFF", width}}
            >
                {props.name}
            </Typography>
        </div>
    )
}

export const PercentRatingRow = (props: { value: number, name: string }) => {
    if (props.value === -1.0) {
        return null
    }
    return (
        <div style={{display: "flex", alignItems: "flex-end"}}>
            <Typography variant={"h5"} style={{color: "#FFFFFF"}}>
                {props.value}
            </Typography>
            <Typography
                variant={"body2"}
                style={{color: "#FFFFFF", fontWeight: 500, marginRight: spacing(2), paddingBottom: 2}}
            >
                {"%  "}{props.name}
            </Typography>
        </div>
    )
}
