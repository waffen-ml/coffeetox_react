import { useState, useRef, useEffect, useContext } from 'react'
import { fileURL, getPostDatetimeLabel, cfxContext, hostURL } from '../utils'


export default function Post({ id }) {
    const [data, setData] = useState({loading: 1})
    const { inspectMedia } = useContext(cfxContext)

    useEffect(() => {
        fetch(hostURL(`post/json/${id}?file_metadata=1`))
        .then(r => r.json()).then(r => {
            if (!r.success)
                throw Error('failed to load the post')

            r.post.datetime = new Date(r.post.datetime)
            setData(r.post)

        }).catch(() => {
            console.log('failed to load post: ' + id)
            setData({failed: 1})
        })
    }, [])

    const notReadyReason = data.loading? 'Post is loading...' : data.failed? 'Failed to load the post.' : ''

    if (notReadyReason)
        return <div className="bg-gray-200 shadow-md rounded-lg p-3 w-full flex flex-col gap-1">{notReadyReason}</div>
    
    const clfFiles = {'image': [], 'video': [], 'audio': [], 'other': []}
    data.files.forEach(f => clfFiles[f.primitive_type].push(f))

    const visualFiles = clfFiles.image.concat(clfFiles.video)
    const nBigMediaTiles = visualFiles.length % 3 == 1? 4 : visualFiles.length % 3 == 0? 0 : 2

    const inspectVisualFilesAt = (i) => {
        inspectMedia({
            files: visualFiles,
            at: i
        })
    }

    return (
        <div className="bg-gray-200 shadow-md rounded-lg p-3 w-full flex flex-col gap-1">
            <span>{getPostDatetimeLabel(data.datetime)}</span>
            
            {data.title && <h2 className="text-2xl font-bold mb-0">{data.title}</h2>}
            {data.body && <p>{data.body}</p>}

            {visualFiles.length == 1 && clfFiles.image.length == 1 && <img className="w-full object-contain max-h-[450px] bg-gray-100 rounded-lg cursor-pointer" onClick={() => inspectVisualFilesAt(0)} src={fileURL(clfFiles.image[0].id)}/>}
            {visualFiles.length == 1 && clfFiles.video.length == 1 && <video className="w-full max-h-[450px] bg-gray-100 rounded-lg" controls><source src={fileURL(visualFiles[0].id)} type={visualFiles[0].content_type}/></video>}

            {visualFiles.length > 1 && (
                <div className="grid grid-cols-6 gap-2 ">
                    {clfFiles.image.map((f, i) => (
                        <img className={`bg-gray-300 cursor-pointer object-cover h-full w-full rounded-md ${i < nBigMediaTiles? 'col-span-3' : 'col-span-2'}`} onClick={() => inspectVisualFilesAt(i)} key={f.id} src={fileURL(f.id)}/>
                    ))}
                    {clfFiles.video.map((f, i) => (
                        <video className={`bg-gray-300 cursor-pointer object-cover h-full w-full rounded-md ${i + clfFiles.image.length < nBigMediaTiles? 'col-span-3' : 'col-span-2'}`} onClick={() => inspectVisualFilesAt(clfFiles.image.length + i)} key={f.id} width="320" height="240" preload="metadata"><source src={fileURL(f.id)} type={f.content_type}/></video>
                    ))}
                </div>
            )}
            
            {clfFiles.audio.map(f => (
                <div className="bg-gray-300 p-2 rounded-lg flex flex-col gap-1 overflow-hidden w-[400px] max-w-full" key={f.id}>
                    <span>{f.filename}</span>
                    <audio className="w-full" controls><source src={fileURL(f.id)} type={f.content_type}/></audio>
                </div>
            ))}

            {clfFiles.other.length > 0 && (
                <div style={{'width': 'max-content'}} className="bg-gray-300 rounded-lg p-2 max-w-full">
                    <u>Прикрепленные файлы</u>
                    <ul className="list-disc pl-5">
                        {clfFiles.other.map(f => (
                            <li key={f.id}><a target="_blank" href={fileURL(f.id)}>{f.filename}</a></li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )


}