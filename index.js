const telegramApi = require('node-telegram-bot-api')
const mongoose = require('mongoose')
const config = require('config')
const User = require('./models')
const {gameOptions, againOptions} = require('./options')

const bot = new telegramApi(config.get('token'), {polling: true})
const chats = {}

const createRandomNumber = async chatId => {
  chats[chatId] = Math.floor(Math.random() * 10)
  await bot.sendMessage(chatId, 'Угадывай)', gameOptions)
}

const start = async () => {
  try {
    await mongoose.connect(config.get('mongoUrl'), {
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
        return bot.sendMessage(chatId, `Привет, ${msg.from.first_name} 👋\n
Список доступных команд:
/game - игра "Угадай число"
/info - статистика по играм\n
Приятной игры 😉`)
      }
      if (text === '/game') {
        await bot.sendMessage(chatId, 'Я загадаю число от 0 до 9, а ты должен его угадать!')
        return createRandomNumber(chatId)
      }
      if (text === '/info') {
        return bot.sendMessage(chatId, `*Ваша статистика:*
Верно: ${user.right}
Неверно: ${user.wrong}`, {parse_mode: 'MarkdownV2'} )
      }
      return bot.sendMessage(chatId, 'Я не знаю такой команды...')
    } catch (e) {
      return bot.sendMessage(chatId, 'Извините, произошла ошибка')
    }
  })

  bot.on('callback_query', async query => {
    const msgId = query.message.message_id
    const chatId = query.message.chat.id
    const data = query.data
    try {
      const user = await User.findOne({chatId})
      if (data === '/again') {
        await bot.deleteMessage(chatId, msgId)
        return createRandomNumber(chatId)
      }

      await bot.deleteMessage(chatId, msgId)
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