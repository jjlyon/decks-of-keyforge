import { IconButton } from "@material-ui/core"
import MenuItem from "@material-ui/core/MenuItem"
import { VisibilityOff } from "@material-ui/icons"
import { observer } from "mobx-react"
import * as React from "react"
import { AutoSaveTextField, AutoSaveTextFieldStore } from "../components/AutoSaveTextField"
import { keyLocalStorage } from "../config/KeyLocalStorage"
import { spacing } from "../config/MuiConfig"
import { userStore } from "../user/UserStore"
import { userDeckStore } from "../userdeck/UserDeckStore"

@observer
export class ToggleDeckNotesMenuItem extends React.Component<{ onClick: () => void }> {

    render() {
        const notesVisible = keyLocalStorage.genericStorage.viewNotes
        return (
            <>
                <MenuItem
                    onClick={() => {
                        keyLocalStorage.updateGenericStorage({viewNotes: !notesVisible})
                        this.props.onClick()
                    }}
                >
                    {notesVisible ? "Hide Notes" : "Show Notes"}
                </MenuItem>
            </>
        )
    }
}

interface InlineDeckNoteProps {
    id: number
}

@observer
export class InlineDeckNote extends React.Component<InlineDeckNoteProps> {

    render() {

        if (userStore.loginInProgress || !userStore.loggedIn() || userDeckStore.userDecks == null || !keyLocalStorage.genericStorage.viewNotes) {
            return null
        }

        const notesForDeck = userDeckStore.userDecks?.get(this.props.id)?.notes ?? ""

        return (
            <div
                style={{marginTop: spacing(2), display: "flex"}}
            >
                <AutoSaveTextField
                    multiline={true}
                    rows={3}
                    variant={"filled"}
                    fullWidth={true}
                    label={"Notes"}
                    style={{marginRight: spacing(2)}}
                    store={new AutoSaveTextFieldStore(notesForDeck, (notes) => userDeckStore.updateNotes(notes.trim(), this.props.id))}
                />
                <div>
                    <IconButton
                        onClick={() => keyLocalStorage.updateGenericStorage({viewNotes: false})}
                    >
                        <VisibilityOff fontSize={"small"}/>
                    </IconButton>
                </div>
            </div>
        )
    }
}