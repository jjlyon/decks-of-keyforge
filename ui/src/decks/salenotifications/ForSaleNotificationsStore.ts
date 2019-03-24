import axios, { AxiosResponse } from "axios"
import { observable } from "mobx"
import { HttpConfig } from "../../config/HttpConfig"
import { MessageStore } from "../../ui/MessageStore"
import { UserStore } from "../../user/UserStore"
import { ForSaleQuery } from "./ForSaleQuery"

export class ForSaleNotificationsStore {

    static readonly CONTEXT = HttpConfig.API + "/for-sale-notifications"
    static readonly SECURE_CONTEXT = HttpConfig.API + "/for-sale-notifications/secured"

    @observable
    queries?: ForSaleQuery[]

    addQuery = (query: ForSaleQuery) => {
        query.cards = query.cards.filter((card) => card.cardName.length > 0)

        axios.post(`${ForSaleNotificationsStore.SECURE_CONTEXT}/add-query`, query)
            .then((response: AxiosResponse) => {
                MessageStore.instance.setSuccessMessage(`Created deck notification filter "${query.queryName}".`)
                UserStore.instance.loadLoggedInUser()
            })
    }

    deleteQuery = (queryId: string) => {
        axios.delete(`${ForSaleNotificationsStore.SECURE_CONTEXT}/${queryId}`)
            .then((response: AxiosResponse) => {
                MessageStore.instance.setSuccessMessage(`Deleted deck notification filter.`)
                UserStore.instance.loadLoggedInUser()
            })
    }
}

export const forSaleNotificationsStore = new ForSaleNotificationsStore()