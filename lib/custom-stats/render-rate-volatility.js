// stores the last 8 FPS per incoming video
const rollingFpsSamples = {};

const pushFpsSamples = (inboundRtpStats) => {
    inboundRtpStats.forEach(stat => {
        const { trackIdentifier, framesPerSecond } = stat.data || {};
        if (!trackIdentifier || isNaN(framesPerSecond)) return;

        const sample = rollingFpsSamples[trackIdentifier] = rollingFpsSamples[trackIdentifier] || [];

        if (sample.length >= 8) sample.shift();

        sample.push(framesPerSecond);
    });
};

const getRenderRateVolatilityStat = (fpsSample, trackIdentifier) => {
    const meanFps = fpsSample.reduce((sum, currentFps) => {
        return sum + currentFps;
    }, 0) / fpsSample.length;

    const latestFps = fpsSample[fpsSample.length - 1];

    const renderRateVolatility = (Math.abs(latestFps - meanFps) * 100) / meanFps;

    return ({
        type: 'coviuRenderRateVolatility',
        data: {
            trackIdentifier,
            renderRateVolatility
        }
    });
};

module.exports = (stats) => {
    const inboundRtpStats = stats.filter(stat => stat.type === 'inboundRtp' 
            && stat.data?.kind === 'video'
            && !!stat.data?.trackIdentifier
        );
    pushFpsSamples(inboundRtpStats);

    const renderRateVolatilities = Object.keys(rollingFpsSamples).map(trackId => {
        const sample = rollingFpsSamples[trackId];
        return getRenderRateVolatilityStat(sample, trackId);
    });

    return renderRateVolatilities;
};