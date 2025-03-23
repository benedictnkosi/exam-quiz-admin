import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel with your project token
mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '', {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: true,
    persistence: 'localStorage'
});

export const logAnalyticsEvent = (eventName: string, properties: Record<string, any>) => {
    try {
        mixpanel.track(eventName, properties);
    } catch (error) {
        console.error('Error logging analytics event:', error);
    }
};

export const identifyUser = (userId: string, userProperties: Record<string, any>) => {
    try {
        mixpanel.identify(userId);
        mixpanel.people.set(userProperties);
    } catch (error) {
        console.error('Error identifying user:', error);
    }
}; 