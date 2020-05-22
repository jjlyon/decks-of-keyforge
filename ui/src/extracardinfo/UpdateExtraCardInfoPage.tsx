import {
    Button,
    Card,
    CardActions,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Grid,
    IconButton,
    MenuItem,
    Radio,
    RadioGroup,
    TextField,
    Typography
} from "@material-ui/core"
import { ChevronLeft, ChevronRight, Close, Delete, Edit, Save } from "@material-ui/icons"
import { Autocomplete } from "@material-ui/lab"
import { startCase } from "lodash"
import { observable } from "mobx"
import { observer } from "mobx-react"
import React, { ChangeEvent } from "react"
import { RouteComponentProps } from "react-router-dom"
import { CardView } from "../cards/CardSimpleView"
import { cardStore } from "../cards/CardStore"
import { CardType } from "../cards/CardType"
import { KCard } from "../cards/KCard"
import { spacing, themeStore } from "../config/MuiConfig"
import { Routes } from "../config/Routes"
import { Utils } from "../config/Utils"
import { EventValue } from "../generic/EventValue"
import { UnstyledLink } from "../generic/UnstyledLink"
import { KeyButton } from "../mui-restyled/KeyButton"
import { LinkButton } from "../mui-restyled/LinkButton"
import { Loader } from "../mui-restyled/Loader"
import { SelectedOptions } from "../mui-restyled/SelectedOptions"
import { Spoiler } from "../spoilers/Spoiler"
import { spoilerStore } from "../spoilers/SpoilerStore"
import { SpoilerView } from "../spoilers/SpoilerView"
import { SynTraitHouse, synTraitHouseShortLabel } from "../synergy/SynTraitHouse"
import { SynTraitPlayer, SynTraitRatingValues, SynTraitValue } from "../synergy/SynTraitValue"
import { TraitBubble } from "../synergy/TraitBubble"
import { uiStore } from "../ui/UiStore"
import { ExtraCardInfo } from "./ExtraCardInfo"
import { extraCardInfoStore } from "./ExtraCardInfoStore"
import { synergyOptions, SynergyTrait, traitOptions, validSynergies, validTraits } from "./SynergyTrait"

interface UpdateExtraCardInfoPageProps extends RouteComponentProps<{ infoId: string }> {
}

@observer
export class UpdateExtraCardInfoPage extends React.Component<UpdateExtraCardInfoPageProps> {

    componentDidMount(): void {
        if (this.props.match.params.infoId) {
            extraCardInfoStore.findExtraCardInfo(this.props.match.params.infoId)
        }
    }

    componentDidUpdate(prevProps: UpdateExtraCardInfoPageProps): void {
        if (prevProps.match.params.infoId && this.props.match.params.infoId != this.props.match.params.infoId) {
            extraCardInfoStore.findExtraCardInfo(this.props.match.params.infoId)
        }
    }

    render() {
        const extraCardInfo = extraCardInfoStore.extraCardInfo
        const allCards = cardStore.allCards
        if (extraCardInfo == null || allCards.length === 0) {
            return <Loader/>
        }
        const card = cardStore.findCardByIdentifier(extraCardInfo.cardNumbers[0])
        if (card == null) {
            return <Loader/>
        }
        return <UpdateExtraCardInfo extraCardInfo={extraCardInfo} card={card}/>
    }
}

interface UpdateExtraCardInfoProps {
    extraCardInfo: ExtraCardInfo
    card?: KCard
    spoiler?: Spoiler
}

@observer
export class UpdateExtraCardInfo extends React.Component<UpdateExtraCardInfoProps> {

    @observable
    amberControl = "0"
    @observable
    expectedAmber = "0"
    @observable
    artifactControl = "0"
    @observable
    creatureControl = "0"
    @observable
    aercScore = "0"
    @observable
    efficiency = "0"
    @observable
    effectivePower = "0"
    @observable
    amberProtection = "0"
    @observable
    disruption = "0"
    @observable
    houseCheating = "0"
    @observable
    other = "0"

    @observable
    amberControlMax = "0"
    @observable
    expectedAmberMax = "0"
    @observable
    artifactControlMax = "0"
    @observable
    creatureControlMax = "0"
    @observable
    aercScoreMax = "0"
    @observable
    efficiencyMax = "0"
    @observable
    effectivePowerMax = "0"
    @observable
    amberProtectionMax = "0"
    @observable
    disruptionMax = "0"
    @observable
    houseCheatingMax = "0"
    @observable
    otherMax = "0"

    @observable
    traits: SynTraitValue[] = []
    @observable
    synergies: SynTraitValue[] = []

    // eslint-disable-next-line
    // @ts-ignore
    infoId: string

    constructor(props: UpdateExtraCardInfoProps) {
        super(props)
        this.reset(props.extraCardInfo)
    }

    componentDidUpdate(prevProps: Readonly<UpdateExtraCardInfoProps>) {
        if (prevProps.extraCardInfo !== this.props.extraCardInfo) {
            this.reset(this.props.extraCardInfo)
        }
    }

    reset = (resetTo: ExtraCardInfo) => {
        const extraCardInfo = resetTo == null ? this.props.extraCardInfo : resetTo
        this.infoId = extraCardInfo.id

        this.amberControl = extraCardInfo.amberControl.toString()
        this.expectedAmber = extraCardInfo.expectedAmber.toString()
        this.artifactControl = extraCardInfo.artifactControl.toString()
        this.creatureControl = extraCardInfo.creatureControl.toString()
        this.efficiency = extraCardInfo.efficiency.toString()
        this.effectivePower = extraCardInfo.effectivePower.toString()
        this.amberProtection = extraCardInfo.amberProtection.toString()
        this.disruption = extraCardInfo.disruption.toString()
        this.houseCheating = extraCardInfo.houseCheating.toString()
        this.other = extraCardInfo.other.toString()

        this.amberControlMax = extraCardInfo.amberControlMax == null ? "0" : extraCardInfo.amberControlMax.toString()
        this.expectedAmberMax = extraCardInfo.expectedAmberMax == null ? "0" : extraCardInfo.expectedAmberMax.toString()
        this.artifactControlMax = extraCardInfo.artifactControlMax == null ? "0" : extraCardInfo.artifactControlMax.toString()
        this.creatureControlMax = extraCardInfo.creatureControlMax == null ? "0" : extraCardInfo.creatureControlMax.toString()
        this.efficiencyMax = extraCardInfo.efficiencyMax == null ? "0" : extraCardInfo.efficiencyMax.toString()
        this.effectivePowerMax = extraCardInfo.effectivePowerMax == null ? "0" : extraCardInfo.effectivePowerMax.toString()
        this.amberProtectionMax = extraCardInfo.amberProtectionMax == null ? "0" : extraCardInfo.amberProtectionMax.toString()
        this.disruptionMax = extraCardInfo.disruptionMax == null ? "0" : extraCardInfo.disruptionMax.toString()
        this.houseCheatingMax = extraCardInfo.houseCheatingMax == null ? "0" : extraCardInfo.houseCheatingMax.toString()
        this.otherMax = extraCardInfo.otherMax == null ? "0" : extraCardInfo.otherMax.toString()

        this.traits = extraCardInfo.traits
        this.synergies = extraCardInfo.synergies

        uiStore.setTopbarValues("Edit " + this.props.card?.cardTitle ?? this.props.spoiler?.cardTitle, "Edit", "")
    }

    save = async () => {

        const extraCardInfo: ExtraCardInfo = {
            ...this.props.extraCardInfo,

            amberControl: Number(this.amberControl),
            expectedAmber: Number(this.expectedAmber),
            artifactControl: Number(this.artifactControl),
            creatureControl: Number(this.creatureControl),
            efficiency: Number(this.efficiency),
            effectivePower: Number(this.effectivePower),
            amberProtection: Number(this.amberProtection),
            disruption: Number(this.disruption),
            houseCheating: Number(this.houseCheating),
            other: Number(this.other),

            amberControlMax: Number(this.amberControlMax),
            expectedAmberMax: Number(this.expectedAmberMax),
            artifactControlMax: Number(this.artifactControlMax),
            creatureControlMax: Number(this.creatureControlMax),
            efficiencyMax: Number(this.efficiencyMax),
            effectivePowerMax: Number(this.effectivePowerMax),
            amberProtectionMax: Number(this.amberProtectionMax),
            disruptionMax: Number(this.disruptionMax),
            houseCheatingMax: Number(this.houseCheatingMax),
            otherMax: Number(this.otherMax),

            traits: this.traits,
            synergies: this.synergies
        }
        await extraCardInfoStore.saveExtraCardInfo(extraCardInfo)
        const saved = await extraCardInfoStore.findExtraCardInfo(this.infoId)
        this.reset(saved)
    }

    render() {
        const {card, spoiler} = this.props
        let nextId
        let prevId
        if (card != null) {
            const filteredCards = cardStore.allCards
            if (filteredCards.length > 0 && this.props.extraCardInfo != null) {
                const findWith = filteredCards.find(filterCard => filterCard.id === card.id)
                if (findWith != null) {
                    const idx = filteredCards.indexOf(findWith)
                    nextId = idx > -1 && idx < filteredCards.length - 1 ? filteredCards[idx + 1].extraCardInfo.id : undefined
                    prevId = idx > 0 ? filteredCards[idx - 1].extraCardInfo.id : undefined
                }
            }
        } else if (spoiler != null) {
            const filteredSpoilers = spoilerStore.spoilers?.filter(filterSpoiler => !filterSpoiler.reprint)
            if (filteredSpoilers != null && filteredSpoilers.length > 0) {
                const findWith = filteredSpoilers.find(filterSpoiler => filterSpoiler.id === spoiler.id)
                if (findWith != null) {
                    const idx = filteredSpoilers.indexOf(findWith)
                    nextId = idx > -1 && idx < filteredSpoilers.length - 1 ? filteredSpoilers[idx + 1].id : undefined
                    prevId = idx > 0 ? filteredSpoilers[idx - 1].id : undefined
                }
            }
        }
        return (
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center"
                }}
            >
                {card && (
                    <div>
                        <CardView card={card}/>
                    </div>
                )}
                {spoiler && (
                    <div>
                        <SpoilerView spoiler={spoiler}/>
                    </div>
                )}
                <div>
                    <Card style={{maxWidth: 800, margin: spacing(2), padding: spacing(2)}}>
                        <div style={{display: "flex", alignItems: "center", marginBottom: spacing(2)}}>
                            <Typography variant={"h4"}>
                                {card?.cardTitle ?? spoiler?.cardTitle}'s AERC
                            </Typography>
                            <div style={{flexGrow: 1}}/>
                            {prevId != null && (
                                <UnstyledLink
                                    to={card != null ? Routes.editExtraCardInfo(prevId) : Routes.editSpoilerAerc(prevId)}
                                    style={{marginLeft: spacing(2)}}
                                >
                                    <IconButton>
                                        <ChevronLeft/>
                                    </IconButton>
                                </UnstyledLink>
                            )}
                            {nextId != null && (
                                <UnstyledLink
                                    to={card != null ? Routes.editExtraCardInfo(nextId) : Routes.editSpoilerAerc(nextId)}
                                    style={{marginLeft: spacing(2)}}>
                                    <IconButton>
                                        <ChevronRight/>
                                    </IconButton>
                                </UnstyledLink>
                            )}
                        </div>
                        <Grid
                            container={true}
                            spacing={2}
                            style={{marginTop: spacing(2)}}
                        >
                            <InfoInput
                                name={"expected aember"}
                                value={this.expectedAmber}
                                update={(event: EventValue) => this.expectedAmber = event.target.value}
                            />
                            <InfoInput
                                name={"exp aember max"}
                                value={this.expectedAmberMax}
                                update={(event: EventValue) => this.expectedAmberMax = event.target.value}
                            />
                            <InfoInput
                                name={"aember control"}
                                value={this.amberControl}
                                update={(event: EventValue) => this.amberControl = event.target.value}
                            />
                            <InfoInput
                                name={"aember control max"}
                                value={this.amberControlMax}
                                update={(event: EventValue) => this.amberControlMax = event.target.value}
                            />
                            <InfoInput
                                name={"artifact control"}
                                value={this.artifactControl}
                                update={(event: EventValue) => this.artifactControl = event.target.value}
                            />
                            <InfoInput
                                name={"artifact control max"}
                                value={this.artifactControlMax}
                                update={(event: EventValue) => this.artifactControlMax = event.target.value}
                            />
                            <InfoInput
                                name={"creature control"}
                                value={this.creatureControl}
                                update={(event: EventValue) => this.creatureControl = event.target.value}
                            />
                            <InfoInput
                                name={"creature control max"}
                                value={this.creatureControlMax}
                                update={(event: EventValue) => this.creatureControlMax = event.target.value}
                            />
                            <InfoInput
                                name={"efficiency"}
                                value={this.efficiency}
                                update={(event: EventValue) => this.efficiency = event.target.value}
                            />
                            <InfoInput
                                name={"efficiency max"}
                                value={this.efficiencyMax}
                                update={(event: EventValue) => this.efficiencyMax = event.target.value}
                            />
                            <InfoInput
                                name={"disruption"}
                                value={this.disruption}
                                update={(event: EventValue) => this.disruption = event.target.value}
                            />
                            <InfoInput
                                name={"disruption max"}
                                value={this.disruptionMax}
                                update={(event: EventValue) => this.disruptionMax = event.target.value}
                            />
                            <InfoInput
                                name={"effective power"}
                                value={this.effectivePower}
                                update={(event: EventValue) => this.effectivePower = event.target.value}
                            />
                            <InfoInput
                                name={"effective power max"}
                                value={this.effectivePowerMax}
                                update={(event: EventValue) => this.effectivePowerMax = event.target.value}
                            />
                            <InfoInput
                                name={"aember protection"}
                                value={this.amberProtection}
                                update={(event: EventValue) => this.amberProtection = event.target.value}
                            />
                            <InfoInput
                                name={"aember prot max"}
                                value={this.amberProtectionMax}
                                update={(event: EventValue) => this.amberProtectionMax = event.target.value}
                            />
                            <InfoInput
                                name={"house cheating"}
                                value={this.houseCheating}
                                update={(event: EventValue) => this.houseCheating = event.target.value}
                            />
                            <InfoInput
                                name={"house cheating max"}
                                value={this.houseCheatingMax}
                                update={(event: EventValue) => this.houseCheatingMax = event.target.value}
                            />
                            <InfoInput
                                name={"other"}
                                value={this.other}
                                update={(event: EventValue) => this.other = event.target.value}
                            />
                            <InfoInput
                                name={"other max"}
                                value={this.otherMax}
                                update={(event: EventValue) => this.otherMax = event.target.value}
                            />
                            <Grid item={true} xs={12}>
                                <AddTrait traits={this.traits} synergies={this.synergies}/>
                            </Grid>
                        </Grid>
                        <CardActions>
                            <LinkButton
                                to={Routes.cards}
                                style={{marginRight: spacing(2)}}
                            >
                                Cards
                            </LinkButton>
                            <div style={{flexGrow: 1}}/>
                            <KeyButton
                                variant={"contained"}
                                color={"primary"}
                                loading={extraCardInfoStore.savingExtraCardInfo}
                                onClick={this.save}
                            >
                                Save
                            </KeyButton>
                        </CardActions>
                    </Card>
                </div>
            </div>
        )
    }
}

const InfoInput = (props: { name: string, value: string, update: (event: EventValue) => void }) => {
    const {name, value, update} = props
    return (
        <Grid item={true} xs={6} sm={3}>
            <TextField
                label={name}
                value={value}
                onChange={update}
                fullWidth={true}
                variant={"outlined"}
                type={"number"}
            />
        </Grid>
    )
}

type SynGroup = "A" | "B" | "C" | "D" | ""

interface AddTraitProps {
    traits: SynTraitValue[]
    synergies: SynTraitValue[]
}

@observer
class AddTrait extends React.Component<AddTraitProps> {

    cardTraitsStore = new SelectedOptions()

    @observable
    traitOrSynergy: "trait" | "synergy" = "synergy"

    @observable
    rating: SynTraitRatingValues = 3

    @observable
    house: SynTraitHouse = SynTraitHouse.anyHouse

    @observable
    cardTypes: CardType[] = []

    @observable
    powersString = ""

    @observable
    baseSynPercent = ""

    @observable
    player: SynTraitPlayer = SynTraitPlayer.ANY

    @observable
    cardName = ""

    @observable
    trait: SynergyTrait = SynergyTrait.any

    @observable
    group: SynGroup = ""

    @observable
    groupMax = ""

    addTraitOrSyn = (trait?: SynergyTrait) => {
        const {traits, synergies} = this.props
        let isSynergy = this.traitOrSynergy === "synergy"
        if (trait != null) {
            isSynergy = false
        }
        const addTo = isSynergy ? synergies : traits

        let traitValue
        if (trait != null) {
            traitValue = trait
        } else if (this.cardName != "") {
            traitValue = SynergyTrait.card
        } else {
            traitValue = this.trait
        }

        const toAdd: SynTraitValue = {
            trait: traitValue as SynergyTrait,
            rating: this.rating,
            cardName: this.cardName == "" ? undefined : this.cardName,
            house: this.house,
            player: this.player,
            cardTypes: this.cardTypes.slice(),
            cardTraits: this.cardTraitsStore.selectedValues.slice(),
            powersString: this.powersString.trim(),
            baseSynPercent: Number(this.baseSynPercent.trim()),
            synergyGroup: this.group === "" ? undefined : this.group,
            synergyGroupMax: this.groupMax === "" ? undefined : Number(this.groupMax)
        }
        addTo.push(toAdd)
    }

    setTraitTo = (value: SynTraitValue, synergy: boolean) => {

        this.cardName = ""
        this.powersString = value.powersString
        this.player = value.player
        this.house = value.house
        this.traitOrSynergy = synergy ? "synergy" : "trait"
        this.cardTypes = value.cardTypes
        this.rating = value.rating
        this.trait = value.trait
        this.cardTraitsStore.reset()
        this.baseSynPercent = value.baseSynPercent.toString()
        this.group = value.synergyGroup as SynGroup
        this.groupMax = value.synergyGroupMax?.toString() ?? ""
    }

    render() {

        const {traits, synergies} = this.props

        const selectableTraits = this.traitOrSynergy === "synergy" ? validSynergies : validTraits

        const cardNames = cardStore.cardNames.slice()
        cardNames.push("")

        return (
            <Grid container={true} spacing={2} style={{backgroundColor: themeStore.aercViewBackground, marginBottom: spacing(2)}}>
                <Grid item={true} xs={12} sm={6}>
                    <div>
                        {traits.map((synergy, idx) => (
                            <div
                                key={idx}
                                style={{display: "flex"}}
                            >
                                <TraitBubble
                                    traitValue={synergy}
                                    trait={true}
                                />
                                <IconButton
                                    onClick={() => traits.splice(idx, 1)}
                                >
                                    <Delete/>
                                </IconButton>
                                <IconButton
                                    onClick={() => {
                                        const toEdit = traits[idx]
                                        this.setTraitTo(toEdit, false)
                                        traits.splice(idx, 1)
                                    }}
                                >
                                    <Edit/>
                                </IconButton>
                            </div>
                        ))}
                    </div>
                </Grid>
                <Grid item={true} xs={12} sm={6}>
                    <div>
                        {synergies.map((synergy, idx) => (
                            <div
                                key={idx}
                                style={{display: "flex"}}
                            >
                                <TraitBubble
                                    traitValue={synergy}
                                />
                                <IconButton
                                    onClick={() => synergies.splice(idx, 1)}
                                >
                                    <Delete/>
                                </IconButton>
                                <IconButton
                                    onClick={() => {
                                        const toEdit = synergies[idx]
                                        this.setTraitTo(toEdit, true)
                                        synergies.splice(idx, 1)
                                    }}
                                >
                                    <Edit/>
                                </IconButton>
                            </div>
                        ))}
                    </div>
                </Grid>
                <Grid item={true} xs={9}>
                    <FormControl>
                        <FormLabel>Rating</FormLabel>
                        <RadioGroup
                            value={this.rating}
                            onChange={(event) => this.rating = Number(event.target.value) as SynTraitRatingValues}
                        >
                            <div style={{display: "flex", flexWrap: "wrap"}}>
                                {[-4, -3, -2, -1, 1, 2, 3, 4].map(value => (
                                    <FormControlLabel
                                        key={value}
                                        value={value}
                                        control={<Radio/>}
                                        label={value.toString()}
                                        disabled={value < 1 && this.traitOrSynergy === "trait"}
                                    />
                                ))}
                            </div>
                        </RadioGroup>
                    </FormControl>
                </Grid>
                <Grid item={true} xs={3}>
                    <TextField
                        label={"Base Syn Percent"}
                        value={this.baseSynPercent}
                        type={"numeric"}
                        onChange={event => this.baseSynPercent = event.target.value}
                    />
                </Grid>
                <Grid item={true}>
                    <div>
                        <div>
                            <FormControl>
                                <FormLabel>Type</FormLabel>
                                <RadioGroup
                                    value={this.traitOrSynergy}
                                    onChange={event => {
                                        const changedToTrait = this.traitOrSynergy === "synergy"
                                        const newValids = changedToTrait ? traitOptions : synergyOptions
                                        const choosenTrait = this.trait
                                        if (choosenTrait != null && newValids.find(option => choosenTrait === option.value) == null) {
                                            this.trait = SynergyTrait.any
                                        }
                                        if (changedToTrait && this.rating < 1) {
                                            this.rating = 3
                                        }
                                        this.traitOrSynergy = event.target.value as "trait" | "synergy"
                                    }}
                                >
                                    <FormControlLabel value={"trait"} control={<Radio/>} label={"Trait"}/>
                                    <FormControlLabel value={"synergy"} control={<Radio/>} label={"Syn"}/>
                                </RadioGroup>
                            </FormControl>
                        </div>
                        <div>
                            <TextField
                                select={true}
                                label={"Group"}
                                value={this.group}
                                onChange={(event) => this.group = event.target.value as SynGroup}
                                style={{width: 64}}
                            >
                                <MenuItem value={""}>
                                    None
                                </MenuItem>
                                <MenuItem value={"A"}>
                                    A
                                </MenuItem>
                                <MenuItem value={"B"}>
                                    B
                                </MenuItem>
                                <MenuItem value={"C"}>
                                    C
                                </MenuItem>
                                <MenuItem value={"D"}>
                                    D
                                </MenuItem>
                            </TextField>
                        </div>
                        <div>
                            <TextField
                                label="Max"
                                value={this.groupMax}
                                type={"number"}
                                onChange={(event) => this.groupMax = event.target.value}
                                style={{width: 64}}
                            />
                        </div>
                    </div>
                </Grid>
                <Grid item={true}>
                    <FormControl>
                        <FormLabel>Card Types</FormLabel>
                        <FormGroup>
                            {(Utils.enumValues(CardType) as CardType[]).map(type => (
                                <FormControlLabel
                                    key={type}
                                    control={
                                        <Checkbox
                                            checked={this.cardTypes.includes(type)}
                                            onChange={() => {
                                                if (this.cardTypes.includes(type)) {
                                                    this.cardTypes = this.cardTypes.filter(toRemove => type !== toRemove)
                                                } else {
                                                    this.cardTypes.push(type)
                                                }
                                            }}
                                        />
                                    }
                                    label={type}
                                />
                            ))}
                        </FormGroup>
                    </FormControl>
                </Grid>
                <Grid item={true}>
                    <FormControl>
                        <FormLabel>House</FormLabel>
                        <RadioGroup
                            value={this.house}
                            onChange={(event) => this.house = event.target.value as SynTraitHouse}
                        >
                            {Utils.enumValues(SynTraitHouse).map(option => (
                                <FormControlLabel
                                    key={option}
                                    value={option}
                                    control={<Radio/>}
                                    label={synTraitHouseShortLabel(option as SynTraitHouse)}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                </Grid>
                <Grid item={true}>
                    <FormControl>
                        <FormLabel>Player</FormLabel>
                        <RadioGroup
                            value={this.player}
                            onChange={(event) => this.player = event.target.value as SynTraitPlayer}
                            color={"primary"}
                        >
                            {Utils.enumValues(SynTraitPlayer).map(option => (
                                <FormControlLabel key={option} value={option} control={<Radio/>} label={startCase((option as string).toLowerCase())}/>
                            ))}
                        </RadioGroup>
                    </FormControl>
                </Grid>
                <Grid item={true} style={{minWidth: 280}}>
                    <TextField
                        label={"Power"}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        value={this.powersString}
                        placeholder={"odd, even, 2-5, 2 or less, 3+, 3,5,7"}
                        onChange={(event) => this.powersString = event.target.value}
                        fullWidth={true}
                    />

                    <Autocomplete
                        multiple={true}
                        // @ts-ignore
                        options={cardStore.cardTraits}
                        value={this.cardTraitsStore.selectedValues}
                        renderInput={(params) => <TextField {...params} label={"Card Traits"}/>}
                        onChange={(event: ChangeEvent<{}>, newValue: string[] | null) => {
                            this.cardTraitsStore.update(newValue ?? [])
                        }}
                        size={"small"}
                    />

                    <Autocomplete
                        options={cardNames}
                        value={this.cardName}
                        renderInput={(params) => <TextField {...params} label={"Card"}/>}
                        onChange={(event: ChangeEvent<{}>, newValue: string | null) => this.cardName = newValue ?? ""}
                        clearOnEscape={true}
                        size={"small"}
                    />

                    <Autocomplete
                        options={selectableTraits}
                        getOptionLabel={(trait) => startCase(trait).replace(" R ", " ??? ")}
                        value={this.trait}
                        renderInput={(params) => <TextField {...params} label={"Trait"}/>}
                        onChange={(event: ChangeEvent<{}>, newValue: SynergyTrait | null) => this.trait = newValue ?? SynergyTrait.any}
                        style={{marginTop: spacing(1)}}
                    />

                    <div style={{display: "flex"}}>
                        <IconButton
                            onClick={() => {
                                this.cardName = ""
                                this.powersString = ""
                                this.player = SynTraitPlayer.ANY
                                this.house = SynTraitHouse.anyHouse
                                this.traitOrSynergy = "synergy"
                                this.cardTypes = []
                                this.rating = 3
                                this.trait = SynergyTrait.any
                                this.cardTraitsStore.reset()
                                this.baseSynPercent = ""
                            }}
                        >
                            <Close/>
                        </IconButton>
                        <IconButton
                            style={{marginRight: spacing(2)}}
                            onClick={() => this.addTraitOrSyn()}
                        >
                            <Save/>
                        </IconButton>
                    </div>
                </Grid>
                <Grid item={true} xs={12}>
                    <Button
                        onClick={() => {
                            this.addTraitOrSyn(SynergyTrait.protectsCreatures)
                            this.addTraitOrSyn(SynergyTrait.protectsFromEffects)
                            this.addTraitOrSyn(SynergyTrait.increasesCreaturePower)
                        }}
                    >
                        Adds Power
                    </Button>
                    <Button
                        onClick={() => {
                            this.addTraitOrSyn(SynergyTrait.protectsCreatures)
                            this.addTraitOrSyn(SynergyTrait.protectsFromEffects)
                            this.addTraitOrSyn(SynergyTrait.addsArmor)
                        }}
                    >
                        Adds Armor
                    </Button>
                    <Button
                        onClick={() => {
                            this.addTraitOrSyn(SynergyTrait.protectsCreatures)
                            this.addTraitOrSyn(SynergyTrait.protectsFromEffects)
                            this.addTraitOrSyn(SynergyTrait.preventsRemoval)
                        }}
                    >
                        Stops Removal
                    </Button>
                    <Button
                        onClick={() => {
                            this.addTraitOrSyn(SynergyTrait.protectsCreatures)
                            this.addTraitOrSyn(SynergyTrait.preventsFighting)
                        }}
                    >
                        Stops Fighting
                    </Button>
                </Grid>
            </Grid>
        )
    }
}