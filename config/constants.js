//const API_HOST = 'http://127.0.0.1:8000'
const API_HOST = process.env.NEXT_PUBLIC_HOST_URL || 'https://examquiz.dedicated.co.za' // Uncomment for local development

const API_BASE_URL = `${API_HOST}/public/learn`
const IMAGE_BASE_URL = `${API_HOST}/public/learn/learner/get-image?image=`
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY

module.exports = {
    API_HOST,
    API_BASE_URL,
    IMAGE_BASE_URL,
    OPENAI_API_KEY
}