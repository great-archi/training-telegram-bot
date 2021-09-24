const telegramApi = require('node-telegram-bot-api')
const {gameOptions, againOptions} = require('./options')

const token = '2039729647:AAEN0eU9ViRCwiWLZ1RmH3qpm0HGjfNmQv4'
const bot = new telegramApi(token, {polling: true})
const chats = {}

const createRandomNumber = async chatId => {
  await bot.sendMessage(chatId, 'Я загадаю число от 0 до 9, а ты должен его угадать!')
  chats[chatId] = Math.floor(Math.random() * 10)
  await  bot.sendMessage(chatId, 'Отгадывай)', gameOptions)
}

const start = () => {
  bot.setMyCommands([
    {command: '/start', description: 'Начальное приветсвие'},
    {command: '/game', description: 'Начать новую игру'}
  ])

  bot.on('message', async msg => {
    const text = msg.text
    const chatId = msg.chat.id
    if (text === '/start') {
        return bot.sendMessage(chatId, `Привет, ${msg.from.first_name}\nМеня сделал Арчи и пока он просто балуется, но скоро я всему научусь)`)
    }
    if (text === '/game') {
      return createRandomNumber(chatId)
    }
    return bot.sendMessage(chatId, 'Я не знаю такой команды...')
  })

  bot.on('callback_query', async msg => {
    const data = msg.data
    const chatId = msg.message.chat.id

    if (data === '/again') {
      return createRandomNumber(chatId)
    }

    if (Number(data) === chats[chatId]) {
      return await bot.sendMessage(chatId, `Поздавляю! Ты угадал цифру ${chats[chatId]}`, againOptions)
    } else {
      return bot.sendMessage(chatId, `Не верно! Я загадал ${chats[chatId]}`, againOptions)
    }
  })
}

start()