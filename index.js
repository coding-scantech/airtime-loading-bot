import dotenv from "dotenv"
import axios from "axios"
import { v4 as uuidv4 } from "uuid"
import TelegramBot from "node-telegram-bot-api"

dotenv.config()

// ------------------ CONFIG ------------------

const {
  MTEJA_URL,
  MTEJA_APP_ID,
  MTEJA_API_KEY,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
} = process.env

// ------------------ UTILS ------------------

function formatPhoneNumber(raw) {
  if (!raw) return null

  const cleaned = raw
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^0-9+]/g, "")

  if (/^\+254\d{9}$/.test(cleaned)) return cleaned
  if (/^254\d{9}$/.test(cleaned)) return `+${cleaned}`
  if (/^0[17]\d{8}$/.test(cleaned)) return `+254${cleaned.slice(1)}`
  if (/^[17]\d{8}$/.test(cleaned)) return `+254${cleaned}`

  return null
}

async function sendAirtime(phoneNumber) {
  try {
    const response = await axios.post(
      MTEJA_URL,
      {
        appId: parseInt(MTEJA_APP_ID),
        amount: 5,
        useLocalAmount: true,
        idempotencyInMinutes: 1,
        to: [phoneNumber],
        tags: ["telegram-bot"],
        referenceId: "",
        requestId: uuidv4(),
      },
      {
        headers: {
          "x-app-id": MTEJA_APP_ID,
          "x-api-key": MTEJA_API_KEY,
          "Content-Type": "application/json",
        },
      }
    )

    const success = response?.data?.success

    if (success) {
      await bot.sendMessage(TELEGRAM_CHAT_ID, "✅ Airtime loaded successfully")
    } else {
      await bot.sendMessage(TELEGRAM_CHAT_ID, `❌ ${response?.data?.reason}`)
    }
  } catch (error) {
    await bot.sendMessage(TELEGRAM_CHAT_ID, `❌ ${error.message}`)
  }
}

//  ------------------ TELEGRAM BOT SETUP ------------------

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })

bot.on("polling_error", (err) => {
  console.error("[Telegram polling error]", err.message)
})

console.log("🤖 Telegram bot started. Waiting for messages...")

// Listen for messages
bot.on("message", async (message) => {
  const { text } = message

  // Check text  to see if it is a number
  const formattedNumber = formatPhoneNumber(text)

  if (!formattedNumber) {
    // Invalid format
    await bot.sendMessage(
      TELEGRAM_CHAT_ID,
      "📱 Invalid format.Send a valid number like 0712345678 or +254712345678"
    )
  } else {
    // Load airtime , everything OK!
    sendAirtime(formattedNumber)
  }
})
