

/*

<iframe 
    width="1239" height="697"
    src="https://www.youtube.com/embed/430C4T4EeLU"
    title="Kotaro the Otter Scared of Cat Rug" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

<iframe width="482" height="857" src="https://www.youtube.com/embed/88UhikqjWbk" title="Never Put Up A Beware Of Dog Sign" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

*/



export default function YoutubePlayer({id, title}) {
    const url = `https://www.youtube.com/embed/${id}`

    return (
        <iframe
            className="w-full h-full"
            src={url}
            title={title}
            
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
        > 
        </iframe>
    )
}