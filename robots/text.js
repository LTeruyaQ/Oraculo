// const algorithmia = require('algorithmia')
// const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const readline = require('readline-sync')
const sentenceBoundaryDetection = require('sbd')
const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const wikipedia = require('./wikipedia.js')
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')

const nlu = new NaturalLanguageUnderstandingV1({
  iam_apikey: watsonApiKey,
  version: '2018-04-05',
  url: 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/eddf63f0-481a-4649-bc73-f4211052548a'
})

const state = require('./state.js')

async function Text() {

  const content = state.load()
  
  content.wikiPediaContent = await wikipedia(content)
  sanitizeContent(content)
  breakContentIntoSentences(content)
  limitMaximumSentences(content)
  await fetchKeywordsOfAllSentences(content)

  state.save(content)

  console.log('Build Sentences')


  function sanitizeContent(content) {

    const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.wikiPediaContent.content)
    const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)

    content.wikiPediaContent.content = withoutDatesInParentheses

    function removeBlankLinesAndMarkdown(text) {
      
      console.log(text)
      const allLines = text.split("\r\n")

      const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
        if (line.trim().length === 0 || line.trim().startsWith('=')) {
          return false
        }

        return true
      })

      return withoutBlankLinesAndMarkdown.join(' ')
    }
  }

  function removeDatesInParentheses(text) {
    return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
  }

  function breakContentIntoSentences(content) {
    content.sentences = []

    const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
    sentences.forEach((sentence) => {
      content.sentences.push({
        text: sentence,
        keywords: [],
        images: []
      })
    })
  }

  function limitMaximumSentences(content) {
    content.sentences = content.sentences.slice(0, content.maximumSentences)
  }

  async function fetchKeywordsOfAllSentences(content) {
    for (const sentence of content.sentences) {
      sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
    }
  }

  async function fetchWatsonAndReturnKeywords(sentence) {
    return new Promise((resolve, reject) => {
      nlu.analyze({
        text: sentence,
        features: {
          keywords: {}
        }
      }, (error, response) => {
        if (error) {
          throw error
        }

        const keywords = response.keywords.map((keyword) => {
          return keyword.text
        })

        resolve(keywords)
      })
    })
  }
}

module.exports = Text