


export function PSWP_obj({src, width, height, isVideo, isCropped, innersx, outersx}) {
    return (
        <a
            href={src}
            data-pswp-width={width}
            data-pswp-height={height}
            data-pswp-type={isVideo? 'video': ''}
            data-cropped={isCropped? "true" : "false"}
            target="_blank"
            className="w-full h-full block"
            style={outersx}
        >
            {!isVideo && <img className="w-full h-full" style={innersx} src={src} alt="" />}
            {isVideo && <video className="w-full h-full" style={innersx} src={src} preload="metadata"></video>}
        </a>
    )
}
