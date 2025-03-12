//const API_HOST = 'https://api.examquiz.co.za'
const API_HOST = 'http://localhost:3000' // Uncomment for local development

const API_BASE_URL = `/api`
const IMAGE_BASE_URL = `https://ozhhkdhtddoznswtplbx.supabase.co/storage/v1/object/public/question_images/`
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY

module.exports = {
    API_HOST,
    API_BASE_URL,
    IMAGE_BASE_URL,
    OPENAI_API_KEY
}