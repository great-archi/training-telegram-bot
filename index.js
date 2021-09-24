const telegramApi = require('node-telegram-bot-api')
const mongoose = require('mongoose')
const User = require('./models')
const {gameOptions, againOptions} = require('./options')

const mongoUrl = 'mongodb+srv://admin:Y2ld7NGM6ZpizFPA@cluster0.ytufg.mongodb.net/tgbot?retryWrites=true&w=majority'
const token = '2039729647:AAEN0eU9ViRCwiWLZ1RmH3qpm0HGjfNmQv4'

const bot = new telegramApi(token, {polling: true})
const chats = {}

const createRandomNumber = async chatId => {
  chats[chatId] = Math.floor(Math.random() * 10)
  await bot.sendMessage(chatId, 'Отгадывай)', gameOptions)
}

const start = async () => {
  try {
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
  } catch (e) {
    console.log('Не удалось подключиться к БД', e)
  }


  bot.setMyCommands([
    {command: '/start', description: 'Начальное приветсвие'},
    {command: '/game', description: 'Начать новую игру'},
    {command: '/info', description: 'Статистика'}
  ])

  bot.on('message', async msg => {
    const text = msg.text
    const chatId = msg.chat.id

    try {
      const user = await User.findOne({chatId})
      if (text === '/start') {
        if (!user) {
          const user = new User({chatId})
          await user.save()
        }
        return bot.sendMessage(chatId, `Привет, ${msg.from.first_name}\nМеня сделал Арчи и пока он просто балуется, но скоро я всему научусь)`)
      }
      if (text === '/game') {
        await bot.sendMessage(chatId, 'Я загадаю число от 0 до 9, а ты должен его угадать!')
        return createRandomNumber(chatId)
      }
      if (text === '/info') {
        return bot.sendMessage(chatId, `Отгадано: ${user.right}\nПровалено: ${user.wrong}`)
      }
      return bot.sendMessage(chatId, 'Я не знаю такой команды...')
    } catch (e) {
      return bot.sendMessage(chatId, 'Извините, произошла ошибка')
    }
  })

  bot.on('callback_query', async msg => {
    const chatId = msg.message.chat.id
    const data = msg.data
    try {
      const user = await User.findOne({chatId})
      if (data === '/again') {
        return createRandomNumber(chatId)
      }

      if (Number(data) === chats[chatId]) {
        user.right++
        await bot.sendMessage(chatId, `Поздавляю! Ты угадал цифру ${chats[chatId]}`, againOptions)
      } else {
        user.wrong++
        await bot.sendMessage(chatId, `Не верно! Я загадал ${chats[chatId]}`, againOptions)
      }
      await user.save()
    } catch (e) {
      return bot.sendMessage(chatId, 'Извините, произошла ошибка')
    }
  })
}

start()