import Popover from "@material-ui/core/Popover/Popover"
import Typography from "@material-ui/core/Typography/Typography"
import { observable } from "mobx"
import { observer } from "mobx-react"
import * as React from "react"
import { spacing } from "../config/MuiConfig"
import { KCard } from "./KCard"
import { MaverickIcon, rarityValues } from "./rarity/Rarity"

export const CardSimpleView = (props: { card: Partial<KCard>, size?: number }) => {
    return (
        <div>
            <img src={props.card.frontImage} style={{width: props.size ? props.size : 300, margin: spacing(2)}}/>
        </div>
    )
}

@observer
export class CardAsLine extends React.Component<{ card: Partial<KCard> }> {

    @observable
    popOpen = false
    anchorElement?: HTMLDivElement

    handlePopoverOpen = (event: React.MouseEvent<HTMLDivElement>) => {
        this.anchorElement = event.currentTarget
        this.popOpen = true
    }

    handlePopoverClose = () => {
        this.anchorElement = undefined
        this.popOpen = false
    }

    render() {
        const card = this.props.card
        return (
            <div
                onWheel={this.handlePopoverClose}
            >
                <div
                    style={{display: "flex", marginTop: 4, width: 160}}
                    onMouseEnter={this.handlePopoverOpen}
                    onMouseLeave={this.handlePopoverClose}
                >
                    {rarityValues.get(card.rarity!)!.icon!}
                    <Typography
                        variant={"body2"}
                        style={{marginLeft: spacing(1)}}
                        noWrap={true}
                    >
                        {card.cardTitle}
                    </Typography>
                    {card.maverick ? <div style={{marginLeft: spacing(1)}}><MaverickIcon/></div> : null}
                </div>
                <Popover
                    style={{pointerEvents: "none"}}
                    open={this.popOpen}
                    anchorEl={this.anchorElement}
                    onClose={this.handlePopoverClose}
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
                    }}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "left",
                    }}
                    disableAutoFocus={true}
                    disableRestoreFocus={true}
                >
                    <CardSimpleView card={card}/>
                </Popover>
            </div>
        )
    }
}
