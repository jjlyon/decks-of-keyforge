import { Link } from "@material-ui/core"
import Divider from "@material-ui/core/Divider"
import Typography from "@material-ui/core/Typography"
import { startCase } from "lodash"
import { observer } from "mobx-react"
import * as React from "react"
import { BidButton } from "../../auctions/BidButton"
import { BidHistoryButton } from "../../auctions/BidHistoryButton"
import { BuyItNowButton } from "../../auctions/BuyItNowButton"
import { DeckListingStatus } from "../../auctions/DeckListingDto"
import { OfferButton } from "../../auctions/offers/OfferButton"
import { marginSpacing3, spacing, themeStore } from "../../config/MuiConfig"
import { Routes } from "../../config/Routes"
import { Utils } from "../../config/Utils"
import { SendEmailDialog } from "../../emails/SendEmailDialog"
import { countryToLabel } from "../../generic/Country"
import { HelperText } from "../../generic/CustomTypographies"
import { KeyLink } from "../../mui-restyled/KeyLink"
import { SellerImg } from "../../sellers/imgs/SellerImgs"
import { sellerStore } from "../../sellers/SellerStore"
import { DiscordUser } from "../../thirdpartysites/discord/DiscordUser"
import { userStore } from "../../user/UserStore"
import { deckConditionReadableValue } from "../../userdeck/UserDeck"
import { DeckSaleInfo } from "./DeckSaleInfo"
import { SingleSaleInfoViewCompleteAuction } from "./SingleSaleInfoViewCompleteAuction"

interface SaleInfoViewProps {
    saleInfo: DeckSaleInfo[]
    deckName: string
    keyforgeId: string
    height?: number
}

@observer
export class SaleInfoView extends React.Component<SaleInfoViewProps> {
    render() {
        const {saleInfo, deckName, keyforgeId, height} = this.props
        if (saleInfo.length === 0) {
            return null
        }
        return (
            <div
                style={{
                    backgroundColor: themeStore.cardBackground,
                    overflowY: "auto",
                    height
                }}
            >
                {this.props.saleInfo.map((saleInfo, idx) => {
                    return (
                        <div key={saleInfo.auctionId}>
                            {idx > 0 && (
                                <div style={{margin: spacing(2)}}>
                                    <Typography variant={"h6"}>{idx + 1} Deck Sale Info</Typography>
                                </div>
                            )}
                            <SingleSaleInfoView
                                saleInfo={saleInfo}
                                deckName={deckName}
                                keyforgeId={keyforgeId}
                            />
                        </div>
                    )
                })}
            </div>
        )
    }
}

@observer
export class SingleSaleInfoView extends React.Component<{ saleInfo: DeckSaleInfo, deckName: string, keyforgeId: string }> {
    render() {

        if (this.props.saleInfo.auctionStatus === DeckListingStatus.COMPLETE) {
            return <SingleSaleInfoViewCompleteAuction {...this.props} />
        }

        const {deckName, saleInfo} = this.props
        const {
            forAuction, forSaleInCountry, condition, dateListed, expiresAt, listingInfo, username, publicContactInfo, externalLink,
            discord, language, currencySymbol, highestBid, buyItNow, bidIncrement, auctionEndDateTime, auctionId, nextBid, youAreHighestBidder, yourMaxBid,
            startingBid, shippingCost, acceptingOffers, highestOffer
        } = saleInfo

        const yourUsername = userStore.username
        const yourEmail = userStore.email

        const allowEmail = yourEmail && yourUsername

        const sellerDetails = sellerStore.findSellerWithUsername(username)

        return (
            <div style={{marginTop: spacing(2), marginBottom: spacing(2)}}>
                {(buyItNow != null || highestOffer != null || startingBid != null) && (
                    <>
                        <div style={{marginLeft: spacing(2), marginRight: spacing(2), display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                            <div style={{display: "grid", gridTemplateColumns: "152px 1fr"}}>
                                {!acceptingOffers && !forAuction && buyItNow != null && (
                                    <Typography variant={"h4"} style={{marginLeft: spacing(1), marginRight: spacing(1)}}>
                                        {currencySymbol}{buyItNow}
                                    </Typography>
                                )}
                                {acceptingOffers && (
                                    <TwoPricesDisplay
                                        currencySymbol={currencySymbol}
                                        priceOneName={"High Offer:"}
                                        priceOneValue={highestOffer}
                                        priceTwoName={"Buy it Now:"}
                                        priceTwoValue={buyItNow}
                                    />
                                )}
                                {forAuction && (
                                    <TwoPricesDisplay
                                        currencySymbol={currencySymbol}
                                        priceOneName={"High Bid:"}
                                        priceOneValue={highestBid ? highestBid : startingBid}
                                        priceTwoName={"Buy it Now:"}
                                        priceTwoValue={buyItNow}
                                    />
                                )}
                            </div>
                        </div>
                        <Divider style={{marginTop: spacing(2)}}/>
                    </>
                )}
                <div>
                    {acceptingOffers && (
                        <>
                            <div style={{margin: spacing(2)}}>
                                <div style={{display: "flex", alignItems: "center", marginTop: spacing(2)}}>
                                    <OfferButton
                                        deckName={deckName}
                                        currencySymbol={currencySymbol}
                                        deckListingId={auctionId!}
                                        sellerUsername={username}
                                        style={{marginRight: spacing(2)}}
                                    />
                                    {buyItNow == null ? null : (
                                        <BuyItNowButton currencySymbol={currencySymbol} auctionId={auctionId!} sellerUsername={username} buyItNow={buyItNow}/>
                                    )}
                                </div>
                            </div>
                            <Divider style={{marginTop: spacing(2)}}/>
                        </>
                    )}
                    {forAuction && (
                        <div style={{margin: spacing(2)}}>
                            <div style={{display: "flex"}}>
                                <Typography variant={"subtitle2"} style={{marginRight: spacing(2)}}>Ending on:</Typography>
                                <Typography variant={"subtitle2"}>{auctionEndDateTime}</Typography>
                            </div>
                            {youAreHighestBidder ? (
                                <div style={{marginTop: spacing(2)}}>
                                    <Typography variant={"h4"} color={"primary"}>
                                        High Bidder!
                                    </Typography>
                                    <Typography style={{marginTop: spacing(1)}}>
                                        Your max bid: {currencySymbol}{yourMaxBid}
                                    </Typography>
                                </div>
                            ) : null}
                            <div style={{display: "flex", alignItems: "center", marginTop: spacing(2)}}>
                                <BidButton
                                    currentBid={highestBid}
                                    bidIncrement={bidIncrement!}
                                    currencySymbol={currencySymbol}
                                    auctionId={auctionId!}
                                    nextValidBid={nextBid!}
                                    sellerUsername={username}
                                    youAreHighestBidder={!!youAreHighestBidder}
                                    style={{marginRight: spacing(2)}}
                                />
                                {buyItNow == null ? null : (
                                    <BuyItNowButton currencySymbol={currencySymbol} auctionId={auctionId!} sellerUsername={username} buyItNow={buyItNow}/>
                                )}
                                <div style={{flexGrow: 1}}/>
                                <BidHistoryButton auctionId={auctionId!}/>
                            </div>
                        </div>
                    )}
                    {sellerDetails == null ? null : (
                        <div style={{display: "flex", alignItems: "center", margin: marginSpacing3(0, 2, 2)}}>
                            <SellerImg sellerUsername={username}/>
                            <KeyLink to={Routes.userDecksForSale(username)} noStyle={true}>
                                <Typography variant={"h5"}>{sellerDetails.storeName}</Typography>
                            </KeyLink>
                        </div>
                    )}
                    <InfoBox title={"Listing Details"} info={listingInfo}/>
                    <InfoBox title={"External listing — Be careful using this link!"} info={externalLink}/>
                    <InfoBox title={"Seller Details"} info={publicContactInfo}/>
                    <InfoBox title={"Shipping Cost"} info={shippingCost}/>
                    {discord || (allowEmail && !forAuction) ? (
                        <>
                            <div style={{margin: marginSpacing3(0, 2, 2)}}>
                                <div style={{display: "flex", flexWrap: "wrap"}}>
                                    {discord ? (
                                        <>
                                            <DiscordUser discord={discord} style={{marginTop: spacing(2)}}/>
                                            <div style={{flexGrow: 1}}/>
                                        </>
                                    ) : null}
                                    {allowEmail ? (
                                        <div
                                            style={{marginTop: spacing(2)}}
                                        >
                                            <SendEmailDialog
                                                deckName={deckName}
                                                recipientUsername={username}
                                                keyforgeId={this.props.keyforgeId}
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <Divider style={{marginTop: spacing(2)}}/>
                        </>
                    ) : null}
                    <div>
                        <Typography style={{margin: marginSpacing3(2, 2, 0)}} variant={"subtitle2"}>
                            {countryToLabel(forSaleInCountry)} – {startCase(language.toString().toLowerCase())} – {deckConditionReadableValue(condition)}
                        </Typography>
                    </div>
                    <Typography style={{margin: marginSpacing3(1, 2, 0)}} variant={"subtitle2"}>
                        Listed {Utils.formatDate(dateListed)} by <Link href={Routes.userProfilePage(username)}>{username}</Link>
                    </Typography>
                    {expiresAt != null && !forAuction ? (
                        <Typography style={{margin: marginSpacing3(1, 2, 2)}} variant={"subtitle2"}>
                            Expires {Utils.formatDate(expiresAt)}
                        </Typography>
                    ) : null}
                    <Divider style={{marginTop: spacing(2)}}/>
                    <BuyingDisclaimer style={{margin: spacing(2)}}/>
                </div>
            </div>
        )
    }
}

const InfoBox = (props: { title: string, info?: string, link?: string }) => {
    if (!props.info && !props.link) {
        return null
    }
    return (
        <>
            <div style={{margin: marginSpacing3(2, 2, 0)}}>
                <Typography variant={"subtitle2"} style={{marginBottom: spacing(0.5)}}>{props.title}</Typography>
                {props.info ? (
                    <Typography variant={"body2"} style={{whiteSpace: "pre-wrap"}}>{props.info}</Typography>
                ) : (
                    <a href={props.link} target={"_blank"} rel={"noopener noreferrer"}><Typography>{props.link}</Typography></a>
                )}
            </div>
            <Divider style={{marginTop: spacing(2)}}/>
        </>
    )
}

export const BuyingDisclaimer = (props: { style?: React.CSSProperties }) => (
    <HelperText style={props.style}>
        DoK does not verify the authenticity or trustworthiness of any deck sales. Purchase and trade decks at your own risk.
    </HelperText>
)

const TwoPricesDisplay = (props: {
    currencySymbol: string,
    priceOneName: string,
    priceOneValue?: string | number,
    priceTwoName: string,
    priceTwoValue?: string | number
}) => (
    <>
        <Typography
            variant={"h5"}
            style={{marginLeft: spacing(1), marginRight: spacing(1)}}
        >
            {props.priceOneName}
        </Typography>
        <Typography
            variant={"h5"}
            style={{marginLeft: spacing(1), marginRight: spacing(1)}}
        >
            {props.priceOneValue == null ? "" : `${props.currencySymbol}${props.priceOneValue}`}
        </Typography>
        {props.priceTwoValue != null && (
            <>
                <Typography variant={"h5"} style={{marginLeft: spacing(1), marginRight: spacing(1)}}>
                    {props.priceTwoName}
                </Typography>
                <Typography variant={"h5"} style={{marginLeft: spacing(1), marginRight: spacing(1)}}>
                    {props.priceTwoValue == null ? "" : `${props.currencySymbol}${props.priceTwoValue}`}
                </Typography>
            </>
        )}
    </>
)