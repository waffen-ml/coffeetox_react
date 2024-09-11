import { cfxContext, nItemsLabel, wordForm, quickFetch} from "../utils";
import { useState, useContext } from "react";
import { Button, Link, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import { UserListWithActions } from "./UserWidgets";
import DoneIcon from '@mui/icons-material/Done';
import { CfxBox } from "./CfxBaseComponents";

function numVotersLabel(numVoters) {
    if (numVoters == 0)
        return 'Никто не проголосовал'
    return wordForm(numVoters, 'Проголосовал', 'Проголосовали', 'Проголосовали') + ' ' + nItemsLabel(numVoters, 'человек', 'человека', 'человек')
} 

function numVotesLabel(numVotes) {
    if (numVotes == 0)
        return 'Нет голосов'
    return nItemsLabel(numVotes, 'голос', 'голоса', 'голосов')
}

export default function Poll({data}) {
    const [myVote, setMyVote] = useState(data.my_vote_id)
    const [optionOpen, setOptionOpen] = useState(null)
    const {currentUser} = useContext(cfxContext)

    console.log(data)

    const vote = (optionId, retract) => {
        if(!currentUser)
            return
        else if(currentUser.id < 0) {
            alert('Войдите, чтобы голосовать!')
            return
        }

        quickFetch('/polls/vote/' + optionId, {retract: retract? 1 : 0})
        .then(r => {
            if(!r.success)
                throw Error()
            setMyVote(retract? null : optionId)
        })
        .catch(() => {
            alert('Не удалось проголосовать!')
        })
    }

    const getOption = (optionId) => {
        return data.options.find((op) => op.id == optionId)
    }

    const getNumVoters = (optionId) => {
        if(!optionId)
            return data.num_voters - (data.my_vote_id != null) + (myVote != null)

        return getOption(optionId).num_voters - (data.my_vote_id === optionId) + (myVote === optionId)
    }

    const getVoters = (optionId) => {
        if (data.is_anonymous || !currentUser)
            return []

        let voters = getOption(optionId).voters.filter(v => v.id != currentUser.id)

        if (myVote == optionId)
            voters.unshift(currentUser)

        return voters
    }

    const openOptionVotersList = (optionId) => {
        if(data.is_anonymous) {
            alert('Голосование анонимно, поэтому посмотреть проголосовавших нельзя!')
            return
        }

        setOptionOpen(getOption(optionId))
    }
    
    return (
        <CfxBox className="max-w-full flex flex-col gap-1 w-[300px] items-start">
            {data.title  && <span className="text-lg font-bold">{data.title}</span>}
            {data.is_anonymous && <span className="text-md text-gray-800">Анонимный опрос</span>}

            {!myVote && (
                <>
                    <ul className="w-full">
                        {data.options.map((option, i) => (
                            <li key={option.id} className="w-full flex items-center gap-1">
                                <span>{i + 1}.</span>
                                <Button
                                    onClick={() => vote(option.id)}
                                    fullWidth={true}
                                    style={{justifyContent: "flex-start", textAlign:'left'}}
                                >
                                    {option.label}
                                </Button>
                            </li>
                        ))}
                    </ul>
                    <span className="text-md text-gray-800">{numVotersLabel(getNumVoters())}</span>
                </>
            )}

            {myVote && (
                <>

                    <ul className="w-full">
                        {data.options.map((option, i) => (
                            <li 
                                key={option.id}
                                className="w-full grid grid-cols-[auto_1fr] gap-x-2 rounded-lg" 
                            >
                                <span className="row-span-3 self-center">{i + 1}.</span>
                                <Link
                                    component="button"
                                    onClick={() => openOptionVotersList(option.id)}
                                    underline="hover"
                                    sx={{justifySelf:'start'}}
                                >
                                    {option.label}
                                    {option.id == myVote && <DoneIcon fontSize="small"/>}
                                </Link>
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="range"
                                        readOnly
                                        className="w-full"
                                        min={0}
                                        max={100}
                                        value={Math.floor(getNumVoters(option.id) / getNumVoters() * 100)}
                                    />
                                    <span>{Math.floor(getNumVoters(option.id) / getNumVoters() * 100)}%</span>
                                </div>
                                <span>{numVotesLabel(getNumVoters(option.id))}</span>
                            </li>
                        ))}
                    </ul>

                    <span className="text-md text-gray-800">{numVotersLabel(getNumVoters())}</span>
                    <Link component="button" underline="hover" onClick={() => vote(myVote, true)}>Отменить голос</Link>
                </>
            )}

            <Dialog open={optionOpen != null} onClose={() => setOptionOpen(null)}>
                {optionOpen && (
                    <>
                        <DialogTitle>
                            {optionOpen.label}
                        </DialogTitle>
                        <DialogContent>
                            <UserListWithActions
                                users={getVoters(optionOpen.id)}
                                actions={() => null}
                                emptyMessage="Никто не проголосовал"
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOptionOpen(null)}>Закрыть</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </CfxBox>
    )

}