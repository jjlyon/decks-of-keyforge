import axios, { AxiosResponse } from "axios"
import { observable } from "mobx"
import { HttpConfig } from "../config/HttpConfig"
import { keyLocalStorage } from "../config/KeyLocalStorage"
import { messageStore } from "../ui/MessageStore"
import { ListingInfo } from "../userdeck/ListingInfo"
import { userDeckStore } from "../userdeck/UserDeckStore"
import { BidPlacementResult } from "./BidPlacementResult"
import { DeckListingDto } from "./DeckListingDto"

export class DeckListingStore {

    static readonly CONTEXT = HttpConfig.API + "/deck-listings"
    static readonly SECURE_CONTEXT = HttpConfig.API + "/deck-listings/secured"

    @observable
    listingInfo?: DeckListingDto

    @observable
    decksForSale?: Map<number, DeckListingDto>

    findListingsForUser = (refresh?: boolean) => {
        if (keyLocalStorage.hasAuthKey() && (refresh || this.decksForSale == null)) {
            axios.get(`${DeckListingStore.SECURE_CONTEXT}/listings-for-user`)
                .then((response: AxiosResponse<DeckListingDto[]>) => {
                    this.decksForSale = new Map()
                    response.data.forEach(auctionDto => {
                        this.decksForSale?.set(auctionDto.deckId, auctionDto)
                    })
                })
        }
    }

    listForSale = (deckName: string, listingInfo: ListingInfo) => {
        axios.post(`${DeckListingStore.SECURE_CONTEXT}/list`, listingInfo)
            .then(() => {
                messageStore.setSuccessMessage(`Created an auction for ${deckName}.`)
                auctionStore.findListingsForUser(true)
                userDeckStore.refreshDeckInfo()
            })
    }

    bid = (auctionId: string, bid: number) => {
        return axios.post(`${DeckListingStore.SECURE_CONTEXT}/bid/${auctionId}/${bid}`)
            .then((response: AxiosResponse<BidPlacementResult>) => {
                const result = response.data
                if (result.successful && result.youAreHighBidder) {
                    messageStore.setSuccessMessage(result.message)
                } else {
                    messageStore.setWarningMessage(result.message)
                }
            })
    }

    buyItNow = (auctionId: string) => {
        return axios.post(`${DeckListingStore.SECURE_CONTEXT}/buy-it-now/${auctionId}`)
            .then((response: AxiosResponse<BidPlacementResult>) => {
                const result = response.data
                if (result.successful && result.youAreHighBidder) {
                    messageStore.setSuccessMessage(result.message)
                } else {
                    messageStore.setWarningMessage(result.message)
                }
            })
    }

    findDeckListingInfo = (auctionId: string) => {
        axios.get(`${DeckListingStore.CONTEXT}/${auctionId}`)
            .then((response: AxiosResponse<DeckListingDto>) => {
                this.listingInfo = response.data
            })
    }

    cancel = (deckName: string, deckId: number) => {
        axios.post(`${DeckListingStore.SECURE_CONTEXT}/cancel/${deckId}`)
            .then((response: AxiosResponse<boolean>) => {
                if (response.data) {
                    messageStore.setSuccessMessage(`Canceled your listing for ${deckName}.`)
                } else {
                    messageStore.setWarningMessage(`Couldn't cancel listing of ${deckName}.`)
                }
                this.findListingsForUser(true)
            })
    }

    listingInfoForDeck = (deckId: number): DeckListingDto | undefined => {
        if (this.decksForSale != null) {
            return this.decksForSale.get(deckId)
        }
        return undefined
    }
}

export const auctionStore = new DeckListingStore()