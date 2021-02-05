import { Tooltip } from "@material-ui/core"
import IconButton from "@material-ui/core/IconButton/IconButton"
import Typography from "@material-ui/core/Typography"
import FavoriteIcon from "@material-ui/icons/Favorite"
import { makeObservable, observable } from "mobx"
import { observer } from "mobx-react"
import * as React from "react"
import { userDeckStore } from "../../userdeck/UserDeckStore"

interface WishlistDeckProps {
    deckId: number
    deckName: string
    favoriteCount: number
}

@observer
export class FavoriteDeck extends React.Component<WishlistDeckProps> {
    @observable
    favoriteCount = 0

    constructor(props: WishlistDeckProps) {
        super(props)
        makeObservable(this)
    }

    componentDidMount(): void {
        this.favoriteCount = this.props.favoriteCount
    }

    componentDidUpdate(): void {
        this.favoriteCount = this.props.favoriteCount
    }

    render() {
        const {deckId, deckName} = this.props
        let title
        let wishlisted = false

        if (userDeckStore.userDecksLoaded()) {
            const deck = userDeckStore.userDeckByDeckId(deckId)
            wishlisted = deck == null ? false : deck.wishlist
            title = (wishlisted ? "Remove from" : "Add to") + " my favorites"
        } else {
            title = "Login to add decks to your favorites"
        }
        return (
            <div style={{display: "flex", alignItems: "center"}}>
                <Tooltip title={title}>
                    <div>
                        <IconButton
                            onClick={() => {
                                wishlisted = !wishlisted
                                this.favoriteCount += (wishlisted ? 1 : -1)
                                userDeckStore.wishlist(deckName, deckId, wishlisted)
                            }}
                            disabled={!userDeckStore.userDecksLoaded()}
                        >
                            {wishlisted ? <FavoriteIcon color={"primary"}/> : <FavoriteIcon/>}
                        </IconButton>
                    </div>
                </Tooltip>
                <Tooltip title={"Times favorited"}>
                    <Typography variant={"body1"}>{this.favoriteCount}</Typography>
                </Tooltip>
            </div>
        )
    }
}
