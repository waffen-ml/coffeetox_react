import { useEffect, useState, useReducer, useRef, createContext, useContext } from "react";
import { getRandomInt, shuffleArray, hostURL } from "../utils";
import Button from '@mui/material/Button'


function ableToMove(cards) {
    if(cards[0].flipped)
        return false

    for (let i = 1; i < cards.length; i++)
        if (cards[i].flipped || cards[i - 1].suit != cards[i].suit || cards[i - 1].rank != cards[i].rank + 1)
            return false
    
    return true
}

function ableToStack(bottom, top) {
    return !bottom || bottom.rank == top.rank + 1
}

const CARD_TEXTURE_WIDTH = 150
const CARD_TEXTURE_HEIGHT = 217
const cardTextureContext = createContext(() => '')

function loadCardTextures() {
    return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
            const cardTextures = []

            for(let i = 0; i < 4; i++) {
                cardTextures.push([])
                for(let j = 0; j < 13; j++) {
                    const canvas = document.createElement('canvas')
                    canvas.width = CARD_TEXTURE_WIDTH
                    canvas.height = CARD_TEXTURE_HEIGHT
                    const context = canvas.getContext('2d')
                    context.drawImage(img, j * CARD_TEXTURE_WIDTH, i * CARD_TEXTURE_HEIGHT, 
                        CARD_TEXTURE_WIDTH, CARD_TEXTURE_HEIGHT, 0, 0, canvas.width, canvas.height)
                    cardTextures[i].push(canvas.toDataURL())
                }
            }

            resolve(cardTextures)
        }

        img.src = hostURL('static/playing_cards/default/cards.png')
    })
}

function concatEvents(...objs) {
    const result = []
    objs.forEach(obj => {
        if(!obj)
            return
        else if(!Array.isArray(obj))
            result.push(obj)
        else
            result.push(...concatEvents(...obj))
    })
    return result
}

export default function Capytaire({ nSuits }) {
    const [columns, setColumns] = useState(null)
    const [remainCards, setRemainCards] = useState(null)
    const [currentlyDragged, setDragged] = useState(null)
    const [cardTextures, setCardTextures] = useState(null)
    const [, forceUpdate] = useReducer(x => x + 1, 0)
    const draggedStackRef = useRef(null)
    const [moves, setMoves] = useState([])

    useEffect(() => {
        const allCards = []
        const columns = []

        for(let i = 0; i < 8; i++)
            for (let j = 1; j <= 13; j++)
                allCards.push({ suit: i % nSuits + 1, rank: j, flipped: true })
        
        shuffleArray(allCards)

        for(let i = 0; i < 10; i++) {
            const nCards = i < 4? 6 : 5
            columns.push([])
            for (let j = 0; j < nCards; j++)
                columns[i].push(allCards.pop())
        }

        columns.forEach(c => {
            c[c.length - 1].flipped = false
        })

        loadCardTextures().then((textures) => {
            setCardTextures(textures)
            setColumns(columns)
            setRemainCards(allCards)
        })

    }, [])

    const addMove = (...events) => {
        const move = concatEvents(events)
        console.log('NEW MOVE:')
        console.log(move)
        setMoves([...moves, move])
    }

    const deleteLastMove = () => {
        setMoves(moves.slice(0, moves.length - 1))
    }

    const giveCards = () => {
        const events = [{type: 'give'}]
        let i = 0

        while(i < columns.length && remainCards.length) {
            const card = remainCards.pop()
            card.flipped = false
            columns[i].push(card)
            events.push(checkForCombo(i))
            i++
        }
        
        addMove(events)
        forceUpdate()
    }

    const handleMouseMove = (e) => {
        if(!currentlyDragged)
            return

        //console.log(e)

        draggedStackRef.current.style.top = (e.clientY - currentlyDragged.offsetY) + 'px'
        draggedStackRef.current.style.left = (e.clientX - currentlyDragged.offsetX) + 'px'
    }

    const revertDragged = () => {
        if(!currentlyDragged)
            return
        columns[currentlyDragged.colIdx].push(...currentlyDragged.cards)
        setDragged(null)
    }

    const checkForCombo = (colIdx) => {
        const column = columns[colIdx]

        if(column.length < 13)
            return

        const suit = column[column.length - 1].suit

        for (let i = 0; i < 13; i++) {
            const card = column[column.length - 1 - i]
            if (card.suit != suit || card.rank != i + 1)
                return
        }
        
        column.splice(column.length - 13, 13)
        forceUpdate()

        return concatEvents({type:'combo', colIdx: colIdx, suit: suit}, 
            openLastCardIfClosed(colIdx))
    }

    const openLastCardIfClosed = (colIdx) => {
        const column = columns[colIdx]
        if (!column.length || !column[column.length - 1].flipped)
            return
        column[column.length - 1].flipped = false
        return {type: 'openLast', colIdx: colIdx}
    }

    const handleMouseUp = (e) => {
        if(!currentlyDragged)
            return
        else if(!e.target.getAttribute('colidx') || e.target.getAttribute('colidx') == '-1') {
            revertDragged()
            return
        }
        
        const colIdx = parseInt(e.target.getAttribute('colidx'))
        const newColumn = columns[colIdx]

        if (!ableToStack(newColumn[newColumn.length - 1], currentlyDragged.cards[0])) {
            revertDragged()
            return
        }

        const events = [{type: 'move', 
            fromColIdx: currentlyDragged.colIdx, 
            toColIdx: colIdx,
            amount: currentlyDragged.cards.length
        }]

        newColumn.push(...currentlyDragged.cards)

        events.push(checkForCombo(colIdx))
        events.push(openLastCardIfClosed(currentlyDragged.colIdx))

        addMove(events)
        setDragged(null)
    }

    const handleDragStart = (e) => {

        e.dataTransfer.setDragImage(document.createElement('div'), e.clientX, e.clientY)

        if (currentlyDragged || !e.target.getAttribute('cardidx'))
            return

        const cardIdx = parseInt(e.target.getAttribute('cardidx'))
        const colIdx = parseInt(e.target.getAttribute('colidx'))
        const column = columns[colIdx]
        const cardsToMove = column.slice(cardIdx)

        if(!ableToMove(cardsToMove))
            return

        const rect = e.target.getBoundingClientRect()

        column.splice(cardIdx, cardsToMove.length)

        setDragged({
            cards: cardsToMove,
            offsetX: e.clientX - rect.x,
            offsetY: e.clientY - document.documentElement.scrollTop - rect.y,
            colIdx: colIdx,
            width: Math.floor(rect.width)
        })
    }

    const handleMouseLeave = () => {
        if(currentlyDragged)
            revertDragged()
    }

    const getCardSrc = (suit, rank) => {
        return cardTextures[suit - 1][rank - 1]
    }

    const handleCtrlZ = (e) => {
        if (e.code != 'KeyZ' || !e.ctrlKey || !moves.length)
            return

        const lastMove = moves[moves.length - 1]

        lastMove.reverse().forEach(event => {
            switch(event.type) {
                case 'move':
                    const cards = columns[event.toColIdx].splice(
                        columns[event.toColIdx].length - event.amount, event.amount)
                    columns[event.fromColIdx].push(...cards)
                    break
                case 'combo':
                    for (let i = 13; i >= 1; i--)
                        columns[event.colIdx].push({flipped: false, rank: i, suit: event.suit})
                    break
                case 'openLast':
                    const col = columns[event.colIdx]
                    col[col.length - 1].flipped = true
                    break
                case 'give':
                    for(let i = 9; i >= 0; i--)
                        remainCards.push(columns[i].pop())
                    break
                default:
                    alert('Unknown event: ' + event.type)
                    console.log('error with reversing the event')
                    console.log(event)
                    break
            }
        })

        deleteLastMove()
    }

    useEffect(() => {
        addEventListener('mousemove', handleMouseMove)
        addEventListener('mouseup', handleMouseUp)
        document.body.addEventListener('mouseleave', handleMouseLeave)
        addEventListener('keydown', handleCtrlZ)

        return () => {
            removeEventListener('mousemove', handleMouseMove)
            removeEventListener('mouseup', handleMouseUp)
            document.body.removeEventListener('mouseleave', handleMouseLeave)
            removeEventListener('keydown', handleCtrlZ)
        }
    })

    if (!columns || !cardTextures)
        return <div>loading...</div>

    return (
        <cardTextureContext.Provider value={getCardSrc}>
            <div className="min-h-[300px] mb-10" tabIndex="0" onDragStart={handleDragStart}>
                
                <div className="flex gap-1">
                    {columns.map((c, i) => <Column idx={i} cards={c} key={i}/>)}
                </div>
            </div>

            {currentlyDragged && (
                <div ref={draggedStackRef} className="absolute flex flex-col shadow-lg z-50 pointer-events-none" style={{width:`${currentlyDragged.width}px`}}>
                    <Cards data={currentlyDragged.cards} colidx={-1}/>
                </div>
            )}

            {remainCards.length > 0 && (
                <Button variant="contained" onClick={giveCards}>Give cards ({Math.ceil(remainCards.length / 10)} remain)</Button>
            )}
        </cardTextureContext.Provider>
    )
}

function Column({ cards, idx}) {
    return (
        <div className="flex flex-col w-full h-full min-h-[100px]" colidx={idx}>
            <Cards data={cards} colidx={idx}/>
        </div>
    )
}

function Cards({data, colidx}) {
    const getCardSrc = useContext(cardTextureContext)

    return (
        <>
            {data.map((card, i) => (
                <div draggable="true" key={i} cardidx={i} colidx={colidx} className={"relative w-full shadow-sm " + (i + 1 == data.length? 'aspect-[3/5]' : 'aspect-[10/4]')}>
                    <div cardidx={i} colidx={colidx} className="absolute top-0 left-0 w-full aspect-[3/5] outline outline-1 rounded-md overflow-hidden">
                    <img className="w-full h-full select-none pointer-events-none" src={card.flipped? hostURL('/static/playing_cards/default/back.png') : getCardSrc(card.suit, card.rank)}/>
                    </div>
                </div>
            ))}
        </>
    )
}