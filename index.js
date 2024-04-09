const readline = require('readline-sync')

function start()
{
    const content = {}
    
    content.searchTerm = askAndReturnSeachTerm()
    content.prefixe = askAndReturnPrefix()

    function askAndReturnSeachTerm()
    {
        return readline.question('Type a Wikipidia search term: ')
    }

    function askAndReturnPrefix()
    {
        const prefixes = ['Who is', 'What is', 'The history of']
        const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Chose one option: ')
        const selectedPrefixText = prefixes[selectedPrefixIndex]

        return selectedPrefixText
    }

    console.log(content)
}

start()