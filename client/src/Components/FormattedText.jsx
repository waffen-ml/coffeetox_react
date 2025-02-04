import { useContext, createContext, useState, useRef, useEffect } from "react"
import { Link } from "@mui/material"
import YoutubePlayer from "./YoutubePlayer"
import SoundtrackEmbed from "./Music/SoundtrackEmbed"
import PlaylistEmbed from "./Music/PlaylistEmbed"
import EbankFundraisingEmbed from "./Ebank/EbankFundraisingEmbed"
import { CfxBox } from "./CfxBaseComponents"

const ftContext = createContext({addAttachment: () => {}})
const linkRegex = /(([a-zA-Z]+:\/\/)?(([a-zA-Z0-9\-]+\.)+([a-zA-Z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-zA-Z0-9_\-\.~]+)*(\/([a-zA-Z0-9_\-\.]*)(\?[a-zA-Z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/

const tagTransformations = {
    '**': (t) => <b>{t}</b>,
    '*': (t) => <i>{t}</i>,
    '~~': (t) => <s>{t}</s>,
    '__': (t) => <u>{t}</u>
}
const tags = Object.keys(tagTransformations)

const unaryOperators = [
    {
        regex: '\n',
        transform: () => <br/>
    },
    {
        regex: /\[([^\]]+)\]:\[([^\]]+)\]/,
        transform: (m) => {
            return <Link href={m[2]} target="_blank">{m[1]}</Link>
        }
    },
    {
        regex: linkRegex,
        transform: (m, ctx) => {
            const completedLink = completeLink(m[0])
            const yt = parseYoutubeLink(completedLink)
            const music = parseMusicLink(completedLink)
            
            if(yt) ctx.addAttachment({type:'youtube', ...yt})
            if(music) ctx.addAttachment({type: 'music', ...music})

            return <Link href={completedLink} target="_blank">{m[0]}</Link>
        }
    },
    {
        regex: '\@([A-Za-z0-9_]*)(?=\n|\ |$)',
        transform: (m) => {
            return <Link href={`/user/${m[1]}`} target="_blank">@{m[1]}</Link>
        }
    },
    {
        regex: /\{ebank-fundraising-(\d+)\}/,
        transform: (m, ctx) => {
            ctx.addAttachment({type: 'ebank_fundraising', id: parseInt(m[1])})
            return <></>
        }
    },
    {
        regex: '--',
        transform: () => '–'
    }
]

function parseYoutubeLink(url){
    let match = url.match(/(youtu.*be.*)\/(watch\?v=|embed\/|v|shorts|)(.*?((?=[&#?])|$))/)

    if (match == null)
        return null

    let id = match[3]

    if(id.length != 11)
        return null

    return {
        id: id,
        shorts: url.includes('shorts')
    }
}

function parseMusicLink(url) {
    const match = url.match(/\/listen_([a-z]+)\/(\d+)/)

    if (!match)
        return null

    const [_, listenType, listenIdStr] = match

    if (listenType != 'pllt' && listenType != 'st')
        return null

    return {
        type: 'music',
        isPlaylist: listenType == 'pllt',
        id: parseInt(listenIdStr)
    }
    
}

function completeLink(link) {
    if(link.match(/^[a-zA-Z]*:\/\//) === null)
        link = 'https://' + link
    return link
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function processTag(content, tag) {
    const tregex = escapeRegExp(tag)
    const regex = new RegExp(`(?=(${tregex}(((?!${tregex}).)+)${tregex}))`, 'sg')
    const matches = [...content.matchAll(regex)]
    const result = []
    
    matches.forEach(m => {
        result.push({
            tag: tag,
            openPosition: m.index,
            closePosition: m.index + m[1].length - tag.length
        })
    })
    
    return result
}

function processAllTags(content) {
    const detected = []
    
    tags.forEach(tag => {
        detected.push(
            ...processTag(content, tag)
        )
    })
    
    detected.sort((a, b) => a.openPosition - b.openPosition)
    
    const valid = []
    
    detected.forEach(d => {
        const isValid = valid.every(v => {
            // d is left to
            if (d.closePosition + d.tag.length - 1 < v.openPosition)
                return true
            // d is right to
            else if(d.openPosition > v.closePosition + v.tag.length - 1)
                return true 
            
            const lg = d.closePositon - d.openPosition > v.closePositon - v.openPosition?
                d : v
            const sm = lg == d? v : d
            
            // small is in the big
            
            return sm.openPosition > lg.openPosition + lg.tag.length - 1
                && sm.closePosition + sm.tag.length - 1 < lg.closePosition
        })
        
        if (isValid)
            valid.push(d)
    })
    
    // small first
    valid.sort((a, b) => -(a.openPosition - a.closePosition) + (b.openPosition - b.closePosition))
    
    const result = []
    
    valid.forEach(v => {
        const inside = []

        for (let i = result.length - 1; i >= 0; i--) {
            const r = result[i]

            // inside
            if (
                v.openPosition + v.tag.length - 1 < r.openPosition
                && v.closePosition > r.closePosition + r.tag.length - 1
            ) {
                result.splice(i, 1)
                inside.push(r)
            }
        }

        inside.sort((a, b) => a.openPosition - b.openPosition)

        result.push({
            ...v,
            inside: inside
        })
        
    })

    result.sort((a, b) => a.openPosition - b.openPosition)
    
    return result
}

function ProcessUnary({text, operOffset}) {
    const ctx = useContext(ftContext)
    const oper = unaryOperators[operOffset]
    let k = 0

    if(!oper)
        return <>{text}</>

    const regex = new RegExp(oper.regex, 'g')
    const matches = [...text.matchAll(regex)]

    const parts = []
    let plainPartStart = 0

    matches.forEach(m => {
        parts.push(<ProcessUnary key={k++} text={text.slice(plainPartStart, m.index)} operOffset={operOffset + 1}/>)
        parts.push(<span key={k++}>{oper.transform(m, ctx)}</span>)
        plainPartStart = m.index + m[0].length
    })

    parts.push(<ProcessUnary key={k++} text={text.slice(plainPartStart)} operOffset={operOffset + 1}/>)

    return (
        <>
            {parts}
        </>
    )
}

function ProcessTagsRec({text, i, j, tag, insideTags}) {
    const parts = []
    let plainPartStart = i
    let k = 0

    insideTags.forEach((t) => {
        parts.push(<ProcessUnary key={k++} text={text.slice(plainPartStart, t.openPosition)} operOffset={0}/>)
        parts.push(<ProcessTagsRec key={k++} text={text} i={t.openPosition + t.tag.length} j={t.closePosition - 1} tag={t.tag} insideTags={t.inside}/>)
        plainPartStart = t.closePosition + t.tag.length
    })

    parts.push(<ProcessUnary key={k++} text={text.slice(plainPartStart, j + 1)} operOffset={0}/>)

    return tag? tagTransformations[tag](<>{parts}</>) : <>{parts}</>
}

function YoutubeGrid({videos}) {

    const shorts = videos.filter(v => v.shorts)
    const plain = videos.filter(v => !v.shorts)

    if (shorts.length + plain.length == 0)
        return <></>

    return (
        <div
            className="rounded-lg gap-2 bg-cfx-box grid justify-center max-w-full mt-1"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))'}}
        >
            {shorts.map((v, i) => (
                <div className="rounded-lg overflow-hidden aspect-[9/16] max-h-[400px] w-full" key={i}>
                    <YoutubePlayer id={v.id}/>
                </div>
            ))}

            {plain.map((v, i) => (
                <div className="rounded-lg overflow-hidden aspect-[16/9] min-h-[260px] max-h-[400px] h-full w-full sm:col-span-2" key={i}>
                    <YoutubePlayer id={v.id}/>
                </div>
            ))}

        </div>
    )
}

function MusicEmbeds({attachments}) {
    if(attachments.length == 0)
        return <></>

    return (
        <ul className="flex flex-col gap-1">
            {attachments.map((a, i) => (
                <li key={i}>
                    <CfxBox>
                        {a.isPlaylist && <PlaylistEmbed playlistId={a.id}/>}
                        {!a.isPlaylist && <SoundtrackEmbed soundtrackId={a.id}/>}
                    </CfxBox>
                </li>
            ))}
        </ul>
    )
}

function EbankFundraisingAttachments({attachments}) {
    if(attachments.length == 0)
        return <></>

    return (
        <ul className="w-full flex flex-col gap-1">
            {attachments.map((a, i) => (
                <li className="w-full" key={i}>
                    <EbankFundraisingEmbed id={a.id}/>
                </li>
            ))}
        </ul>
    )
}

export default function FormattedText({ title, text, renderAttachments, children}) {
    const [attachments, setAttachments] = useState([])
    const attachmentsLoader = []

    text = text.replace(/\r/g, '')

    const addAttachment = (attachment) => {
        attachmentsLoader.push(attachment)
    }
    
    useEffect(() => {
        setAttachments(attachmentsLoader)
    }, [text])

    const tags = processAllTags(text)

    return (
        <ftContext.Provider value={{addAttachment}}>
            <div className="w-full">
                {title && <h2 className="text-2xl font-bold mt-0 mb-1">{title}</h2>}
                <p className="w-full">
                    {children}
                    <ProcessTagsRec text={text} i={0} j={text.length - 1} insideTags={tags} tag={null}/>
                </p>
                {renderAttachments && (
                    <>
                        <YoutubeGrid videos={attachments.filter(a => a.type == 'youtube')}/>
                        <MusicEmbeds attachments={attachments.filter(a => a.type == 'music')}/>
                        <EbankFundraisingAttachments attachments={attachments.filter(a => a.type == 'ebank_fundraising')} />
                    </>
                )}
            </div>
        </ftContext.Provider>
    )
}