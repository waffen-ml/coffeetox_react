import { useState, useRef, useEffect, useContext, useReducer, useMemo, createContext } from 'react'
import { fileURL, getPostDatetimeLabel, cfxContext, hostURL, trimMultilineText, nItemsLabel, loadImage, loadVideoMetadata, userURL, quickFetch} from '../utils'
import { Avatar, TextField, InputAdornment, Link, Select, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogActions, DialogContent, Tabs, Tab} from '@mui/material'
import {AvatarNameDescriptionWidget, UserListWithActions} from "./UserWidgets.jsx"
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import RedoIcon from '@mui/icons-material/Redo';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import Button from '@mui/material/Button'
import CommentIcon from '@mui/icons-material/Comment';
import SendIcon from '@mui/icons-material/Send';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FormattedText from './FormattedText.jsx';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {PSWP_obj} from "./Pswp.jsx"
import Poll from './Poll.jsx';

import PhotoSwipeVideoPlugin from '../photoswipe-video-plugin.esm.js';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

import { CfxBox } from './CfxBaseComponents.jsx';

const postContext = createContext({})
const DEFAULT_VISIBLE_THREADS = 5
const SHOW_MORE_THREADS_STEP = 20
const DEFAULT_VISIBLE_REPLIES = 3
const SHOW_MORE_REPLIES_STEP = 20
const N_THREADS_SORT_AVAILABLE = 10


/*

<a href="https://cdn.photoswipe.com/photoswipe-demo-images/photos/2/img-2500.jpg" 
    data-pswp-width="1669" 
    data-pswp-height="2500" 
    target="_blank">
    <img src="https://cdn.photoswipe.com/photoswipe-demo-images/photos/2/img-200.jpg" alt="" />
</a>
<a href="https://cdn.photoswipe.com/photoswipe-demo-images/videos/1/video.mp4" 
    data-pswp-width="1920" 
    data-pswp-height="1080" 
    data-pswp-type="video"
    target="_blank">
    
</a>

*/


function PostVisualFiles({files, isCompact}) {
    const [metadata, setMetadata] = useState(null)
    const {postId} = useContext(postContext)
    const galleryId = 'post_gallery' + postId

    useEffect(() => {
        const loadMetadata = async () => {
            let images = files.filter(f => f.primitive_type == 'image')
            let videos = files.filter(f => f.primitive_type == 'video')

            if (images.length + videos.length == 0) {
                setMetadata({nVisual: 0})
                return
            }

            let imageSize = await Promise.all(images.map((im, i) => 
                loadImage(fileURL(im.id)).then(img => {
                    if (!img)
                        return {error: 1}
                    return {
                        idx: i,
                        width: img.width,
                        height: img.height
                    }
                })
            ))

            let videoSize = await Promise.all(videos.map((v, i) =>
                loadVideoMetadata(fileURL(v.id)).then(video => {
                    if(!video)
                        return {error: 1}
                    return {
                        idx: i,
                        width: video.videoWidth,
                        height: video.videoHeight
                    }
                })
            ))

            imageSize = imageSize.filter(s => !s.error)
            videoSize = videoSize.filter(s => !s.error)

            images = imageSize.map(s => images[s.idx])
            videos = videoSize.map(s => videos[s.idx])

            const visual = images.concat(videos)
            const nBigMediaTiles = visual.length % 3 == 1?
                4 : visual.length % 3 == 0? 0 : 2;

            setMetadata({
                imageSize, videoSize, images, videos, visual,
                nBigMediaTiles, nVisual: visual.length,
                nVideos: videos.length, nImages: images.length
            })
        }
        loadMetadata()
    }, [])

    useEffect(() => {
        if (!metadata || metadata.nVisual == 1 && metadata.nVideos == 1)
            return

        const lightbox = new PhotoSwipeLightbox({
            gallery: '#' + galleryId,
            children: 'a',
            pswpModule: () => import('photoswipe'),

            padding: {
                top: 50,
                bottom: 50,
                left: 0,
                right: 0
            },
              
            // Recommended PhotoSwipe options for this plugin
            allowPanToNext: false, // prevent swiping to the next slide when image is zoomed
            allowMouseDrag: true, // display dragging cursor at max zoom level
            wheelToZoom: true, // enable wheel-based zoom
            zoom: false // disable default zoom button
        })

        const videoPlugin = new PhotoSwipeVideoPlugin(lightbox, {});
    
        lightbox.init()
        
        return () => {
            lightbox.destroy()
        }
    }, [metadata])

    if (!metadata)
        return <>Media files are loading...</>

    const w = metadata
    const isBig = (i, isVideo) => i + isVideo * w.nImages < w.nBigMediaTiles;

    if (!w.nVisual)
        return <></>
    else if(w.nVisual == 1) {
        return (
            <div id={galleryId} className={"w-full bg-cfx-box rounded-lg overflow-hidden"}>
                {w.nImages == 1 && (
                    <PSWP_obj 
                        src={fileURL(w.images[0].id)}
                        width={w.imageSize[0].width}
                        height={w.imageSize[0].height}
                        isVideo={false}
                        innersx={{
                            width: "auto",
                            height: "auto",
                            maxWidth: "100%",
                            maxHeight: isCompact? '300px' : '450px',
                            marginLeft: 'auto',
                            marginRight: 'auto'
                        }}
                    />
                )}
                {w.nVideos == 1 && (
                    <video
                        className="w-full"
                        style={{
                            maxHeight: isCompact? '300px' : '450px'
                        }}
                        controls
                        preload="metadata"
                        src={fileURL(w.videos[0].id)}
                        type={w.videos[0].content_type}
                    >
                    </video>
                )}
            </div>
        )
    }
    else {
        return (
            <div id={galleryId} className="grid grid-cols-6 gap-2">
                {w.images.map((f, i) => (
                    <PSWP_obj 
                        src={fileURL(f.id)}
                        key={f.id}
                        width={w.imageSize[i].width}
                        height={w.imageSize[i].height}
                        isVideo={false}
                        isCropped={true}
                        innersx={{
                            objectFit: 'cover',
                            background: 'rgb(var(--cfx-box))'
                        }}
                        outersx={{
                            maxHeight: isCompact? '150px' : '225px',
                            gridColumn: isBig(i, false)? 'span 3' : 'span 2'
                        }}
                    />
                ))}
                {w.videos.map((f, i) => (
                    <PSWP_obj 
                        src={fileURL(f.id)}
                        key={f.id}
                        width={w.videoSize[i].width}
                        height={w.videoSize[i].height}
                        isVideo={true}
                        isCropped={true}
                        innersx={{
                            objectFit: 'cover',
                            background: 'rgb(var(--cfx-box))'
                        }}
                        outersx={{
                            maxHeight: isCompact? '150px' : '225px',
                            gridColumn: isBig(i, true)? 'span 3' : 'span 2'
                        }}
                    />
                ))}
            </div>
        )
    }
}

function PostOtherFiles({files}) {
    const other = files.filter(f => f.primitive_type == 'other')

    if(!other.length)
        return <></>

    return (
        <div style={{'width': 'max-content'}} className="bg-gray-300 rounded-lg p-2 max-w-full">
            <u>Прикрепленные файлы</u>
            <ul className="list-disc pl-5">
                {other.map(f => (
                    <li key={f.id}><a target="_blank" href={fileURL(f.id)}>{f.filename}</a></li>
                ))}
            </ul>
        </div>
    )
}

function PostAudioFiles({files}) {
    const audio = files.filter(f => f.primitive_type == 'audio')

    if(!audio.length)
        return <></>
    
    return (
        <div className="grid gap-x-1 gap-y-1" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))'}}>
            {audio.map((f) => (
                <CfxBox className="flex flex-col gap-1 w-full max-w-[400px] justify-between" key={f.id}>
                    <span>{f.filename}</span>
                    <audio className="w-full" controls><source src={fileURL(f.id)} type={f.content_type}/></audio>
                </CfxBox>
            ))}
        </div>
    )
}


function PostStatsBar({nLikes, nDislikes, nViews, nReposts, nComments, myInitialReaction, onComment}) {
    const { currentUser } = useContext(cfxContext)
    const {postId} = useContext(postContext)

    const [myReaction, dispatchMyReaction] = useReducer((current, action) => {
        if(!currentUser)
            return
        else if(currentUser.id < 0) {
            alert('Войдите, чтобы оценивать посты!')
            return
        }

        const {value, silent} = action
        const newReaction = current == value? 0 : value

        if (silent) 
            return newReaction

        fetch(hostURL(`/set_post_reaction?post_id=${postId}&reaction=${newReaction}`), {credentials:'include'})
        .then(r => r.json())
        .then(r => {
            if(!r.success) throw Error()
            console.log(`Reaction "${newReaction}" was successfully submitted`)
        })
        .catch(() => console.log(`Reaction "${newReaction}" was not submitted`))

        return newReaction
    }, myInitialReaction)

    return (
        <div className="flex gap-1 items-center h-[30px]">
            <Button
                startIcon={myReaction == 1? <ThumbUpAltIcon/> : <ThumbUpOffAltIcon/>}
                onClick={() => dispatchMyReaction({value:1})}
            >{(nLikes - (myInitialReaction == 1) + (myReaction == 1)) || ''}</Button>
            <Button
                startIcon={myReaction == -1? <ThumbDownAltIcon/> : <ThumbDownOffAltIcon/>}
                onClick={() => dispatchMyReaction({value:-1})}
            >{(nDislikes - (myInitialReaction == -1) + (myReaction == -1)) || ''}</Button>
            <Button
                startIcon={<RedoIcon/>}
                href={'/new_post?fwd_id=' + postId}
                target="_blank"
            >{nReposts || ''}</Button>
            <Button
                startIcon={<CommentIcon/>}
                onClick={onComment}
            >{nComments || ''}</Button>

            
            {nViews > 0 && (
                <div className="opacity-50 ml-auto">
                    <span>{nViews} </span>
                    <RemoveRedEyeIcon/>
                </div>
            )}

        </div>
    )
}


function postCommentId(postId, postCommentId) {
    return `post_comment${postId}_${postCommentId}`
}

function ReplyNotation({replyTo, handleFocus}) {
    return <>
        <Link component="button" underline="hover" onClick={() => handleFocus(replyTo.id)}>{replyTo.author.tag}</Link>
        <span>, </span>
    </>
}

function PostCommentEntry({replyTo, onReplyAbort, onSubmit, manager}) {
    const { currentUser } = useContext(cfxContext)
    const inputRef = useRef()

    if (!currentUser || currentUser.id < 0)
        return <></>
    
    manager.focusOnCommentsRef.current = () => {
        scrollTo(inputRef.current, 500, false)
        inputRef.current.focus()
    }

    const tryToSubmit = () => {
        const text = trimMultilineText(inputRef.current.value)
        if (text.length > 0) {
            onSubmit(text, replyTo)
            .then(b => {
                if (b) inputRef.current.value = ''
            })
        }
    }

    const handleKeyDown = (e) => {
        if (e.key == 'Backspace' && !inputRef.current.value)
            onReplyAbort()
        else if (e.key == 'Enter' && !e.shiftKey)
            tryToSubmit()
    }

    const startAdornment = !replyTo? null : (
        <InputAdornment position="start">
            <ReplyNotation replyTo={replyTo} handleFocus={manager.setFocusedCommentId}/>
        </InputAdornment>
    )

    return (
        <div className="flex gap-2 w-full items-start">
            <Avatar src={fileURL(currentUser.avatar_file_id)}/>
            <TextField
                inputRef={inputRef}
                size="small"
                sx={{width:'100%'}}
                placeholder='Ваш комментарий'
                onKeyDown={handleKeyDown}
                maxRows={4}
                InputProps={{
                    startAdornment: startAdornment
                }}
            />
            <Button onClick={tryToSubmit}><SendIcon/></Button>
        </div>
    )

}

function scrollTo(element, offset, smooth) {
    window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY - offset,
        behavior: smooth? 'smooth': 'instant'
    })
}

function PostCommentThread({main, comments, nShownComments, manager}) {
    const {currentUser} = useContext(cfxContext)
    const {postId} = useContext(postContext)
    const commentElementRef = useRef()
    const nLikes = main.likes - (main.my_reaction == 1) + (manager.getCommentReaction(main.id) == 1)
    const [isHovered, setIsHovered] = useState(false)

    if (manager.focusedCommentId == main.id) {

        scrollTo(commentElementRef.current, 100, false)

        commentElementRef.current.classList.add('bg-gray-300')

        setTimeout(() => {
            commentElementRef.current.classList.remove('bg-gray-300')
            manager.setFocusedCommentId(null)
        }, 300)
    }

    return (
        <div className="w-full" id={postCommentId(postId, main.id)}>
            <div 
                className="grid grid-cols-[auto_1fr] w-full gap-x-1 gap-y-0 transition-colors duration-300 rounded-lg"
                ref={commentElementRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <a href={userURL(main.author)} className="row-start-1 row-end-4">
                    <Avatar src={fileURL(main.author.avatar_file_id)}/>
                </a>
                <Link href={userURL(main.author)} underline="hover">{main.author.username}</Link>
                
                <FormattedText text={main.text} renderAttachments={false}>
                    {main.replyTo && main.replyTo.threadMain != main.replyTo && (
                        <ReplyNotation replyTo={main.replyTo} handleFocus={manager.setFocusedCommentId}/>
                    )}
                </FormattedText>

                <div className="text-sm flex gap-2">

                    <span className="text-gray-700">{getPostDatetimeLabel(main.created_at)}</span>

                    {currentUser && currentUser.id > 0 && (
                        <Link 
                            onClick={() => {
                                manager.setReplyTo(main)
                                manager.focusOnComments()
                            }}
                            component="button"
                            underline="hover"
                        >
                            Ответить
                        </Link>
                    )}
                    {currentUser && currentUser.id == main.author.id && (
                        <Link onClick={() => manager.deleteComment(main)} component="button" underline="hover">Удалить</Link>
                    )}

                    <div 
                        className={`flex items-center ml-auto cursor-pointer ${!isHovered && nLikes == 0 && 'md:hidden'}`}
                        onClick={() => manager.toggleCommentReaction(main.id)}
                    >
                        {manager.getCommentReaction(main.id) == 1?
                            <FavoriteIcon fontSize="small" sx={{color:'gray'}}/> :
                            <FavoriteBorderIcon fontSize="small" sx={{color:'gray'}}
                        />}
                        {nLikes > 0 && <span>{nLikes}</span>}
                    </div>
                </div>
            </div>

            {comments && comments.length > 0 && (
                <div className="w-full flex flex-col box-border pl-5 md:pl-9 mt-2">
                    {comments.slice(0, nShownComments).map(c => (
                        <PostCommentThread
                            main={c}
                            comments={[]}
                            nShownComments={0}
                            manager={manager}
                            key={c.id}
                        />
                    ))}

                    {nShownComments < comments.length && (
                        <ShowMoreBar
                            wordForms={['ответ', 'ответа', 'ответов']}
                            nMore={Math.min(comments.length - nShownComments, SHOW_MORE_REPLIES_STEP)}
                            handleShow={() => manager.showMoreReplies(main.id)}
                        />
                    )}
                </div>
            )}

        </div>
    )
}

function ShowMoreBar({nMore, handleShow, wordForms}) {

    const wf = wordForms ?? ['комментарий', 'комментария', 'комментариев']

    return (
        <div className='text-center w-full'>
            <Link 
                component="button"
                underline="hover"
                onClick={handleShow}
            >Показать ещё {nItemsLabel(nMore, ...wf)}</Link>
        </div>
    )
}

function getThreadByMainId(threads, mainId) {
    const idx = threads.findIndex((t) => t.main.id == mainId)
    return [idx, idx < 0? null : threads[idx]]
}

function editThread(threads, mainId, f) {
    const [idx, thread] = getThreadByMainId(threads, mainId)

    if(!thread)
        return threads

    const updatedThread = f(thread)

    return [...threads.slice(0, idx), updatedThread, ...threads.slice(idx + 1)]
}

function newArrWithInsertion(arr, n, newElement) {
    return [...arr.slice(0, n), newElement, ...arr.slice(n)]
}

function PostCommentSection({comments, focusOnCommentsRef}) {
    const [replyTo, setReplyTo] = useState(null)
    const [focusedCommentId, setFocusedCommentId] = useState(null)
    const { postId } = useContext(postContext)
    const {currentUser } = useContext(cfxContext)
    const [nShownThreads, setNShownThreads] = useState(DEFAULT_VISIBLE_THREADS)
    const [threadSorting, setThreadSorting] = useState('TIME_ASC')

    const [threads, dispatchThreads] = useReducer((threads, action) => {

        if (action.type == 'SORT') {
            const f = {
                'TIME_ASC': (a, b) => a.main.created_at - b.main.created_at,
                'TIME_DESC': (a, b) => -(a.main.created_at - b.main.created_at),
                'LIKES': (a, b) => -a.main.likes + b.main.likes
            }[action.method]

            setNShownThreads(DEFAULT_VISIBLE_THREADS)

            const newThreads = threads.map(t => {
                return {...t, nShownReplies: DEFAULT_VISIBLE_REPLIES}
            })

            newThreads.sort(f)

            return newThreads
        }
        else if (action.type == 'INSERT' && !action.comment.replyTo) {
            const comment = {main: action.comment, replies: [], nShownReplies: 0}
            setNShownThreads(nShownThreads + 1)
            return newArrWithInsertion(threads, nShownThreads, comment)
        }
        else if(action.type == 'DELETE' && !action.comment.replyTo) {
            const newThreads = threads.filter((t) => t.main.id != action.comment.id)
            setNShownThreads(newThreads.length)
            return newThreads
        }
        else if(action.type == 'INSERT' && action.comment.replyTo) {
            return editThread(threads, action.comment.threadMain.id,
                (t) => {
                    return {
                        ...t,
                        replies: newArrWithInsertion(t.replies, t.nShownReplies, action.comment),
                        nShownReplies: t.nShownReplies + 1
                    }
                })
        }
        else if(action.type == 'DELETE' && action.comment.replyTo) {
            return editThread(threads, action.comment.threadMain.id,
                (t) => {
                    const newReplies = t.replies.filter(r => r.id != action.comment.id)
                    return {
                       ...t,
                       replies: newReplies,
                       nShownReplies: newReplies.length 
                    }
                })
        }
        else if(action.type == 'SHOW_MORE_REPLIES') {
            return editThread(threads, action.threadMainId,
                (t) => {
                    return {
                        ...t,
                        nShownReplies: t.nShownReplies + SHOW_MORE_REPLIES_STEP       
                    }
                })
        }

        return threads

    }, null, () => {
        const d = {}
        const threads = {}
        
        comments.forEach(c_ => {
            const c = {...c_, created_at: new Date(c_.created_at)}

            if(!c.reply_to_id) {
                threads[c.id] = {main: c, replies: [], nShownReplies: DEFAULT_VISIBLE_REPLIES}
                c.threadMain = c
            }
            else if (d[c.reply_to_id]) {
                c.replyTo = d[c.reply_to_id]
                c.threadMain = d[c.reply_to_id].threadMain
                threads[c.threadMain.id].replies.push(c)
            }
            else
                return
            
            d[c.id] = c
        })

        return Object.values(threads)
    })

    const [commentReactions, dispatchCommentReaction] = useReducer(
        (reactions, action) => {
            if (!currentUser)
                return reactions
            else if(currentUser.id < 0) {
                alert('Войдите, чтобы оценивать комментарии!')
                return reactions
            }

            // SET OR TOGGLE
            const oldReaction = reactions[action.postCommentId] ?? 0
            const currentReaction = action.type == 'SET'? action.reaction : 1 - oldReaction
            const w = {...reactions}
            w[action.postCommentId] = currentReaction

            if(action.silent)
                return w
            
            fetch(hostURL(`/set_post_comment_reaction?reaction=${currentReaction}&comment_id=${action.postCommentId}`),
                {credentials:'include'})
            .then(r => r.json())
            .then(r => {
                if (!r.success)
                    throw Error()
                console.log(`Successfully submitted "${currentReaction}" reaction to a comment`)
            })
            .catch(() => {
                console.log(`An error occured while submitting "${currentReaction}" reaction to a comment`)
                //dispatchCommentReaction({type: 'SET', silent:true, reaction: oldReaction, postCommentId: action.postCommentId})
            })

            return w

        }, null, () => {
            const d = {}
            comments.forEach((c) => {
                d[c.id] = c.my_reaction
            })
            return d
        }
    )

    function getCommentReaction(commentId) {
        return commentReactions[commentId] ?? 0
    }

    const deleteComment = (comment) => {
        if(!currentUser || currentUser.id < 0 || !confirm('Удалить комментарий?'))
            return

        fetch(hostURL('/delete_post_comment?comment_id=' + comment.id),
            {credentials:'include'})
        .then(r => r.json())
        .then(r => {
            if(!r.success)
                throw Error()
            dispatchThreads({type: 'DELETE', comment:comment})
        })
        .catch(() => {
            alert('Не удалось удалить комментарий...')
        })
    }

    const submitComment = (text) => {
        return fetch(hostURL('/leave_comment'), {
            credentials:'include',
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({
                text: text,
                reply_to_id: replyTo? replyTo.id : null, 
                post_id: postId
            })
        })
        .then(r => r.json())
        .then(r => {
            if (!r.success || !r.comment)
                throw Error()

            const c = r.comment

            c.created_at = new Date(c.created_at)
            c.replyTo = replyTo
            c.threadMain = replyTo? replyTo.threadMain : c

            dispatchThreads({comment: c, type: 'INSERT'})
            setReplyTo(null)

            return true
        })
        .catch(() => {
            alert('Произошла ошибка!')
            return false
        })
    }

    const mgr = {
        setReplyTo,
        getCommentReaction,
        focusedCommentId,
        setFocusedCommentId,
        toggleCommentReaction: (postCommentId) => dispatchCommentReaction({type: 'TOGGLE', postCommentId}),
        deleteComment,
        showMoreReplies: (threadMainId) => dispatchThreads({type: 'SHOW_MORE_REPLIES', threadMainId}),
        focusOnComments: focusOnCommentsRef.current,
        focusOnCommentsRef
    }

    if (threads.length == 0 && (!currentUser || currentUser.id < 0))
        return <></>

    return (
        
        <div className="flex flex-col gap-1">
            {threads.length > N_THREADS_SORT_AVAILABLE && (
                <div className="flex gap-1 items-center py-2">
                    <span>Сортировать:</span>
                    <Select
                        value={threadSorting}
                        onChange={e => {
                            const val = e.target.value
                            dispatchThreads({type: 'SORT', method: val})
                            setThreadSorting(val)
                        }}
                        sx={{ fontSize: 15, height: 10, paddingX: 0, paddingY:1.5  }}
                    >
                        <MenuItem value='TIME_ASC'>Сначала старые</MenuItem>
                        <MenuItem value='TIME_DESC'>Сначала новые</MenuItem>
                        <MenuItem value='LIKES'>Сначала популярные</MenuItem>
                    </Select>
                    
                </div>

            )}
        
            {threads.slice(0, nShownThreads).map((thread, i) => (
                <PostCommentThread
                    key={i}
                    main={thread.main}
                    comments={thread.replies}
                    manager={mgr}
                    nShownComments={thread.nShownReplies}
                />
            ))}

            {nShownThreads < threads.length && (
                <ShowMoreBar
                    nMore={Math.min(threads.length - nShownThreads, SHOW_MORE_THREADS_STEP)}
                    handleShow={() => setNShownThreads(nShownThreads + SHOW_MORE_THREADS_STEP)}
                />
            )}

            <div className="w-full mt-1">
                <PostCommentEntry
                    onSubmit={submitComment}
                    replyTo={replyTo}
                    onReplyAbort={() => setReplyTo(null)}
                    manager={mgr}
                />
            </div>

        </div>

    )

}

export default function Post({ data, isCompact}) {
    const focusOnComments = useRef(() => {})
    const {currentUser} = useContext(cfxContext)
    const [actionMenuAnchor, setActionMenuAnchor] = useState(null)
    const [reactions, setReactions] = useState(null)
    const [reactionsType, setReactionsType] = useState(0)
    const [isDeleted, setDeleted] = useState(data.is_deleted)


    const showReactions = () => {
        quickFetch('/get_post_reactions/' + data.id)
        .then(r => {
            if(!r.success)
                throw Error()
            setReactions({
                likes: r.likes,
                dislikes: r.dislikes
            })
            setReactionsType(0)
        })
        .catch(() => alert('Не удалось загрузить реакции!'))
    }

    const deletePost = () => {
        if(!currentUser || currentUser.id != data.author.id || !confirm('Подтвердите удаление'))
            return

        quickFetch('/delete_post/' + data.id)
        .then(r => {
            if(!r.success)
                throw Error()
            setDeleted(true)
        })
        .catch(() => alert('Не удалось удалить пост!'))
    }

    if (isDeleted)
        return (
            <div className="bg-gray-200 shadow-md rounded-lg p-3 w-full flex flex-col gap-2">
                Пост был удален.
            </div>
        )

    return (
        <postContext.Provider value={{postId: data.id}}>
            <CfxBox className="shadow-md w-full p-3 flex flex-col gap-2">

                {Date.now() < new Date(data.created_at) && (
                    <span className="text-lg text-green-700">Отложен</span>
                )}

                <div className="w-full flex justify-between items-start">
                    <AvatarNameDescriptionWidget user={data.author} description={getPostDatetimeLabel(new Date(data.created_at))}/>
                    {!isCompact && <IconButton onClick={e => setActionMenuAnchor(e.currentTarget)}><MoreHorizIcon/></IconButton>}
                </div>
                <FormattedText text={data.text} title={data.title} renderAttachments={true}/>
                <PostVisualFiles files={data.files} isCompact={isCompact}/>
                <PostAudioFiles files={data.files}/>
                <PostOtherFiles files={data.files}/>

                {data.fwd_post && (
                    <Post data={data.fwd_post} isCompact={true}/>
                )}

                {data.poll && <Poll data={data.poll}/> }

                { !isCompact && (
                    <>
                        <PostStatsBar
                            nLikes={data.likes}
                            nDislikes={data.dislikes}
                            myInitialReaction={data.my_reaction}
                            nViews={data.views}
                            nReposts={data.nReposts}
                            nComments={0}
                            onComment={focusOnComments.current}
                        />

                        <PostCommentSection
                            focusOnCommentsRef={focusOnComments}
                            comments={data.comments}
                        />
                    </>
                )}
            </CfxBox>

            <Menu
                id="action-menu"
                anchorEl={actionMenuAnchor}
                open={Boolean(actionMenuAnchor)}
                onClose={() => setActionMenuAnchor(null)}
            >
                <MenuItem 
                    onClick={() => {
                        showReactions()
                        setActionMenuAnchor(null)
                    }}
                >
                    Реакции
                </MenuItem>
                <MenuItem 
                    onClick={() => {
                        navigator.clipboard.writeText(hostURL('/post/' + data.id))
                        setActionMenuAnchor(null)
                    }}
                >
                    Копировать ссылку
                </MenuItem>
                {currentUser && currentUser.id == data.author.id && (
                    <MenuItem 
                        onClick={() => {
                            deletePost()
                            setActionMenuAnchor(null)
                        }}>
                            Удалить
                        </MenuItem>
                )}
            </Menu>

            <Dialog
                open={Boolean(reactions)}
                onClose={() => setReactions(null)}
            >
                
                {reactions && (
                    <DialogContent>
                        <Tabs value={reactionsType} onChange={(_, t) => setReactionsType(t)}>
                            <Tab label={`Понравилось (${reactions.likes.length})`}/>
                            <Tab label={`Не понравилось (${reactions.dislikes.length})`}/>
                        </Tabs>
                        
                        <div className="mt-5">
                            <UserListWithActions 
                                emptyMessage="Пусто"
                                users={!reactions? [] : reactionsType == 0? reactions.likes : reactions.dislikes}
                                actions={() => null}
                            />
                        </div>

                    </DialogContent>
                )}

                <DialogActions>
                    <Button onClick={() => setReactions(null)}>Закрыть</Button>
                </DialogActions>
            </Dialog>

        </postContext.Provider>
    )

}